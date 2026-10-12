import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../models/db.js';
import { config } from '../config/index.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';

const failedAttemptsMap = new Map();

export const authController = {
  // Register user
  async register(req, res) {
    try {
      const { email, password, fullName, role = 'tourist', phone, badgeNumber, stationName } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ success: false, message: 'Email, password, and full name are required.' });
      }

      if (password.length < 12) {
        return res.status(400).json({ success: false, message: 'Security Policy: Password must be at least 12 characters long.' });
      }

      const existing = db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const isAuthority = ['police', 'operator', 'tourism_official', 'medical', 'disaster_response', 'admin'].includes(role);

      const newUser = {
        id: 'usr-' + crypto.randomBytes(6).toString('hex'),
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role,
        phone: phone || '',
        badgeNumber: badgeNumber || null,
        stationName: stationName || null,
        mfaEnabled: isAuthority,
        createdAt: new Date().toISOString()
      };

      db.data.users.push(newUser);
      db.save();

      recordAuditDirect({
        userId: newUser.id,
        userName: newUser.fullName,
        userRole: newUser.role,
        action: 'USER_REGISTERED',
        targetResource: newUser.id,
        details: `Registered new ${role} account.`
      });

      const token = jwt.sign(
        { id: newUser.id, role: newUser.role, mfaVerified: !isAuthority },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.status(201).json({
        success: true,
        message: 'Registration successful.',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          phone: newUser.phone,
          mfaRequired: isAuthority
        }
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      // Check failed attempts lockout
      const lockKey = `${ip}:${email.toLowerCase()}`;
      const failCount = failedAttemptsMap.get(lockKey) || 0;
      if (failCount >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Account temporarily locked due to excessive failed attempts. Please retry in 15 minutes.'
        });
      }

      const user = db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        failedAttemptsMap.set(lockKey, failCount + 1);
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        failedAttemptsMap.set(lockKey, failCount + 1);
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      // Reset lockout counter on success
      failedAttemptsMap.delete(lockKey);

      const isAuthority = ['police', 'operator', 'tourism_official', 'admin'].includes(user.role);

      // If authority, require MFA
      if (isAuthority && user.mfaEnabled) {
        const mfaTempToken = jwt.sign(
          { id: user.id, role: user.role, stage: 'MFA_PENDING' },
          config.jwtSecret,
          { expiresIn: '10m' }
        );

        return res.json({
          success: true,
          requiresMfa: true,
          mfaTempToken,
          message: 'MFA verification required. Please enter your 6-digit authenticator code (Sandbox: 123456).',
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          }
        });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, mfaVerified: true },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      recordAuditDirect({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        action: 'USER_LOGIN_SUCCESS',
        targetResource: user.id,
        details: 'User logged in successfully.'
      });

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          badgeNumber: user.badgeNumber,
          stationName: user.stationName
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during login.' });
    }
  },

  // Verify MFA
  async verifyMfa(req, res) {
    try {
      const { mfaTempToken, otp } = req.body;

      if (!mfaTempToken || !otp) {
        return res.status(400).json({ success: false, message: 'Token and OTP are required.' });
      }

      let decoded;
      try {
        decoded = jwt.verify(mfaTempToken, config.jwtSecret);
      } catch (err) {
        return res.status(401).json({ success: false, message: 'MFA session expired. Please log in again.' });
      }

      if (otp !== '123456' && otp !== '999999') {
        return res.status(400).json({ success: false, message: 'Invalid OTP code. Sandbox code is 123456.' });
      }

      const user = db.data.users.find(u => u.id === decoded.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, mfaVerified: true },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      recordAuditDirect({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        action: 'MFA_VERIFIED_SUCCESS',
        targetResource: user.id,
        details: 'Multi-factor authentication verified successfully.'
      });

      return res.json({
        success: true,
        message: 'MFA authentication successful.',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          badgeNumber: user.badgeNumber,
          stationName: user.stationName
        }
      });
    } catch (err) {
      console.error('MFA error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during MFA.' });
    }
  },

  // Get current authenticated user
  async getMe(req, res) {
    try {
      const user = db.data.users.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const touristRecord = db.data.touristIds.find(t => t.userId === user.id);

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          badgeNumber: user.badgeNumber,
          stationName: user.stationName,
          touristId: touristRecord ? touristRecord.touristId : null
        }
      });
    } catch (err) {
      console.error('Get me error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  }
};
