import crypto from 'crypto';
import { db } from '../models/db.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';

export const geofenceController = {
  // List all geofences (FR-4.5)
  async listAll(req, res) {
    try {
      return res.json({
        success: true,
        count: db.data.geofences.length,
        geofences: db.data.geofences
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve geofences.' });
    }
  },

  // Create new Geofence (Polygon or Circle)
  async create(req, res) {
    try {
      const { name, category, severity, type, coordinates, center, radiusMeters, advisory, safeRouteSuggestion, schedule } = req.body;

      if (!name || !type || !category) {
        return res.status(400).json({ success: false, message: 'Name, type, and category are required.' });
      }

      const newId = 'GF-NE-' + crypto.randomBytes(3).toString('hex').toUpperCase();

      const newGeofence = {
        id: newId,
        name,
        category, // 'restricted', 'high_risk', 'curfew', 'weather_hazard'
        severity: severity || 'HIGH',
        type, // 'polygon' or 'circle'
        coordinates: type === 'polygon' ? (coordinates || []) : null,
        center: type === 'circle' ? (center || { lat: 26.1445, lng: 91.7362 }) : null,
        radiusMeters: type === 'circle' ? (radiusMeters || 2000) : null,
        advisory: advisory || 'Restricted entry zone.',
        safeRouteSuggestion: safeRouteSuggestion || 'Follow primary highway route.',
        isActive: true,
        schedule: schedule || { allDay: true },
        createdAt: new Date().toISOString()
      };

      db.data.geofences.push(newGeofence);
      db.save();

      recordAuditDirect({
        userId: req.user ? req.user.id : 'admin',
        userName: req.user ? req.user.fullName : 'Administrator',
        userRole: req.user ? req.user.role : 'admin',
        action: 'GEOFENCE_CREATED',
        targetResource: newId,
        details: `Created new ${type} geofence: ${name}`
      });

      return res.status(201).json({ success: true, message: 'Geofence created successfully.', geofence: newGeofence });
    } catch (err) {
      console.error('Create geofence error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create geofence.' });
    }
  },

  // Toggle active state or delete
  async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const fence = db.data.geofences.find(g => g.id === id);

      if (!fence) {
        return res.status(404).json({ success: false, message: 'Geofence not found.' });
      }

      fence.isActive = !fence.isActive;
      db.save();

      return res.json({ success: true, message: `Geofence ${fence.name} is now ${fence.isActive ? 'Active' : 'Disabled'}.`, geofence: fence });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to toggle geofence.' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const idx = db.data.geofences.findIndex(g => g.id === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Geofence not found.' });
      }

      const deleted = db.data.geofences.splice(idx, 1)[0];
      db.save();

      return res.json({ success: true, message: `Geofence ${deleted.name} deleted.` });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete geofence.' });
    }
  }
};
