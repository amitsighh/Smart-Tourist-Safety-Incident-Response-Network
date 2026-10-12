import { db } from '../models/db.js';
import { efirGenerator } from '../services/efirGenerator.js';
import { blockchainLedger } from '../services/blockchainLedger.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';
import { notificationService } from '../services/notificationService.js';

export const efirController = {
  // Generate Automated Legal E-FIR (FR-4.4)
  async generateEfir(req, res) {
    try {
      const { touristId, incidentId, officerDetails } = req.body;

      if (!touristId) {
        return res.status(400).json({ success: false, message: 'Tourist ID is required to generate E-FIR.' });
      }

      const tourist = db.data.touristIds.find(t => t.touristId === touristId);
      if (!tourist) {
        return res.status(404).json({ success: false, message: 'Tourist ID record not found.' });
      }

      const incident = db.data.alerts.find(a => a.id === incidentId) || {
        id: 'INC-ANOMALY-DIRECT',
        type: 'MISSING_PERSON_DISTRESS',
        severity: 'CRITICAL',
        latitude: tourist.lastLocation?.latitude || 25.5788,
        longitude: tourist.lastLocation?.longitude || 91.8933,
        locationName: tourist.lastLocation?.locationName || 'High-Risk Mountain Sector',
        district: 'East Khasi Hills',
        timestamp: new Date().toISOString()
      };

      const officer = officerDetails || {
        name: req.user ? req.user.fullName : 'DSP Bimal Das',
        badge: req.user?.badgeNumber || 'ASM-POL-009',
        station: req.user?.stationName || 'North-East Integrated Command & Control Center (ICCC)'
      };

      const efirDoc = efirGenerator.generateMissingPersonEFIR(tourist, incident, officer);

      db.data.efirRecords.unshift(efirDoc);

      // Anchor E-FIR Generation to Blockchain
      const block = blockchainLedger.mineBlock([
        {
          type: 'EFIR_GENERATED_LEGAL_SEAL',
          firNumber: efirDoc.firNumber,
          touristId: tourist.touristId,
          officerBadge: officer.badge,
          thumbprint: efirDoc.digitalSignature.certificateThumbprint,
          timestamp: efirDoc.registeredAt
        }
      ]);

      db.save();

      recordAuditDirect({
        userId: req.user ? req.user.id : 'police',
        userName: req.user ? req.user.fullName : 'Police Officer',
        userRole: 'police',
        action: 'EFIR_GENERATED',
        targetResource: efirDoc.firNumber,
        details: `Generated Legal E-FIR ${efirDoc.firNumber} for Tourist ${tourist.touristId}. Anchored in Block #${block.index}`
      });

      await notificationService.dispatchEvent('EFIR_CREATED', {
        incidentId: efirDoc.firNumber,
        firNumber: efirDoc.firNumber,
        touristId: tourist.touristId,
        touristName: tourist.fullName,
        timestamp: efirDoc.registeredAt
      });

      return res.status(201).json({
        success: true,
        message: `Legal E-FIR ${efirDoc.firNumber} successfully generated and registered with Indian Police CCTNS format.`,
        efir: efirDoc,
        blockchainAnchor: {
          blockIndex: block.index,
          blockHash: block.hash
        }
      });
    } catch (err) {
      console.error('Generate E-FIR error:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate E-FIR.' });
    }
  },

  // List all E-FIR records
  async listAll(req, res) {
    try {
      return res.json({
        success: true,
        count: db.data.efirRecords.length,
        efirRecords: db.data.efirRecords
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to list E-FIR records.' });
    }
  },

  // Get E-FIR by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const record = db.data.efirRecords.find(e => e.firId === id || e.firNumber === id);

      if (!record) {
        return res.status(404).json({ success: false, message: 'E-FIR record not found.' });
      }

      return res.json({ success: true, efir: record });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve E-FIR.' });
    }
  }
};
