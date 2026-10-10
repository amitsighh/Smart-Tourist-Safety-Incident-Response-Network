import { db } from '../models/db.js';
import crypto from 'crypto';

export function auditLog(actionName) {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (body) {
      res.send = originalSend;

      if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
        const logEntry = {
          id: 'AUD-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
          timestamp: new Date().toISOString(),
          userId: req.user.id,
          userName: req.user.fullName,
          userRole: req.user.role,
          action: actionName || req.method + ' ' + req.baseUrl + req.path,
          targetResource: req.params.touristId || req.params.id || req.body.touristId || req.originalUrl,
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          statusCode: res.statusCode
        };

        db.data.auditLogs.unshift(logEntry);
        // keep recent 1000 audit logs
        if (db.data.auditLogs.length > 1000) {
          db.data.auditLogs = db.data.auditLogs.slice(0, 1000);
        }
        db.save();
      }

      return res.send(body);
    };

    next();
  };
}

export function recordAuditDirect({ userId, userName, userRole, action, targetResource, ipAddress, details }) {
  const logEntry = {
    id: 'AUD-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    timestamp: new Date().toISOString(),
    userId: userId || 'SYSTEM',
    userName: userName || 'System Service',
    userRole: userRole || 'system',
    action,
    targetResource: targetResource || 'GLOBAL',
    ipAddress: ipAddress || '127.0.0.1',
    details: details || '',
    statusCode: 200
  };

  db.data.auditLogs.unshift(logEntry);
  if (db.data.auditLogs.length > 1000) {
    db.data.auditLogs = db.data.auditLogs.slice(0, 1000);
  }
  db.save();
  return logEntry;
}
