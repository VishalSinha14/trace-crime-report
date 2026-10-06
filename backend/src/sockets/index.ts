import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/auth';

let io: SocketIOServer | null = null;

export function initializeSockets(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = verifyToken(token);
        socket.data.user = decoded;
      } catch (err) {
        // Allow connection even without token, as guest
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    if (user) {
      socket.join(`user:${user.id}`);
      socket.join(`role:${user.role}`);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔌 Socket connected: ${user.email} (${user.role}) [${socket.id}]`);
      }
    } else {
      socket.join('public');
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔌 Guest socket connected [${socket.id}]`);
      }
    }

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔌 Socket disconnected [${socket.id}]`);
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function broadcastToUser(userId: string, event: string, data: unknown) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function broadcastToRole(role: string, event: string, data: unknown) {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
}

export function broadcastPublic(event: string, data: unknown) {
  if (io) {
    io.emit(event, data);
  }
}
