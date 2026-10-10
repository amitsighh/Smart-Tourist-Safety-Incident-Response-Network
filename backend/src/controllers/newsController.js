import { db } from '../models/db.js';
import { recordAuditDirect } from '../middleware/auditLogger.js';

// Haversine distance calculator in kilometers
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const newsController = {
  // 1. List all active location news reports with filters
  listNews: async (req, res) => {
    try {
      const { category, region, state, severity, search, limit = 50 } = req.query;

      let list = [...(db.data.locationNews || [])];

      if (category && category !== 'ALL') {
        list = list.filter((n) => n.category?.toUpperCase() === category.toUpperCase());
      }

      if (region && region !== 'ALL') {
        list = list.filter((n) => n.region?.toLowerCase().includes(region.toLowerCase()) || n.state?.toLowerCase().includes(region.toLowerCase()));
      }

      if (state && state !== 'ALL') {
        list = list.filter((n) => n.state?.toLowerCase() === state.toLowerCase());
      }

      if (severity && severity !== 'ALL') {
        list = list.filter((n) => n.severity?.toUpperCase() === severity.toUpperCase());
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (n) =>
            n.headline?.toLowerCase().includes(q) ||
            n.locationName?.toLowerCase().includes(q) ||
            n.summary?.toLowerCase().includes(q) ||
            n.sourceAgency?.toLowerCase().includes(q)
        );
      }

      // Sort breaking news first, then most recent
      list.sort((a, b) => {
        if (a.isBreaking && !b.isBreaking) return -1;
        if (!a.isBreaking && b.isBreaking) return 1;
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });

      return res.json({
        success: true,
        count: list.length,
        news: list.slice(0, Number(limit))
      });
    } catch (err) {
      console.error('Error listing location news:', err);
      return res.status(500).json({ error: 'Failed to retrieve location news reports.' });
    }
  },

  // 2. Proximity-based News by GPS Coordinates
  getNearbyNews: async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radiusKm = parseFloat(req.query.radiusKm) || 100; // default 100km radius

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
      }

      const all = db.data.locationNews || [];
      const nearby = [];

      for (const item of all) {
        if (item.latitude && item.longitude) {
          const dist = calculateDistanceKm(lat, lng, item.latitude, item.longitude);
          if (dist <= radiusKm) {
            nearby.push({
              ...item,
              distanceKm: dist
            });
          }
        }
      }

      // Sort by distance ascending
      nearby.sort((a, b) => a.distanceKm - b.distanceKm);

      return res.json({
        success: true,
        queryLocation: { latitude: lat, longitude: lng, radiusKm },
        count: nearby.length,
        news: nearby
      });
    } catch (err) {
      console.error('Error getting nearby news:', err);
      return res.status(500).json({ error: 'Failed to retrieve nearby location news.' });
    }
  },

  // 3. Publish a new verified location news report (Authorities only)
  publishNews: async (req, res) => {
    try {
      const {
        headline,
        locationName,
        region,
        state = 'Assam',
        latitude,
        longitude,
        category = 'ROAD_TRANSIT',
        severity = 'INFO',
        sourceAgency,
        summary,
        travelAdvice,
        isBreaking = false
      } = req.body;

      if (!headline || !locationName || !summary) {
        return res.status(400).json({
          error: 'Missing required fields: headline, locationName, and summary are required.'
        });
      }

      const id = `NEWS-2026-${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date().toISOString();

      const newReport = {
        id,
        headline,
        locationName,
        region: region || locationName,
        state,
        latitude: parseFloat(latitude) || 26.1445,
        longitude: parseFloat(longitude) || 91.7362,
        category,
        severity,
        sourceAgency: sourceAgency || (req.user ? `${req.user.fullName} (${req.user.role.toUpperCase()})` : 'State Tourism Safety Cell'),
        summary,
        travelAdvice: travelAdvice || 'Exercise caution and follow local police instructions.',
        isBreaking: Boolean(isBreaking),
        publishedAt: now,
        verified: true
      };

      db.data.locationNews.unshift(newReport);
      db.save();

      recordAuditDirect({
        userId: req.user ? req.user.id : 'system',
        userName: req.user ? req.user.fullName : 'Command Operator',
        userRole: req.user ? req.user.role : 'police',
        action: 'LOCATION_NEWS_PUBLISHED',
        targetResource: id,
        details: `Published localized news bulletin: "${headline}" at ${locationName}`
      });

      return res.status(201).json({
        success: true,
        message: 'Location news bulletin published and broadcasted to sector.',
        news: newReport
      });
    } catch (err) {
      console.error('Error publishing location news:', err);
      return res.status(500).json({ error: 'Failed to publish location news report.' });
    }
  },

  // 4. Delete / Archive a news report
  deleteNews: async (req, res) => {
    try {
      const { id } = req.params;
      const index = db.data.locationNews.findIndex((n) => n.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'News report not found.' });
      }

      db.data.locationNews.splice(index, 1);
      db.save();

      return res.json({ success: true, message: 'News report deleted successfully.' });
    } catch (err) {
      console.error('Error deleting news:', err);
      return res.status(500).json({ error: 'Failed to delete news report.' });
    }
  }
};
