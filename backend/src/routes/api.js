import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { touristIdController } from '../controllers/touristIdController.js';
import { trackingController } from '../controllers/trackingController.js';
import { incidentController } from '../controllers/incidentController.js';
import { efirController } from '../controllers/efirController.js';
import { geofenceController } from '../controllers/geofenceController.js';
import { aiAnomalyController } from '../controllers/aiAnomalyController.js';
import { blockchainController } from '../controllers/blockchainController.js';
import { adminAuditController } from '../controllers/adminAuditController.js';
import { wearableController } from '../controllers/wearableController.js';
import { advisoryController } from '../controllers/advisoryController.js';
import { helpController } from '../controllers/helpController.js';
import { newsController } from '../controllers/newsController.js';
import { notificationController } from '../controllers/notificationController.js';
import { authenticateToken, requireRole, authorizeResourceOwner } from '../middleware/authMiddleware.js';
import { auditLog } from '../middleware/auditLogger.js';
import { authLimiter, emergencySosLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/verify-mfa', authLimiter, authController.verifyMfa);
router.get('/auth/me', authenticateToken, authController.getMe);

// --- Tourist ID & KYC Routes ---
router.post('/tourist-id/request-aadhaar-otp', authLimiter, touristIdController.requestAadhaarOtp);
router.post('/tourist-id/issue', touristIdController.issueDigitalId);
router.get('/tourist-id/my-id', authenticateToken, touristIdController.getMyDigitalId);
router.get('/tourist-id/all', authenticateToken, requireRole(['operator', 'police', 'tourism_official', 'admin']), auditLog('VIEW_ALL_TOURIST_IDS'), touristIdController.listAll);
router.get('/tourist-id/:touristId', authenticateToken, authorizeResourceOwner, auditLog('VIEW_TOURIST_ID_RECORD'), touristIdController.getById);
router.post('/tourist-id/verify-qr', auditLog('QR_CODE_VERIFICATION'), touristIdController.verifyQrCode);
router.get('/tourist-id/verify-public/:touristId', touristIdController.getPublicVerification);
router.put('/tourist-id/:touristId/itinerary', authenticateToken, authorizeResourceOwner, touristIdController.updateItinerary);
router.post('/tourist-id/:touristId/check-in', authenticateToken, authorizeResourceOwner, touristIdController.submitCheckIn);
router.put('/tourist-id/:touristId/tracking-consent', authenticateToken, authorizeResourceOwner, touristIdController.updateTrackingConsent);

// --- Tracking & Emergency SOS Routes ---
router.post('/tracking/ping', trackingController.submitPing);
router.post('/tracking/sos', emergencySosLimiter, trackingController.triggerPanicSos);
router.get('/tracking/live-map', authenticateToken, requireRole(['police', 'operator', 'tourism_official', 'admin']), auditLog('VIEW_LIVE_GIS_MAP'), trackingController.getLiveMapLocations);

// --- Incident Management & Alert Triage Routes ---
router.get('/incidents', authenticateToken, requireRole(['police', 'operator', 'tourism_official', 'admin']), incidentController.getAlerts);
router.put('/incidents/:alertId/acknowledge', authenticateToken, requireRole(['police', 'admin']), incidentController.acknowledgeAlert);
router.put('/incidents/:alertId/assign-unit', authenticateToken, requireRole(['police', 'admin']), incidentController.assignUnit);
router.put('/incidents/:alertId/resolve', authenticateToken, requireRole(['police', 'admin']), incidentController.resolveAlert);

// --- E-FIR Routes ---
router.post('/efir/generate', authenticateToken, requireRole(['police', 'admin']), auditLog('GENERATE_LEGAL_EFIR'), efirController.generateEfir);
router.get('/efir', authenticateToken, requireRole(['police', 'tourism_official', 'admin']), efirController.listAll);
router.get('/efir/:id', authenticateToken, requireRole(['police', 'tourism_official', 'admin']), efirController.getById);

// --- Geofences Routes ---
router.get('/geofences', geofenceController.listAll);
router.post('/geofences', authenticateToken, requireRole(['police', 'operator', 'tourism_official', 'admin']), geofenceController.create);
router.patch('/geofences/:id/toggle', authenticateToken, requireRole(['police', 'operator', 'tourism_official', 'admin']), geofenceController.toggleActive);
router.delete('/geofences/:id', authenticateToken, requireRole(['admin']), geofenceController.delete);

// --- AI Anomaly Detection Routes ---
router.get('/anomaly/scan', authenticateToken, requireRole(['police', 'tourism_official', 'admin']), aiAnomalyController.scanActiveTourists);
router.get('/anomaly/explain/:touristId', authenticateToken, requireRole(['police', 'tourism_official', 'admin']), aiAnomalyController.getTouristExplainability);
router.post('/anomaly/feedback', authenticateToken, requireRole(['police', 'admin']), aiAnomalyController.submitOperatorFeedback);

// --- Blockchain Explorer & Verifier Routes ---
router.get('/blockchain/status', blockchainController.getStatus);
router.get('/blockchain/blocks', blockchainController.getAllBlocks);
router.get('/blockchain/blocks/:index', blockchainController.getBlockByIndex);
router.get('/blockchain/verify/:touristId', blockchainController.verifyTouristIdProof);
router.post('/blockchain/test-tamper', authenticateToken, requireRole(['admin']), blockchainController.testTamperDetection);

// --- Admin & DPDP Audit Routes ---
router.get('/admin/stats', authenticateToken, requireRole(['police', 'tourism_official', 'admin']), adminAuditController.getSystemStats);
router.get('/admin/audit-logs', authenticateToken, requireRole(['admin']), adminAuditController.getAuditLogs);
router.post('/admin/run-dpdp-purge', authenticateToken, requireRole(['admin']), adminAuditController.runDpdpRetentionPurge);
router.get('/admin/users', authenticateToken, requireRole(['admin']), adminAuditController.listUsers);

// --- IoT Wearables Routes ---
router.get('/wearables', authenticateToken, requireRole(['operator', 'police', 'admin']), wearableController.listWearables);
router.post('/wearables/pair', authenticateToken, requireRole(['operator', 'admin']), wearableController.pairWearable);
router.post('/wearables/unpair', authenticateToken, requireRole(['operator', 'admin']), wearableController.unpairWearable);
router.post('/wearables/telemetry', wearableController.updateTelemetry);

// --- Advisories Routes ---
router.get('/advisories', advisoryController.listAdvisories);
router.post('/advisories', authenticateToken, requireRole(['tourism_official', 'police', 'admin']), advisoryController.broadcastAdvisory);

// --- Help, Grievance & Lost Passport Assistance Routes ---
router.post('/help/lost-passport', helpController.submitLostPassportReport);
router.post('/help/grievances', helpController.submitGrievance);
router.get('/help/track/:caseId', helpController.trackCase);
router.get('/help/resources', helpController.getConsularResources);

// --- Live Location News & Field Reports Routes ---
router.get('/news', newsController.listNews);
router.get('/news/nearby', newsController.getNearbyNews);
router.post('/news', authenticateToken, requireRole(['police', 'tourism_official', 'operator', 'admin']), newsController.publishNews);
router.delete('/news/:id', authenticateToken, requireRole(['police', 'tourism_official', 'admin']), newsController.deleteNews);

// --- Notification & Dispatch Service Routes ---
router.get('/notifications/logs', authenticateToken, requireRole(['police', 'tourism_official', 'medical', 'disaster_response', 'admin']), notificationController.getLogs);
router.post('/notifications/sms-inbound', notificationController.handleInboundSms);
router.post('/notifications/webhook', notificationController.handleDeliveryWebhook);
router.post('/notifications/simulate-scenario', authenticateToken, requireRole(['police', 'tourism_official', 'admin', 'operator']), notificationController.simulateScenario);

export default router;
