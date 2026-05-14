/**
 * Worker Process Entry Point
 * Run this file separately to start background job processors
 * Usage: npm run worker
 */

import dotenv from 'dotenv';
dotenv.config();

import { workers, shutdownWorkers } from './workers/index.js';

if (process.env.NODE_ENV !== 'production') console.log('🚀 Starting background job workers...');

// Log worker status
Object.keys(workers).forEach((workerName) => {
  if (process.env.NODE_ENV !== 'production') console.log(`✓ ${workerName} worker started`);
});

if (process.env.NODE_ENV !== 'production') console.log('✅ All workers are running');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  if (process.env.NODE_ENV !== 'production') console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await shutdownWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (process.env.NODE_ENV !== 'production') console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await shutdownWorkers();
  process.exit(0);
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// Log every minute
setInterval(() => {
  if (process.env.NODE_ENV !== 'production') console.log(`Workers alive - ${new Date().toISOString()}`);
}, 60000);
