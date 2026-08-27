import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { AuthPayload, verifyAccessToken } from '../middleware/auth';
import { logger } from '../utils/logger';

export function initializeWebSocket(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Same checks as the HTTP authenticate middleware (signature, not a
    // refresh token, not blacklisted, sessionVersion current) — previously
    // this only verified the JWT signature, so a logged-out or
    // password-reset session could keep an open socket connection.
    verifyAccessToken(token)
      .then((payload) => {
        (socket as any).auth = payload;
        next();
      })
      .catch(() => next(new Error('Invalid token')));
  });

  io.on('connection', (socket: Socket) => {
    const auth = (socket as any).auth as AuthPayload;
    const practiceRoom = `practice:${auth.practiceId}`;

    socket.join(practiceRoom);
    logger.debug({ providerId: auth.providerId }, 'WebSocket client connected');

    socket.on('disconnect', () => {
      logger.debug({ providerId: auth.providerId }, 'WebSocket client disconnected');
    });
  });

  return io;
}
