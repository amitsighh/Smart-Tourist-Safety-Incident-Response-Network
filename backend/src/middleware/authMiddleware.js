import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../models/db.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Authentication token required.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.data.users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session: User no longer exists.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      mfaVerified: decoded.mfaVerified || false
    };

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Insufficient privileges. Required role(s): ${allowedRoles.join(', ')}`
      });
    }

    // For authority & admin accounts, ensure MFA was verified
    if (['police', 'operator', 'tourism_official', 'admin'].includes(req.user.role) && !req.user.mfaVerified) {
      return res.status(403).json({
        success: false,
        requiresMfa: true,
        message: 'Multi-Factor Authentication (MFA) verification required for authority access.'
      });
    }

    next();
  };
}

export function authorizeResourceOwner(req, res, next) {
  const resourceUserId = req.params.userId || req.body.userId;
  const resourceTouristId = req.params.touristId;

  // Authorities and admins can view any record
  if (['police', 'operator', 'tourism_official', 'admin'].includes(req.user.role)) {
    return next();
  }

  // Tourists can only access their own records
  if (resourceUserId && resourceUserId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: You are not authorized to access records belonging to another user.'
    });
  }

  if (resourceTouristId) {
    const record = db.data.touristIds.find(t => t.touristId === resourceTouristId);
    if (record && record.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not own this Digital Tourist ID.'
      });
    }
  }

  next();
}
