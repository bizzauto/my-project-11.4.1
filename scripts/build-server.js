import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure dist/server directory exists
const distDir = path.join(__dirname, '../dist/server');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build main server
await esbuild.build({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/server/index.js',
  external: [
    '@prisma/client',
    'bcryptjs',
    'jsonwebtoken',
    'openai',
    'googleapis',
    'nodemailer',
    'razorpay',
    'sharp',
    'speakeasy',
    'bullmq',
    'ioredis',
  ],
  format: 'esm',
  sourcemap: true,
  minify: false,
  packages: 'external',
});
console.log('✅ Server built successfully');

// Build worker
await esbuild.build({
  entryPoints: ['src/server/worker.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/server/worker.js',
  external: [
    '@prisma/client',
    'bcryptjs',
    'jsonwebtoken',
    'openai',
    'googleapis',
    'nodemailer',
    'razorpay',
    'sharp',
    'speakeasy',
    'bullmq',
    'ioredis',
  ],
  format: 'esm',
  sourcemap: true,
  minify: false,
  packages: 'external',
});
console.log('✅ Worker built successfully');