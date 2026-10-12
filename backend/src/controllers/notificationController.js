import crypto from 'crypto';
import { db } from '../models/db.js';
import { config } from '../config/index.js';
import { notificationService } from '../services/notificationService.js';
import { blockchainLedger } from '../services/blockchainLedger.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';
import { efirGenerator } from '../services/efirGenerator.js';

const lastSeenCounters = new Map();

export const notificationController = {
  async getLogs(req, res) {
    try {
      const { role, status, incidentId, search } = req.query;
      let logs = [...(db.data.notificationLogs || [])];

      if (role) logs = logs.filter(l => l.intendedRole === role);
      if (status) logs = logs.filter(l => l.status === status);
      if (incidentId) logs = logs.filter(l => l.incidentId === incidentId);
      if (search) {
        const q = search.toLowerCase();
        logs = logs.filter(l =>
          (l.messageText && l.messageText.toLowerCase().includes(q)) ||
          (l.actualRecipient && l.actualRecipient.includes(q)) ||
          (l.intendedRecipient && l.intendedRecipient.includes(q))
        );
      }

      return res.json({
        success: true,
        count: logs.length,
        demoMode: config.demoMode,
        demoPhoneNumber: config.demoPhoneNumber,
        logs
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve notification logs.' });
    }
  },

  async handleInboundSms(req, res) {
    try {
      const fromNumber = req.body.From || req.body.fromNumber || req.body.phone || config.demoPhoneNumber;
      const bodyText = (req.body.Body || req.body.bodyText || req.body.message || '').trim();

      if (!bodyText) {
        return res.status(400).json({ success: false, message: 'Empty message body.' });
      }

      // Scenario A: Reply "1" to acknowledge
      if (bodyText === '1') {
        const openAlert = (db.data.alerts || []).find(a =>
          a.status === 'NEW' || a.status === 'DISPATCHED'
        );

        if (!openAlert) {
          return res.json({
            success: true,
            action: 'NOOP',
            message: 'No open alert pending acknowledgment.'
          });
        }

        openAlert.status = 'ACKNOWLEDGED';
        openAlert.acknowledgedAt = new Date().toISOString();
        openAlert.acknowledgedBy = `SMS Officer (${fromNumber})`;
        openAlert.timeline.push({
          time: new Date().toISOString(),
          action: `Alert acknowledged via SMS reply '1' from ${fromNumber}`
        });

        db.save();

        recordAuditDirect({
          userId: 'SMS_INBOUND',
          userName: `Officer SMS (${fromNumber})`,
          userRole: 'police',
          action: 'SMS_ALERT_ACKNOWLEDGED',
          targetResource: openAlert.id,
          details: `Acknowledged via inbound SMS '1'`
        });

        return res.json({
          success: true,
          action: 'ALERT_ACKNOWLEDGED',
          alertId: openAlert.id,
          message: `Alert ${openAlert.id} acknowledged successfully via SMS.`
        });
      }

      // Scenario B: Compact Signed SOS payload
      // Format: SURAKSHA:SOS:<touristId>:<lat>,<lng>:<timestamp>:<counter>:<hmac>
      if (bodyText.startsWith('SURAKSHA:SOS:')) {
        const parts = bodyText.split(':');
        if (parts.length < 7) {
          return res.status(400).json({ success: false, message: 'Invalid compact SOS signature format.' });
        }

        const touristId = parts[2];
        const [latStr, lngStr] = parts[3].split(',');
        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lngStr);
        const ts = parseInt(parts[4], 10);
        const counter = parseInt(parts[5].replace(/^c/, ''), 10);
        const receivedHmac = parts[6];

        // 1. Verify Replay Counter
        const lastCounter = lastSeenCounters.get(touristId) || 0;
        if (counter <= lastCounter) {
          return res.status(400).json({
            success: false,
            message: 'Replay Attack Rejected: Counter is less than or equal to last seen sequence counter.'
          });
        }
        lastSeenCounters.set(touristId, counter);

        // 2. Verify HMAC Signature
        const signaturePayload = `${touristId}:${latitude},${longitude}:${ts}:c${counter}`;
        const expectedHmac = crypto.createHmac('sha256', config.hmacSecret).update(signaturePayload).digest('hex').substring(0, 16);

        if (receivedHmac.toLowerCase() !== expectedHmac.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: 'Cryptographic HMAC Signature Verification Failed. Tampered or counterfeit emergency payload.'
          });
        }

        // 3. Create Alert
        const tourist = (db.data.touristIds || []).find(t => t.touristId === touristId);
        const incidentId = 'SOS-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const timestamp = new Date().toISOString();

        let nearestUnit = (db.data.patrolUnits || []).find(u => u.status === 'AVAILABLE' || u.status === 'PATROLLING') || null;

        const newAlert = {
          id: incidentId,
          touristId,
          touristName: tourist ? tourist.fullName : 'Verified Tourist',
          type: 'PANIC_SOS',
          triggerType: 'SMS_FALLBACK_OFFLINE',
          severity: 'CRITICAL',
          status: nearestUnit ? 'DISPATCHED' : 'NEW',
          latitude,
          longitude,
          locationName: 'Offline Highway Corridor (SMS Fallback)',
          district: 'Command Sector',
          batteryLevel: 65,
          via: 'SMS(offline)',
          emergencyNote: `Verified signed offline SOS received via SMS gateway. Replay counter: #${counter}`,
          assignedUnitId: nearestUnit ? nearestUnit.id : null,
          assignedUnitName: nearestUnit ? nearestUnit.name : null,
          reportedAt: timestamp,
          timeline: [
            { time: timestamp, action: `Offline emergency SOS received via SMS gateway from ${fromNumber}. HMAC verified.` }
          ]
        };

        if (nearestUnit) {
          nearestUnit.status = 'ON_MISSION';
          nearestUnit.assignedIncidentId = incidentId;
          newAlert.timeline.push({
            time: timestamp,
            action: `Auto-dispatched unit: ${nearestUnit.name}`
          });
        }

        db.data.alerts.unshift(newAlert);
        blockchainLedger.recordEmergencyIncident({
          id: incidentId,
          touristId,
          type: 'PANIC_SOS',
          latitude,
          longitude,
          timestamp
        });
        db.save();

        // 4. Dispatch Multi-Division Notifications
        await notificationService.dispatchEvent('SOS_PANIC', {
          incidentId,
          touristId,
          touristName: newAlert.touristName,
          latitude,
          longitude,
          locationName: newAlert.locationName,
          assignedUnitName: nearestUnit ? nearestUnit.name : 'PU-07',
          via: 'SMS(offline)',
          timestamp
        });

        return res.status(201).json({
          success: true,
          action: 'OFFLINE_SOS_PROCESSED',
          incidentId,
          message: 'Offline signed SMS SOS verified and dispatched to police control room.'
        });
      }

      return res.json({
        success: true,
        action: 'UNHANDLED_TEXT',
        message: 'SMS received. For SOS, send signed format or reply 1 to acknowledge.'
      });
    } catch (err) {
      console.error('Inbound SMS error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to process inbound SMS.' });
    }
  },

  async handleDeliveryWebhook(req, res) {
    try {
      const messageSid = req.body.MessageSid || req.body.id;
      const messageStatus = req.body.MessageStatus || req.body.status;

      if (messageSid && messageStatus) {
        const log = (db.data.notificationLogs || []).find(l => l.providerMessageId === messageSid);
        if (log) {
          log.status = messageStatus.toUpperCase();
          db.save();
        }
      }

      return res.json({ success: true, received: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Webhook error.' });
    }
  },

  async simulateScenario(req, res) {
    try {
      const { scenarioType, touristId = 'TID-NE-2026-92868' } = req.body;
      const tourist = db.data.touristIds.find(t => t.touristId === touristId) || db.data.touristIds[0];
      const timestamp = new Date().toISOString();

      switch (scenarioType) {
        case 'TRIGGER_SOS_ONLINE': {
          const incidentId = 'SOS-' + crypto.randomBytes(4).toString('hex').toUpperCase();
          const newAlert = {
            id: incidentId,
            touristId: tourist.touristId,
            touristName: tourist.fullName,
            type: 'PANIC_SOS',
            triggerType: 'BUTTON_PRESS',
            severity: 'CRITICAL',
            status: 'DISPATCHED',
            latitude: 25.5788,
            longitude: 91.8933,
            locationName: 'Shillong Peak Ridge',
            district: 'East Khasi Hills',
            batteryLevel: 82,
            via: 'Internet',
            assignedUnitId: 'UNIT-01',
            assignedUnitName: 'East Khasi Hills Quick Response Team 1',
            reportedAt: timestamp,
            timeline: [
              { time: timestamp, action: 'Online Panic SOS triggered by tourist.' }
            ]
          };
          db.data.alerts.unshift(newAlert);
          db.save();

          const dispatches = await notificationService.dispatchEvent('SOS_PANIC', {
            incidentId,
            touristId: tourist.touristId,
            touristName: tourist.fullName,
            latitude: 25.5788,
            longitude: 91.8933,
            locationName: 'Shillong Peak Ridge',
            assignedUnitName: 'Quick Response Team 1',
            via: 'Internet',
            timestamp
          });

          return res.json({
            success: true,
            scenario: 'TRIGGER_SOS_ONLINE',
            incidentId,
            dispatchesCount: dispatches.length,
            message: 'Online SOS triggered and multi-division alert messages broadcast.'
          });
        }

        case 'TRIGGER_SOS_SMS': {
          const counter = (lastSeenCounters.get(tourist.touristId) || 0) + 1;
          const ts = Math.floor(Date.now() / 1000);
          const sigPayload = `${tourist.touristId}:25.5788,91.8933:${ts}:c${counter}`;
          const hmac = crypto.createHmac('sha256', config.hmacSecret).update(sigPayload).digest('hex').substring(0, 16);
          const bodyText = `SURAKSHA:SOS:${tourist.touristId}:25.5788,91.8933:${ts}:c${counter}:${hmac}`;

          return notificationController.handleInboundSms({
            body: {
              From: config.demoPhoneNumber,
              Body: bodyText
            }
          }, res);
        }

        case 'GEOFENCE_BREACH': {
          const alertId = 'ALT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
          const newAlert = {
            id: alertId,
            touristId: tourist.touristId,
            touristName: tourist.fullName,
            type: 'GEOFENCE_BREACH',
            severity: 'HIGH',
            status: 'NEW',
            latitude: 27.5052,
            longitude: 92.1039,
            locationName: 'Sela Pass Military Buffer Zone',
            district: 'Tawang Sector',
            batteryLevel: 74,
            reportedAt: timestamp,
            notes: 'Geofence breach detected inside high-altitude restricted zone.',
            timeline: [
              { time: timestamp, action: 'Entered restricted polygon: Sela Pass Military Buffer Zone' }
            ]
          };
          db.data.alerts.unshift(newAlert);
          db.save();

          await notificationService.sendToRecipient({
            incidentId: alertId,
            intendedRole: 'police',
            intendedRecipient: '+911122334455',
            messageData: {
              incidentId: alertId,
              touristId: tourist.touristId,
              touristName: tourist.fullName,
              latitude: 27.5052,
              longitude: 92.1039,
              locationName: 'Sela Pass Military Buffer Zone',
              via: 'GPS Geofence Breach',
              timestamp
            }
          });

          return res.json({
            success: true,
            scenario: 'GEOFENCE_BREACH',
            alertId,
            message: 'Geofence breach simulated and police notified.'
          });
        }

        case 'MISSED_CHECKIN': {
          const alertId = 'ALT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
          const newAlert = {
            id: alertId,
            touristId: tourist.touristId,
            touristName: tourist.fullName,
            type: 'ANOMALY_FLAG',
            severity: 'MEDIUM',
            status: 'NEW',
            latitude: 25.4670,
            longitude: 91.3662,
            locationName: 'Dzukou Valley Remote Trek Trail',
            district: 'Kohima Sector',
            batteryLevel: 45,
            notes: 'Prolonged inactivity detected (3h) and 2 missed check-ins.',
            timeline: [
              { time: timestamp, action: 'AI Anomaly engine flagged prolonged silence and missed check-ins' }
            ]
          };
          db.data.alerts.unshift(newAlert);
          db.save();

          await notificationService.dispatchEvent('ANOMALY_SILENT', {
            incidentId: alertId,
            touristId: tourist.touristId,
            touristName: tourist.fullName,
            latitude: 25.4670,
            longitude: 91.3662,
            locationName: 'Dzukou Valley Remote Trek Trail',
            sinceTime: '08:15',
            missedCount: 2,
            reasons: 'inactivity + route deviation',
            timestamp
          });

          return res.json({
            success: true,
            scenario: 'MISSED_CHECKIN',
            alertId,
            message: 'Missed check-in anomaly simulated and notification dispatch completed.'
          });
        }

        case 'CREATE_EFIR': {
          const firResult = efirGenerator.generateMissingPersonEfir({
            touristId: tourist.touristId,
            officerName: 'Inspector T. Jamir',
            policeStation: 'Guwahati Central Police Station',
            district: 'Kamrup Metro',
            incidentSummary: 'Tourist Rahul Sharma untraceable after prolonged signal loss in high-altitude corridor.'
          });

          await notificationService.dispatchEvent('EFIR_CREATED', {
            incidentId: firResult.firRecord.firNumber,
            firNumber: firResult.firRecord.firNumber,
            touristId: tourist.touristId,
            touristName: tourist.fullName,
            timestamp
          });

          return res.json({
            success: true,
            scenario: 'CREATE_EFIR',
            firNumber: firResult.firRecord.firNumber,
            message: 'Legal Missing Person E-FIR generated and police notification sent.'
          });
        }

        default:
          return res.status(400).json({ success: false, message: 'Unknown scenario type.' });
      }
    } catch (err) {
      console.error('Simulate scenario error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Scenario simulation failed.' });
    }
  }
};
