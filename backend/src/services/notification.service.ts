import { query } from '../utils/db';
import { NotificationType } from '../models/types';
import { broadcastToUser } from '../sockets';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'SYSTEM',
  incidentId?: string
) {
  try {
    const res = await query(
      `INSERT INTO notifications (user_id, incident_id, type, title, message)
       VALUES ($1, $2, $3::notification_type, $4, $5)
       RETURNING *`,
      [userId, incidentId || null, type, title, message]
    );

    const notification = res.rows[0];
    
    // Broadcast via socket to user if connected
    broadcastToUser(userId, 'notification', notification);

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}
