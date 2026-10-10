import { db } from '../models/db.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';

export const wearableController = {
  // List all smart safety bands
  async listWearables(req, res) {
    try {
      return res.json({
        success: true,
        count: db.data.wearables.length,
        wearables: db.data.wearables
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to list wearables.' });
    }
  },

  // Pair wearable with tourist ID at checkpoint (FR-5.3)
  async pairWearable(req, res) {
    try {
      const { wearableId, touristId } = req.body;

      const band = db.data.wearables.find(w => w.id === wearableId);
      const tourist = db.data.touristIds.find(t => t.touristId === touristId);

      if (!band) return res.status(404).json({ success: false, message: 'Smart band device not found.' });
      if (!tourist) return res.status(404).json({ success: false, message: 'Tourist ID not found.' });

      band.status = 'ASSIGNED';
      band.assignedTouristId = touristId;
      band.lastHeartbeat = new Date().toISOString();

      tourist.pairedWearableId = wearableId;
      db.save();

      recordAuditDirect({
        userId: req.user ? req.user.id : 'operator',
        userName: req.user ? req.user.fullName : 'Entry Point Operator',
        userRole: 'operator',
        action: 'WEARABLE_PAIRED',
        targetResource: wearableId,
        details: `Smart Band ${wearableId} paired with Tourist ${touristId} (${tourist.fullName})`
      });

      return res.json({
        success: true,
        message: `Wearable device ${wearableId} successfully paired with ${tourist.fullName}.`,
        wearable: band,
        tourist
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to pair wearable device.' });
    }
  },

  // Return / Unpair wearable
  async unpairWearable(req, res) {
    try {
      const { wearableId } = req.body;
      const band = db.data.wearables.find(w => w.id === wearableId);

      if (!band) return res.status(404).json({ success: false, message: 'Wearable not found.' });

      if (band.assignedTouristId) {
        const tourist = db.data.touristIds.find(t => t.touristId === band.assignedTouristId);
        if (tourist) tourist.pairedWearableId = null;
      }

      band.status = 'AVAILABLE_AT_CHECKPOINT';
      band.assignedTouristId = null;
      band.heartRateBpm = 0;
      db.save();

      return res.json({ success: true, message: `Wearable ${wearableId} returned and reset for next tourist.`, wearable: band });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to unpair wearable.' });
    }
  },

  // Simulate Telemetry / Fall Detection Sensor (FR-5.2)
  async updateTelemetry(req, res) {
    try {
      const { wearableId, heartRateBpm, batteryPct, triggerFallAlert } = req.body;
      const band = db.data.wearables.find(w => w.id === wearableId);

      if (!band) return res.status(404).json({ success: false, message: 'Wearable not found.' });

      if (heartRateBpm !== undefined) band.heartRateBpm = heartRateBpm;
      if (batteryPct !== undefined) band.batteryPct = batteryPct;
      band.lastHeartbeat = new Date().toISOString();

      if (triggerFallAlert && band.assignedTouristId) {
        band.fallDetected = true;
        // Trigger automated distress alert
        const tourist = db.data.touristIds.find(t => t.touristId === band.assignedTouristId);
        const alertId = 'FALL-' + Math.floor(1000 + Math.random() * 9000);
        const fallAlert = {
          id: alertId,
          touristId: tourist ? tourist.touristId : 'TID-UNKNOWN',
          touristName: tourist ? tourist.fullName : 'Wearable User',
          type: 'FALL_DETECTION',
          severity: 'CRITICAL',
          status: 'NEW',
          latitude: tourist?.lastLocation?.latitude || 25.5788,
          longitude: tourist?.lastLocation?.longitude || 91.8933,
          locationName: 'Automated Wearable Accelerometer Trigger',
          batteryLevel: band.batteryPct,
          reportedAt: new Date().toISOString(),
          notes: `Sudden high-G impact & lack of movement detected on ${band.id}. Heart Rate: ${heartRateBpm || 82} BPM.`,
          timeline: [
            { time: new Date().toISOString(), action: 'Fall detection algorithm triggered by wearable accelerometer' }
          ]
        };
        db.data.alerts.unshift(fallAlert);
      }

      db.save();

      return res.json({ success: true, wearable: band });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update wearable telemetry.' });
    }
  }
};
