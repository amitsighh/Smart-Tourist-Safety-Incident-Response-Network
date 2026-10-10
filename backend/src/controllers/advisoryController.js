import crypto from 'crypto';
import { db } from '../models/db.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';

export const advisoryController = {
  // Get all active regional advisories (FR-2.7)
  async listAdvisories(req, res) {
    try {
      return res.json({
        success: true,
        count: db.data.advisories.length,
        advisories: db.data.advisories
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve advisories.' });
    }
  },

  // Broadcast new advisory (FR-4.8)
  async broadcastAdvisory(req, res) {
    try {
      const { title, region, severity = 'WARNING', message } = req.body;

      if (!title || !region || !message) {
        return res.status(400).json({ success: false, message: 'Title, region, and message are required.' });
      }

      const newAdvisory = {
        id: 'ADV-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
        title,
        region,
        severity, // 'INFO', 'WARNING', 'CRITICAL'
        issuedBy: req.user ? `${req.user.fullName} (${req.user.role.toUpperCase()})` : 'State Disaster Management Authority',
        message,
        publishedAt: new Date().toISOString()
      };

      db.data.advisories.unshift(newAdvisory);
      db.save();

      recordAuditDirect({
        userId: req.user ? req.user.id : 'tourism',
        userName: req.user ? req.user.fullName : 'Tourism Official',
        userRole: req.user ? req.user.role : 'tourism_official',
        action: 'ADVISORY_BROADCASTED',
        targetResource: newAdvisory.id,
        details: `Broadcasted emergency advisory: "${title}" to ${region}`
      });

      return res.status(201).json({
        success: true,
        message: 'Advisory broadcasted to all tourists and dashboards in the sector.',
        advisory: newAdvisory
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to broadcast advisory.' });
    }
  }
};
