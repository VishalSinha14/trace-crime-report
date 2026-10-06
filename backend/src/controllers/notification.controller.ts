import { Request, Response } from 'express';
import { query } from '../utils/db';

export async function getMyNotifications(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { unreadOnly } = req.query;

  try {
    let sql = `
      SELECT n.*, i.category AS incident_category, i.status AS incident_status
      FROM notifications n
      LEFT JOIN incidents i ON n.incident_id = i.id
      WHERE n.user_id = $1
    `;

    if (unreadOnly === 'true') {
      sql += ' AND n.read = false';
    }

    sql += ' ORDER BY n.created_at DESC LIMIT 50';

    const result = await query(sql, [user.id]);
    res.json({
      notifications: result.rows,
    });
  } catch (err: any) {
    console.error('getMyNotifications error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve notifications.' });
  }
}

export async function markAsRead(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  try {
    const result = await query(
      `UPDATE notifications
       SET read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Notification not found.' });
      return;
    }

    res.json({ message: 'Notification marked as read.', notification: result.rows[0] });
  } catch (err: any) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update notification.' });
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  try {
    await query(
      `UPDATE notifications
       SET read = true
       WHERE user_id = $1 AND read = false`,
      [user.id]
    );

    res.json({ message: 'All notifications marked as read.' });
  } catch (err: any) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update notifications.' });
  }
}
