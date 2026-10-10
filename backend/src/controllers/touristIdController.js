import crypto from 'crypto';
import { db } from '../models/db.js';
import { blockchainLedger } from '../services/blockchainLedger.js';
import { kycSandboxService } from '../services/kycSandbox.js';
import { encryptPII, maskSensitiveData } from '../services/dpdpManager.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';

export const touristIdController = {
  // Request Aadhaar OTP for e-KYC
  async requestAadhaarOtp(req, res) {
    try {
      const { aadhaarNumber } = req.body;
      if (!aadhaarNumber) {
        return res.status(400).json({ success: false, message: 'Aadhaar number is required.' });
      }

      const result = kycSandboxService.requestAadhaarOtp(aadhaarNumber);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // Pre-Register / Issue Digital Tourist ID
  async issueDigitalId(req, res) {
    try {
      const {
        fullName,
        nationality = 'Indian',
        dob,
        gender,
        bloodGroup,
        photoUrl,
        kycType = 'AADHAAR_EKYC',
        aadhaarNumber,
        passportNumber,
        otp,
        txnId,
        validFrom,
        validUntil,
        emergencyContacts = [],
        itinerary = [],
        optInTracking = true,
        trackingRecipients = 'police_and_family'
      } = req.body;

      if (!fullName || !validFrom || !validUntil) {
        return res.status(400).json({ success: false, message: 'Full name, trip start date, and end date are required.' });
      }

      // Perform e-KYC verification
      let kycRecord;
      if (kycType === 'AADHAAR_EKYC') {
        kycRecord = kycSandboxService.verifyAadhaarOtp(
          txnId || 'TXN-DIRECT',
          otp || '123456',
          aadhaarNumber,
          fullName,
          new Date().toISOString()
        );
      } else {
        kycRecord = kycSandboxService.verifyPassport(
          passportNumber || 'PASS-DEMO',
          nationality,
          fullName,
          validUntil
        );
      }

      const randSuffix = Math.floor(10000 + Math.random() * 90000);
      const touristId = `TID-NE-2026-${randSuffix}`;

      const userId = req.user ? req.user.id : ('usr-anon-' + crypto.randomBytes(4).toString('hex'));

      const initialLocation = itinerary.length > 0 ? {
        latitude: itinerary[0].lat,
        longitude: itinerary[0].lng,
        locationName: itinerary[0].name,
        timestamp: new Date().toISOString(),
        batteryLevel: 95,
        speedKmh: 0
      } : {
        latitude: 26.1445,
        longitude: 91.7362,
        locationName: 'Guwahati Transit Hub',
        timestamp: new Date().toISOString(),
        batteryLevel: 95,
        speedKmh: 0
      };

      const newTouristIdRecord = {
        touristId,
        userId,
        fullName,
        nationality,
        dob: dob || '1995-01-01',
        gender: gender || 'Not Specified',
        bloodGroup: bloodGroup || 'O+ Positive',
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        kycType: kycRecord.kycType,
        kycStatus: 'VERIFIED',
        kycHash: kycRecord.kycHash,
        maskedDocId: kycRecord.maskedDocId,
        encryptedDocId: kycRecord.encryptedDocId,
        emergencyContacts,
        validFrom,
        validUntil,
        status: 'ACTIVE',
        optInTracking,
        trackingRecipients,
        pairedWearableId: null,
        issuedBy: req.user ? `${req.user.role.toUpperCase()}: ${req.user.fullName}` : 'ONLINE_SELF_REGISTRATION',
        issuedAt: new Date().toISOString(),
        lastLocation: initialLocation,
        scheduledCheckIn: {
          isActive: false,
          trekName: null,
          intervalMinutes: 180,
          dueTime: null
        },
        itinerary: itinerary.map(item => ({
          ...item,
          status: item.status || 'UPCOMING'
        }))
      };

      db.data.touristIds.push(newTouristIdRecord);

      // Anchor to cryptographic Blockchain Ledger (FR-1.4)
      const blockchainBlock = blockchainLedger.recordDigitalIdIssuance(newTouristIdRecord);

      db.save();

      recordAuditDirect({
        userId,
        userName: fullName,
        userRole: req.user ? req.user.role : 'tourist',
        action: 'DIGITAL_ID_ISSUED',
        targetResource: touristId,
        details: `Issued Digital Tourist ID anchored in Block #${blockchainBlock.index}`
      });

      return res.status(201).json({
        success: true,
        message: 'Digital Tourist ID issued and anchored on blockchain successfully.',
        digitalId: newTouristIdRecord,
        blockchainAnchor: {
          blockIndex: blockchainBlock.index,
          blockHash: blockchainBlock.hash,
          merkleRoot: blockchainBlock.merkleRoot,
          timestamp: blockchainBlock.timestamp
        }
      });
    } catch (err) {
      console.error('Issue Digital ID error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to issue Digital ID.' });
    }
  },

  // Get Digital ID by ID
  async getById(req, res) {
    try {
      const { touristId } = req.params;
      const record = db.data.touristIds.find(t => t.touristId === touristId);

      if (!record) {
        return res.status(404).json({ success: false, message: 'Digital Tourist ID not found.' });
      }

      // Check auto-expiry (FR-1.3)
      const isExpired = new Date() > new Date(record.validUntil);
      if (isExpired && record.status === 'ACTIVE') {
        record.status = 'EXPIRED';
        db.save();
      }

      // Find blockchain transactions
      const blockchainTxs = blockchainLedger.findTransactionByTouristId(touristId);

      return res.json({
        success: true,
        digitalId: record,
        blockchainHistory: blockchainTxs,
        isExpired
      });
    } catch (err) {
      console.error('Get ID error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },

  // Get Digital ID for current logged in user
  async getMyDigitalId(req, res) {
    try {
      const record = db.data.touristIds.find(t => t.userId === req.user.id);
      if (!record) {
        return res.status(404).json({ success: false, message: 'No Digital ID found for this account.' });
      }

      const blockchainTxs = blockchainLedger.findTransactionByTouristId(record.touristId);

      return res.json({
        success: true,
        digitalId: record,
        blockchainHistory: blockchainTxs
      });
    } catch (err) {
      console.error('Get my ID error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  },

  // Public QR Code Verification endpoint for Police / Hotels / Checkpoints (FR-1.5)
  async verifyQrCode(req, res) {
    try {
      const { touristId, signature } = req.body;
      const record = db.data.touristIds.find(t => t.touristId === touristId);

      if (!record) {
        return res.status(404).json({
          success: false,
          isAuthentic: false,
          message: 'Invalid or counterfeit QR Code: Digital Tourist ID does not exist in registry.'
        });
      }

      const isExpired = new Date() > new Date(record.validUntil);
      const isRevoked = record.status === 'REVOKED';
      const blockchainRecord = blockchainLedger.findTransactionByTouristId(touristId);

      return res.json({
        success: true,
        isAuthentic: !isRevoked,
        status: isRevoked ? 'REVOKED' : (isExpired ? 'EXPIRED' : 'VALID_AND_ACTIVE'),
        verifiedDetails: {
          touristId: record.touristId,
          fullName: record.fullName,
          nationality: record.nationality,
          photoUrl: record.photoUrl,
          bloodGroup: record.bloodGroup,
          validFrom: record.validFrom,
          validUntil: record.validUntil,
          kycType: record.kycType,
          kycStatus: record.kycStatus,
          pairedWearableId: record.pairedWearableId,
          blockchainAnchored: blockchainRecord.length > 0,
          issuingAgency: 'Northeast India Smart Tourism & Police Consortium'
        }
      });
    } catch (err) {
      console.error('QR verification error:', err);
      return res.status(500).json({ success: false, message: 'QR verification failed.' });
    }
  },

  // Update Itinerary (FR-1.6)
  async updateItinerary(req, res) {
    try {
      const { touristId } = req.params;
      const { itinerary } = req.body;

      const record = db.data.touristIds.find(t => t.touristId === touristId);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Digital Tourist ID not found.' });
      }

      record.itinerary = itinerary;
      db.save();

      // Record immutable change on blockchain
      const block = blockchainLedger.recordItineraryUpdate(touristId, itinerary, req.user ? req.user.fullName : 'TOURIST_APP');

      recordAuditDirect({
        userId: req.user ? req.user.id : 'tourist',
        userName: req.user ? req.user.fullName : record.fullName,
        userRole: 'tourist',
        action: 'ITINERARY_UPDATED',
        targetResource: touristId,
        details: `Itinerary updated with ${itinerary.length} waypoints, anchored in block #${block.index}`
      });

      return res.json({
        success: true,
        message: 'Itinerary updated and anchored to blockchain ledger.',
        itinerary: record.itinerary,
        blockchainAnchor: {
          blockIndex: block.index,
          blockHash: block.hash
        }
      });
    } catch (err) {
      console.error('Update itinerary error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update itinerary.' });
    }
  },

  // Check-in ("I'm Safe" & Scheduled Trek Check-in) (FR-2.6)
  async submitCheckIn(req, res) {
    try {
      const { touristId } = req.params;
      const { note, locationName, latitude, longitude, scheduleNextMinutes, trekName } = req.body;

      const record = db.data.touristIds.find(t => t.touristId === touristId);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Digital Tourist ID not found.' });
      }

      const checkInTime = new Date().toISOString();

      if (latitude && longitude) {
        record.lastLocation = {
          latitude,
          longitude,
          locationName: locationName || 'Manual Check-in Point',
          timestamp: checkInTime,
          batteryLevel: record.lastLocation?.batteryLevel || 85,
          speedKmh: 0
        };
      }

      if (scheduleNextMinutes) {
        record.scheduledCheckIn = {
          isActive: true,
          trekName: trekName || 'Mountain Trek Route',
          intervalMinutes: scheduleNextMinutes,
          dueTime: new Date(Date.now() + scheduleNextMinutes * 60 * 1000).toISOString()
        };
      } else {
        // Reset overdue state if check-in was due
        if (record.scheduledCheckIn && record.scheduledCheckIn.isActive) {
          record.scheduledCheckIn.dueTime = new Date(Date.now() + (record.scheduledCheckIn.intervalMinutes || 180) * 60 * 1000).toISOString();
        }
      }

      db.save();

      recordAuditDirect({
        userId: req.user ? req.user.id : 'tourist',
        userName: record.fullName,
        userRole: 'tourist',
        action: 'SAFETY_CHECKIN_SUBMITTED',
        targetResource: touristId,
        details: `Safety check-in at ${locationName || 'GPS waypoint'}. Note: ${note || 'All safe.'}`
      });

      return res.json({
        success: true,
        message: 'Safety check-in recorded successfully. Family and authorities informed.',
        checkInTime,
        scheduledCheckIn: record.scheduledCheckIn
      });
    } catch (err) {
      console.error('Check-in error:', err);
      return res.status(500).json({ success: false, message: 'Failed to submit check-in.' });
    }
  },

  // Toggle Opt-in Tracking (FR-2.4)
  async updateTrackingConsent(req, res) {
    try {
      const { touristId } = req.params;
      const { optInTracking, trackingRecipients, durationHours } = req.body;

      const record = db.data.touristIds.find(t => t.touristId === touristId);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Digital Tourist ID not found.' });
      }

      record.optInTracking = optInTracking;
      if (trackingRecipients) record.trackingRecipients = trackingRecipients;
      if (durationHours) {
        record.trackingExpiresAt = new Date(Date.now() + durationHours * 3600000).toISOString();
      }

      db.save();

      recordAuditDirect({
        userId: req.user ? req.user.id : 'tourist',
        userName: record.fullName,
        userRole: 'tourist',
        action: optInTracking ? 'TRACKING_CONSENT_ENABLED' : 'TRACKING_CONSENT_REVOKED',
        targetResource: touristId,
        details: `Opt-in tracking set to ${optInTracking ? 'ACTIVE (' + record.trackingRecipients + ')' : 'DISABLED'}`
      });

      return res.json({
        success: true,
        message: `Tracking privacy preferences updated to: ${optInTracking ? 'Enabled' : 'Disabled'}`,
        optInTracking: record.optInTracking,
        trackingRecipients: record.trackingRecipients
      });
    } catch (err) {
      console.error('Tracking consent error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update tracking preferences.' });
    }
  },

  // List all Digital IDs (Authority & Operator)
  async listAll(req, res) {
    try {
      const list = db.data.touristIds.map(t => ({
        touristId: t.touristId,
        fullName: t.fullName,
        nationality: t.nationality,
        bloodGroup: t.bloodGroup,
        validFrom: t.validFrom,
        validUntil: t.validUntil,
        status: t.status,
        kycType: t.kycType,
        optInTracking: t.optInTracking,
        pairedWearableId: t.pairedWearableId,
        lastLocation: t.lastLocation
      }));

      return res.json({ success: true, count: list.length, touristIds: list });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to list tourist IDs.' });
    }
  }
};
