import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'suraksha-yatra-secret-key-production-strength-2026-secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  dpdpRetentionDays: parseInt(process.env.DPDP_RETENTION_DAYS || '30', 10),
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMaxRequests: 300,
  emergencyRateLimitMax: 1000,
  demoMode: process.env.DEMO_MODE === 'true',
  demoPhoneNumber: process.env.DEMO_PHONE_NUMBER || '+917307007253',
  demoEmail: process.env.DEMO_EMAIL || 'police.control@surakshayatra.gov.in',
  smsProvider: process.env.SMS_PROVIDER || 'mock',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER || '',
  hmacSecret: process.env.HMAC_SHARED_SECRET || 'suraksha-secure-hmac-shared-key-2026',
  appDomain: process.env.APP_DOMAIN || 'http://localhost:5173'
};
