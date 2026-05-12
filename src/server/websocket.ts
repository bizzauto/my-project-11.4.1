// @ts-nocheck
import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { redisClient } from './redis.js';

interface AuthenticatedSocket extends any {
  userId?: string;
  businessId?: string;
  plan?: string;
}

export function setupWebSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.userId;
      socket.businessId = decoded.businessId;
      socket.plan = decoded.plan || 'FREE';
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`🔌 User connected: ${socket.userId} (Business: ${socket.businessId})`);

    // Join user's business room
    if (socket.businessId) {
      socket.join(`business:${socket.businessId}`);
    }

    // Join user's personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Store connection in Redis
    if (redisClient) {
      await redisClient?.hSet(`socket:${socket.userId}`, {
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
        plan: socket.plan || 'FREE',
      });
    }

    // Handle real-time messaging
    socket.on('send:message', async (data) => {
      const { contactId, message, type } = data;
      
      // Emit to relevant room
      io.to(`business:${socket.businessId}`).emit('new:message', {
        contactId,
        message,
        type,
        senderId: socket.userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle typing indicator
    socket.on('typing:start', (data) => {
      socket.to(`business:${socket.businessId}`).emit('user:typing', {
        userId: socket.userId,
        contactId: data.contactId,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`business:${socket.businessId}`).emit('user:stopped', {
        userId: socket.userId,
        contactId: data.contactId,
      });
    });

    // Handle order status updates
    socket.on('order:update', async (data) => {
      const { orderId, status } = data;
      io.to(`business:${socket.businessId}`).emit('order:changed', {
        orderId,
        status,
        updatedBy: socket.userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle CRM lead updates
    socket.on('lead:update', async (data) => {
      const { contactId, stage, dealValue } = data;
      io.to(`business:${socket.businessId}`).emit('lead:changed', {
        contactId,
        stage,
        dealValue,
        updatedBy: socket.userId,
      });
    });

    // Handle appointment notifications
    socket.on('appointment:reminder', (data) => {
      io.to(`business:${socket.businessId}`).emit('appointment:alert', {
        ...data,
        notifyAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min before
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
      if (redisClient) {
        await redisClient?.hDel(`socket:${socket.userId}`, 'socketId');
      }
    });
  });

  // Helper function to emit to specific business
  io.emitToBusiness = (businessId: string, event: string, data: any) => {
    io.to(`business:${businessId}`).emit(event, data);
  };

  // Helper function to emit to specific user
  io.emitToUser = (userId: string, event: string, data: any) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  return io;
}

// Event types for type safety
export interface WebSocketEvents {
  'new:message': (data: { contactId: string; message: string; type: string }) => void;
  'order:changed': (data: { orderId: string; status: string }) => void;
  'lead:changed': (data: { contactId: string; stage: string; dealValue: number }) => void;
  'appointment:alert': (data: { id: string; title: string; time: string }) => void;
  'user:typing': (data: { userId: string; contactId: string }) => void;
}