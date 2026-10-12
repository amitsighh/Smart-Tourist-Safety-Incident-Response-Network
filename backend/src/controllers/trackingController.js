import crypto from 'crypto';
import { db } from '../models/db.js';
import { GeofenceEngine } from '../services/geofenceEngine.js';
import { aiAnomalyDetector } from '../services/aiAnomalyDetector.js';
import { blockchainLedger } from '../services/blockchainLedger.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';
import { notificationService } from '../services/notificationService.js';

const geofenceEngine = new GeofenceEngine(db.data.geofences);

export const trackingController = {
  // Submit GPS Ping Telemetry from App or Wearable (FR-2.1, FR-2.2, FR-2.4)
  async submitPing(req, res) {
    try {
      const { touristId, latitude, longitude, locationName, altitude, speedKmh = 0, batteryLevel = 80, isOfflineQueued = false } = req.body;

      if (!touristId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ success: false, message: 'TouristId, latitude, and longitude are required.' });
      }

      const tourist = db.data.touristIds.find(t => t.touristId === touristId);
      if (!tourist) {
        return res.status(404).json({ success: false, message: 'Tourist ID not found.' });
      }

      const timestamp = new Date().toISOString();
      const currentHour = new Date().getHours();

      // Refresh geofences in engine
      geofenceEngine.setGeofences(db.data.geofences);

      // 1. Evaluate Geofence Breaches (FR-2.2)
      const geofenceEval = geofenceEngine.evaluateLocation(latitude, longitude);

      // 2. Evaluate Route Deviation
      const routeCheck = aiAnomalyDetector.calculateRouteDeviation(latitude, longitude, tourist.itinerary);

      // 3. Compute Dynamic Safety Score (FR-2.1)
      const safetyScoreData = aiAnomalyDetector.computeTouristSafetyScore(
        currentHour,
        geofenceEval.hasBreach,
        routeCheck.deviationKm,
        'LOW',
        batteryLevel
      );

      // 4. Update tourist last location
      tourist.lastLocation = {
        latitude,
        longitude,
        locationName: locationName || (geofenceEval.hasBreach ? geofenceEval.insideBreaches[0].name : 'GPS Coordinates'),
        timestamp,
        batteryLevel,
        speedKmh,
        safetyScore: safetyScoreData.safetyScore
      };

      // Store in tracking pings array
      const pingRecord = {
        id: 'PNG-' + crypto.randomBytes(4).toString('hex'),
        touristId,
        latitude,
        longitude,
        speedKmh,
        batteryLevel,
        timestamp,
        isTransitZone: speedKmh > 20
      };
      db.data.trackingPings.push(pingRecord);
      if (db.data.trackingPings.length > 5000) {
        db.data.trackingPings = db.data.trackingPings.slice(-5000);
      }

      // If geofence breach, create an alert if not already recently created
      if (geofenceEval.hasBreach) {
        const primaryBreach = geofenceEval.insideBreaches[0];
        const existingRecentAlert = db.data.alerts.find(a =>
          a.touristId === touristId &&
          a.type === 'GEOFENCE_BREACH' &&
          a.status !== 'RESOLVED' &&
          a.status !== 'CLOSED'
        );

        if (!existingRecentAlert) {
          const newAlert = {
            id: 'ALT-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
            touristId: tourist.touristId,
            touristName: tourist.fullName,
            type: 'GEOFENCE_BREACH',
            severity: primaryBreach.severity || 'HIGH',
            status: 'NEW',
            latitude,
            longitude,
            locationName: primaryBreach.name,
            district: 'Northeast Sector',
            batteryLevel,
            assignedUnitId: null,
            reportedAt: timestamp,
            notes: `Geofence breach: Entered ${primaryBreach.name}. Advisory: ${primaryBreach.advisory}`,
            timeline: [
              { time: timestamp, action: `Geofence breach detected (${primaryBreach.name})` }
            ]
          };

          db.data.alerts.unshift(newAlert);
        }
      }

      db.save();

      return res.json({
        success: true,
        timestamp,
        safetyScore: safetyScoreData,
        geofence: geofenceEval,
        routeStatus: routeCheck
      });
    } catch (err) {
      console.error('Tracking ping error:', err);
      return res.status(500).json({ success: false, message: 'Failed to record tracking ping.' });
    }
  },

  // Trigger Panic SOS (FR-2.3)
  async triggerPanicSos(req, res) {
    try {
      const { touristId, latitude, longitude, locationName, batteryLevel = 75, triggerType = 'BUTTON_PRESS', emergencyNote } = req.body;

      if (!touristId) {
        return res.status(400).json({ success: false, message: 'Tourist ID is required for SOS.' });
      }

      const tourist = db.data.touristIds.find(t => t.touristId === touristId);
      if (!tourist) {
        return res.status(404).json({ success: false, message: 'Tourist ID not found.' });
      }

      const timestamp = new Date().toISOString();
      const sosLat = latitude || tourist.lastLocation?.latitude || 25.5788;
      const sosLng = longitude || tourist.lastLocation?.longitude || 91.8933;

      // Find nearest police unit
      let nearestUnit = null;
      let minDistance = Infinity;
      for (const unit of db.data.patrolUnits) {
        if (unit.status === 'AVAILABLE' || unit.status === 'PATROLLING') {
          const d = Math.hypot(unit.latitude - sosLat, unit.longitude - sosLng);
          if (d < minDistance) {
            minDistance = d;
            nearestUnit = unit;
          }
        }
      }

      const incidentId = 'SOS-' + crypto.randomBytes(4).toString('hex').toUpperCase();

      const newAlert = {
        id: incidentId,
        touristId: tourist.touristId,
        touristName: tourist.fullName,
        type: 'PANIC_SOS',
        triggerType, // 'BUTTON_PRESS', 'HOLD_GESTURE', 'VOICE_COMMAND', 'FALL_DETECTED'
        severity: 'CRITICAL',
        status: nearestUnit ? 'DISPATCHED' : 'NEW',
        latitude: sosLat,
        longitude: sosLng,
        locationName: locationName || tourist.lastLocation?.locationName || 'Emergency Distress Coordinates',
        district: 'Command Jurisdiction Sector',
        batteryLevel,
        emergencyNote: emergencyNote || 'Panic SOS emergency broadcast triggered by tourist.',
        assignedUnitId: nearestUnit ? nearestUnit.id : null,
        assignedUnitName: nearestUnit ? nearestUnit.name : null,
        estimatedEtaMinutes: nearestUnit ? 6 : null,
        reportedAt: timestamp,
        timeline: [
          { time: timestamp, action: `Panic SOS triggered via ${triggerType}` }
        ]
      };

      if (nearestUnit) {
        nearestUnit.status = 'ON_MISSION';
        nearestUnit.assignedIncidentId = incidentId;
        newAlert.timeline.push({
          time: new Date().toISOString(),
          action: `Auto-dispatched nearest patrol unit: ${nearestUnit.name} (${nearestUnit.officerInCharge})`
        });
      }

      db.data.alerts.unshift(newAlert);

      // Cryptographically Anchor Emergency Incident to Blockchain (FR-4.6)
      const block = blockchainLedger.recordEmergencyIncident({
        id: incidentId,
        touristId: tourist.touristId,
        type: 'PANIC_SOS',
        latitude: sosLat,
        longitude: sosLng,
        timestamp
      });

      db.save();

      recordAuditDirect({
        userId: tourist.userId,
        userName: tourist.fullName,
        userRole: 'tourist',
        action: 'PANIC_SOS_TRIGGERED',
        targetResource: incidentId,
        details: `CRITICAL Panic SOS initiated. Anchored in Block #${block.index}`
      });

      // Multi-division notification dispatch (Police, Tourism, Medical, SDRF, Contacts)
      await notificationService.dispatchEvent('SOS_PANIC', {
        incidentId,
        touristId: tourist.touristId,
        touristName: tourist.fullName,
        latitude: sosLat,
        longitude: sosLng,
        locationName: newAlert.locationName,
        emergencyNote: newAlert.emergencyNote,
        triggerType,
        assignedUnitName: nearestUnit ? nearestUnit.name : 'PU-07',
        via: 'Internet',
        timestamp
      });

      // Generate SMS Fallback Payload for low-connectivity zones
      const smsPayload = `[SURAKSHAYATRA SOS] ID:${tourist.touristId} LOC:${sosLat.toFixed(4)},${sosLng.toFixed(4)} BAT:${batteryLevel}% TIME:${timestamp}. Emergency services dispatched.`;

      return res.status(201).json({
        success: true,
        message: 'CRITICAL SOS ALERT BROADCASTED. Police Command and Emergency Contacts notified.',
        alert: newAlert,
        smsFallbackPayload: smsPayload,
        dispatchedUnit: nearestUnit,
        blockchainAnchor: {
          blockIndex: block.index,
          blockHash: block.hash
        }
      });
    } catch (err) {
      console.error('Panic SOS error:', err);
      return res.status(500).json({ success: false, message: 'Failed to trigger SOS.' });
    }
  },

  // Get Live Locations for Authority Map (FR-4.1)
  // Shows opted-in tourists and any active SOS alerts
  async getLiveMapLocations(req, res) {
    try {
      // Filter tourists who opted into police tracking or have an active SOS/incident
      const activeSosTouristIds = new Set(
        db.data.alerts.filter(a => a.status !== 'RESOLVED' && a.status !== 'CLOSED').map(a => a.touristId)
      );

      const touristPins = db.data.touristIds
        .filter(t => t.optInTracking || activeSosTouristIds.has(t.touristId))
        .map(t => ({
          touristId: t.touristId,
          fullName: t.fullName,
          nationality: t.nationality,
          bloodGroup: t.bloodGroup,
          photoUrl: t.photoUrl,
          hasActiveSos: activeSosTouristIds.has(t.touristId),
          optInTracking: t.optInTracking,
          lastLocation: t.lastLocation,
          pairedWearableId: t.pairedWearableId
        }));

      return res.json({
        success: true,
        tourists: touristPins,
        patrolUnits: db.data.patrolUnits,
        geofences: db.data.geofences,
        activeAlerts: db.data.alerts.filter(a => a.status !== 'CLOSED')
      });
    } catch (err) {
      console.error('Live map error:', err);
      return res.status(500).json({ success: false, message: 'Failed to get live map data.' });
    }
  }
};
