import { db } from '../models/db.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';

export const incidentController = {
  // Get Alert Queue with filters (FR-4.3)
  async getAlerts(req, res) {
    try {
      const { status, severity, district } = req.query;
      let alerts = [...db.data.alerts];

      if (status) alerts = alerts.filter(a => a.status === status);
      if (severity) alerts = alerts.filter(a => a.severity === severity);
      if (district) alerts = alerts.filter(a => a.district === district);

      return res.json({
        success: true,
        count: alerts.length,
        alerts
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve alerts.' });
    }
  },

  // Acknowledge Alert
  async acknowledgeAlert(req, res) {
    try {
      const { alertId } = req.params;
      const alert = db.data.alerts.find(a => a.id === alertId);

      if (!alert) {
        return res.status(404).json({ success: false, message: 'Alert not found.' });
      }

      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedAt = new Date().toISOString();
      alert.acknowledgedBy = req.user ? req.user.fullName : 'Command Center Officer';

      alert.timeline.push({
        time: new Date().toISOString(),
        action: `Acknowledged by ${alert.acknowledgedBy} (${req.user ? req.user.role : 'police'})`
      });

      db.save();

      recordAuditDirect({
        userId: req.user ? req.user.id : 'police',
        userName: req.user ? req.user.fullName : 'Police Officer',
        userRole: req.user ? req.user.role : 'police',
        action: 'ALERT_ACKNOWLEDGED',
        targetResource: alertId,
        details: `Alert ${alertId} acknowledged.`
      });

      return res.json({ success: true, message: 'Alert acknowledged.', alert });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to acknowledge alert.' });
    }
  },

  // Assign Patrol Unit
  async assignUnit(req, res) {
    try {
      const { alertId } = req.params;
      const { unitId, notes } = req.body;

      const alert = db.data.alerts.find(a => a.id === alertId);
      const unit = db.data.patrolUnits.find(u => u.id === unitId);

      if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
      if (!unit) return res.status(404).json({ success: false, message: 'Patrol unit not found.' });

      unit.status = 'ON_MISSION';
      unit.assignedIncidentId = alertId;

      alert.assignedUnitId = unit.id;
      alert.assignedUnitName = unit.name;
      alert.status = 'DISPATCHED';
      alert.estimatedEtaMinutes = Math.floor(5 + Math.random() * 10);

      alert.timeline.push({
        time: new Date().toISOString(),
        action: `Unit dispatched: ${unit.name} (${unit.officerInCharge}). Notes: ${notes || 'Immediate assistance requested.'}`
      });

      db.save();

      recordAuditDirect({
        userId: req.user ? req.user.id : 'police',
        userName: req.user ? req.user.fullName : 'Police Dispatcher',
        userRole: 'police',
        action: 'PATROL_UNIT_DISPATCHED',
        targetResource: alertId,
        details: `Assigned unit ${unit.name} to alert ${alertId}`
      });

      return res.json({ success: true, message: `Patrol unit ${unit.name} dispatched.`, alert, unit });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to dispatch unit.' });
    }
  },

  // Resolve / Close Alert
  async resolveAlert(req, res) {
    try {
      const { alertId } = req.params;
      const { resolutionNotes } = req.body;

      const alert = db.data.alerts.find(a => a.id === alertId);
      if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });

      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedBy = req.user ? req.user.fullName : 'Police Officer';
      alert.resolutionNotes = resolutionNotes || 'Tourist contacted and verified safe. Emergency resolved.';

      // Release assigned patrol unit
      if (alert.assignedUnitId) {
        const unit = db.data.patrolUnits.find(u => u.id === alert.assignedUnitId);
        if (unit) {
          unit.status = 'AVAILABLE';
          unit.assignedIncidentId = null;
        }
      }

      alert.timeline.push({
        time: new Date().toISOString(),
        action: `Incident resolved: ${alert.resolutionNotes}`
      });

      db.save();

      recordAuditDirect({
        userId: req.user ? req.user.id : 'police',
        userName: req.user ? req.user.fullName : 'Police Officer',
        userRole: 'police',
        action: 'ALERT_RESOLVED',
        targetResource: alertId,
        details: `Incident resolved with notes: ${alert.resolutionNotes}`
      });

      return res.json({ success: true, message: 'Alert marked as resolved.', alert });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to resolve alert.' });
    }
  }
};
