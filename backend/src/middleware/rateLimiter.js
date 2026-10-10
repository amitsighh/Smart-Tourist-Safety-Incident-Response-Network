import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please retry after 15 minutes.'
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // max 20 auth attempts per 15 min window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Account temporarily throttled for security.'
  }
});

export const emergencySosLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100, // generous allowance to prevent ever blocking real emergency
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'SOS rate limit safeguard triggered.'
  }
});
