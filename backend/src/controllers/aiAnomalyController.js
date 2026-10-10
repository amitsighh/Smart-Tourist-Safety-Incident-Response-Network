import { db } from '../models/db.js';
import { aiAnomalyDetector } from '../services/aiAnomalyDetector.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';

export const aiAnomalyController = {
  // Run real-time AI Anomaly Scan across all active tourists (FR-3.1 - FR-3.5)
  async scanActiveTourists(req, res) {
    try {
      const activeTourists = db.data.touristIds.filter(t => t.status === 'ACTIVE');
      const scanResults = [];

      for (const tourist of activeTourists) {
        const pings = db.data.trackingPings.filter(p => p.touristId === tourist.touristId);
        const analysis = aiAnomalyDetector.analyzeTouristTelemetry(tourist, pings, 'LOW');
        scanResults.push(analysis);
      }

      // Sort by highest anomaly score first
      scanResults.sort((a, b) => b.anomalyScore - a.anomalyScore);

      const highRiskCount = scanResults.filter(r => r.requiresImmediateTriage).length;

      return res.json({
        success: true,
        evaluatedCount: scanResults.length,
        highRiskCount,
        results: scanResults,
        scannedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Anomaly scan error:', err);
      return res.status(500).json({ success: false, message: 'AI Anomaly scan failed.' });
    }
  },

  // Get Detailed Explainability Report for a Tourist (FR-3.7)
  async getTouristExplainability(req, res) {
    try {
      const { touristId } = req.params;
      const tourist = db.data.touristIds.find(t => t.touristId === touristId);

      if (!tourist) {
        return res.status(404).json({ success: false, message: 'Tourist ID not found.' });
      }

      const pings = db.data.trackingPings.filter(p => p.touristId === touristId);
      const analysis = aiAnomalyDetector.analyzeTouristTelemetry(tourist, pings, 'MODERATE');

      return res.json({
        success: true,
        tourist: {
          touristId: tourist.touristId,
          fullName: tourist.fullName,
          nationality: tourist.nationality,
          lastLocation: tourist.lastLocation
        },
        analysis
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to generate explainability report.' });
    }
  },

  // Human-in-the-Loop Operator Feedback / Retraining (FR-3.6)
  async submitOperatorFeedback(req, res) {
    try {
      const { alertId, isConfirmed, operatorNotes } = req.body;

      if (!alertId || isConfirmed === undefined) {
        return res.status(400).json({ success: false, message: 'alertId and isConfirmed boolean are required.' });
      }

      const feedbackResult = aiAnomalyDetector.recordOperatorFeedback(alertId, isConfirmed, operatorNotes);

      recordAuditDirect({
        userId: req.user ? req.user.id : 'police',
        userName: req.user ? req.user.fullName : 'Operator Officer',
        userRole: req.user ? req.user.role : 'police',
        action: 'AI_FEEDBACK_RECORDED',
        targetResource: alertId,
        details: `Operator marked alert as ${isConfirmed ? 'CONFIRMED ANOMALY' : 'DISMISSED FALSE POSITIVE'}. Notes: ${operatorNotes || 'N/A'}`
      });

      return res.json({
        success: true,
        message: 'Feedback recorded successfully and fed back into neural model weight adjustment buffer.',
        feedback: feedbackResult
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to record AI feedback.' });
    }
  }
};
