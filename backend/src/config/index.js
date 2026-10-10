import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'suraksha-yatra-secret-key-production-strength-2026-secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key for AES-256
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  dpdpRetentionDays: parseInt(process.env.DPDP_RETENTION_DAYS || '30', 10),
  rateLimitWindowMs: 15 * 60 * 1000, // 15 mins
  rateLimitMaxRequests: 300,
  emergencyRateLimitMax: 1000 // generous for SOS
};
