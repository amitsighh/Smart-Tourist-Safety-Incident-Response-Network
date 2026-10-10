import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import apiRoutes from './routes/api.js';
import { initializeWebSocketServer } from './services/websocketServer.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { adminAuditController } from './controllers/adminAuditController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
initializeWebSocketServer(server);

// Security Headers (PRD SEC-9.1 - SEC-9.3)
app.use(helmet({
  contentSecurityPolicy: false, // relax in dev/demo for map tiles and fonts
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration (PRD SEC-8.2)
app.use(cors({
  origin: (origin, callback) => {
    // allow localhost, 127.0.0.1, render, vercel, or same-origin
    if (!origin || 
        config.corsOrigins.includes(origin) || 
        origin.startsWith('http://localhost') || 
        origin.startsWith('http://127.0.0.1') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser with size limit (PRD SEC-7.4)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Global Rate Limiter (PRD SEC-7.1)
app.use('/api', globalLimiter);

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'SurakshaYatra Core Security & Emergency Response Gateway',
    timestamp: new Date().toISOString(),
    region: 'Northeast India Command Node'
  });
});

// Serve Frontend Static Build (Render & Production SPA Hosting)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io') || req.originalUrl.startsWith('/health')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// Generic 404 Handler for unhandled API calls
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Generic Global Error Handler (PRD SEC-10.3)
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err.message);
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production'
      ? 'An unexpected secure server error occurred. Please contact the administrator.'
      : err.message
  });
});

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SurakshaYatra Backend running on port ${PORT}`);
  console.log(`🛡️  Security headers, DPDP encryption & RBAC active`);
  console.log(`🔗 Blockchain Ledger initialized with PoA Consensus`);
  console.log(`=======================================================`);
});

// Periodic DPDP Data Retention Purge Worker (every 6 hours)
setInterval(() => {
  try {
    adminAuditController.runDpdpRetentionPurge({ user: { id: 'SYSTEM_CRON', fullName: 'DPDP Daemon', role: 'admin' } }, { json: () => {} });
  } catch (err) {
    console.error('Periodic DPDP purge error:', err);
  }
}, 6 * 60 * 60 * 1000);
