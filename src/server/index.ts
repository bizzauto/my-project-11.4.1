import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import path from 'path';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import appointmentsRoutes from './routes/appointments.js';
import automationRoutes from './routes/automation.js';
import businessRoutes from './routes/business.js';
import campaignsRoutes from './routes/campaigns.js';
import chatbotRoutes from './routes/chatbot.js';
import contactsRoutes from './routes/contacts.js';
import documentsRoutes from './routes/documents.js';
import ecommerceRoutes from './routes/ecommerce.js';
import emailRoutes from './routes/email.js';
import evolutionRoutes from './routes/evolution.js';
import googleBusinessRoutes from './routes/google-business.js';
import indiamartEmailRoutes from './routes/indiamart-email.js';
import integrationsRoutes from './routes/integrations.js';
import intelligenceRoutes from './routes/intelligence.js';
import leadsRoutes from './routes/leads.js';
import notificationsRoutes from './routes/notifications.js';
import postersRoutes from './routes/posters.js';
import postsRoutes from './routes/posts.js';
import qwenPreviewRoutes from './routes/qwen-preview.js';
import reportsRoutes from './routes/reports.js';
import reviewsRoutes from './routes/reviews.js';
import settingsRoutes from './routes/settings.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import superAdminRoutes from './routes/super-admin.js';
import teamRoutes from './routes/team.js';
import twoFactorRoutes from './routes/twoFactor.js';
import webhooksRoutes from './routes/webhooks.js';
import whatsappRoutes from './routes/whatsapp.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Prisma
export const prisma = new PrismaClient({
  log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com", "https://fonts.googleapis.com", "https://cdn.razorpay.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'self'", "https://checkout.razorpay.com", "https://api.razorpay.com"],
      workerSrc: ["'self'", "blob:"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://bizzautoai.com',
  credentials: true,
}));
// app.use(compression());
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Request ID middleware
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/ecommerce', ecommerceRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/google-business', googleBusinessRoutes);
app.use('/api/indiamart-email', indiamartEmailRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/posters', postersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/qwen-preview', qwenPreviewRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/two-factor', twoFactorRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Test GET endpoint
app.get('/test-get', (req, res) => {
  res.json({ success: true, method: 'GET' });
});

// Test POST endpoint - no body
app.post('/test-nobody', (req, res) => {
  res.json({ success: true, method: 'POST', hasBody: !!req.body });
});

// Test POST endpoint with body
app.post('/test', (req, res) => {
  res.json({ success: true, body: req.body });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
});
});

// Serve frontend in production
if (NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', '..', 'dist', 'client');
  app.use(express.static(clientBuildPath));
  app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    } else {
      res.status(404).json({ success: false, error: 'Route not found' });
    }
  });
}
// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Graceful shutdown
process.on('unhandledRejection', (error: any) => {
  console.error('UNHANDLED REJECTION:', error);
  console.error('Stack:', error?.stack);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  logger.error('Uncaught Exception:', error);
});

// Start server
console.log(`Starting server on ${HOST}:${PORT} in ${NODE_ENV} mode`);
app.listen(Number(PORT), () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
  logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
});

// Export authenticate middleware for use in routes
export { authenticate } from './middleware/auth.js';

export default app;
