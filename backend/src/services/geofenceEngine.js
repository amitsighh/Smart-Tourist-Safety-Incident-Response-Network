// Ray-casting point-in-polygon algorithm & Haversine distance calculator

export function isPointInPolygon(point, polygonCoordinates) {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygonCoordinates.length - 1; i < polygonCoordinates.length; j = i++) {
    const [latI, lngI] = polygonCoordinates[i];
    const [latJ, lngJ] = polygonCoordinates[j];

    const intersect = ((latI > lat) !== (latJ > lat)) &&
      (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isScheduleActive(schedule) {
  if (!schedule || schedule.allDay) return true;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeVal = currentHour * 60 + currentMinute;

  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const startVal = startH * 60 + startM;
  const endVal = endH * 60 + endM;

  if (startVal <= endVal) {
    return currentTimeVal >= startVal && currentTimeVal <= endVal;
  } else {
    // Over midnight curfew (e.g., 18:00 to 06:00)
    return currentTimeVal >= startVal || currentTimeVal <= endVal;
  }
}

export class GeofenceEngine {
  constructor(geofences = []) {
    this.geofences = geofences;
  }

  setGeofences(geofences) {
    this.geofences = geofences;
  }

  evaluateLocation(lat, lng) {
    const breaches = [];
    const nearbyWarnings = [];

    for (const fence of this.geofences) {
      if (!fence.isActive) continue;
      const scheduleActive = isScheduleActive(fence.schedule);

      if (fence.type === 'polygon' && fence.coordinates && fence.coordinates.length >= 3) {
        const isInside = isPointInPolygon([lat, lng], fence.coordinates);
        if (isInside && scheduleActive) {
          breaches.push({
            geofenceId: fence.id,
            name: fence.name,
            category: fence.category, // 'restricted', 'high_risk', 'curfew', 'weather_hazard'
            severity: fence.severity || 'CRITICAL',
            advisory: fence.advisory,
            safeRouteSuggestion: fence.safeRouteSuggestion,
            scheduleActive
          });
        }
      } else if (fence.type === 'circle' && fence.center) {
        const distKm = calculateDistanceKm(lat, lng, fence.center.lat, fence.center.lng);
        const radiusKm = (fence.radiusMeters || 1000) / 1000;
        if (distKm <= radiusKm && scheduleActive) {
          breaches.push({
            geofenceId: fence.id,
            name: fence.name,
            category: fence.category,
            severity: fence.severity || 'CRITICAL',
            advisory: fence.advisory,
            safeRouteSuggestion: fence.safeRouteSuggestion,
            distanceToCenterKm: distKm.toFixed(2),
            scheduleActive
          });
        } else if (distKm <= radiusKm * 1.5) {
          nearbyWarnings.push({
            geofenceId: fence.id,
            name: fence.name,
            category: fence.category,
            distanceKm: (distKm - radiusKm).toFixed(2),
            advisory: `Approaching ${fence.name}. Entry requires specialized permit or caution.`
          });
        }
      }
    }

    return {
      insideBreaches: breaches,
      nearbyWarnings,
      hasBreach: breaches.length > 0
    };
  }
}
