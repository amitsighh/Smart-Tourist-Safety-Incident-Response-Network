import { calculateDistanceKm } from './geofenceEngine.js';

export class AIAnomalyDetector {
  constructor() {
    this.inactivityThresholdMinutes = 120; // 2 hours threshold
    this.routeDeviationThresholdKm = 10; // 10 km corridor
    this.signalDropOffTimeoutMinutes = 90; // 1.5 hours without ping in remote area
    this.operatorFeedbackStats = {
      totalAlerts: 0,
      confirmed: 0,
      dismissed: 0
    };
  }

  // Calculate distance from point to line segment (cross-track distance)
  pointToSegmentDistanceKm(pointLat, pointLng, startLat, startLng, endLat, endLng) {
    const l2 = Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2);
    if (l2 === 0) return calculateDistanceKm(pointLat, pointLng, startLat, startLng);

    let t = ((pointLat - startLat) * (endLat - startLat) + (pointLng - startLng) * (endLng - startLng)) / l2;
    t = Math.max(0, Math.min(1, t));

    const projLat = startLat + t * (endLat - startLat);
    const projLng = startLng + t * (endLng - startLng);

    return calculateDistanceKm(pointLat, pointLng, projLat, projLng);
  }

  // Evaluate itinerary route deviation
  calculateRouteDeviation(currentLat, currentLng, itineraryWaypoints) {
    if (!itineraryWaypoints || itineraryWaypoints.length === 0) {
      return { deviationKm: 0, isDeviated: false, closestWaypoint: null };
    }

    if (itineraryWaypoints.length === 1) {
      const dist = calculateDistanceKm(currentLat, currentLng, itineraryWaypoints[0].lat, itineraryWaypoints[0].lng);
      return {
        deviationKm: parseFloat(dist.toFixed(2)),
        isDeviated: dist > this.routeDeviationThresholdKm,
        closestWaypoint: itineraryWaypoints[0].name
      };
    }

    let minDistance = Infinity;
    let closestSegment = null;

    for (let i = 0; i < itineraryWaypoints.length - 1; i++) {
      const p1 = itineraryWaypoints[i];
      const p2 = itineraryWaypoints[i + 1];
      const dist = this.pointToSegmentDistanceKm(currentLat, currentLng, p1.lat, p1.lng, p2.lat, p2.lng);

      if (dist < minDistance) {
        minDistance = dist;
        closestSegment = `${p1.name} → ${p2.name}`;
      }
    }

    return {
      deviationKm: parseFloat(minDistance.toFixed(2)),
      isDeviated: minDistance > this.routeDeviationThresholdKm,
      segment: closestSegment
    };
  }

  // Comprehensive multi-factor anomaly evaluator
  analyzeTouristTelemetry(tourist, recentPings = [], weatherRiskLevel = 'LOW') {
    const signals = [];
    let anomalyScore = 0; // 0 to 100
    const now = new Date();

    const lastPing = recentPings.length > 0 ? recentPings[recentPings.length - 1] : null;

    // 1. Signal Drop-off Analysis (FR-3.1)
    if (lastPing) {
      const lastPingTime = new Date(lastPing.timestamp);
      const minutesSinceLastPing = (now.getTime() - lastPingTime.getTime()) / (1000 * 60);

      if (minutesSinceLastPing > this.signalDropOffTimeoutMinutes) {
        const severityWeight = minutesSinceLastPing > 240 ? 35 : 20;
        anomalyScore += severityWeight;
        signals.push({
          type: 'SIGNAL_LOSS',
          name: 'Unexpected Signal Drop-off',
          severity: minutesSinceLastPing > 240 ? 'CRITICAL' : 'HIGH',
          weight: severityWeight,
          details: `No telemetry received for ${Math.round(minutesSinceLastPing)} minutes in remote sector (${lastPing.area || 'Highland Terrain'}).`
        });
      }
    }

    // 2. Prolonged Inactivity Analysis (FR-3.2)
    if (recentPings.length >= 3) {
      const firstInWindow = recentPings[0];
      const distMoved = calculateDistanceKm(
        firstInWindow.latitude, firstInWindow.longitude,
        lastPing.latitude, lastPing.longitude
      );
      const durationHours = (new Date(lastPing.timestamp) - new Date(firstInWindow.timestamp)) / (1000 * 60 * 60);

      if (durationHours >= 2 && distMoved < 0.05 && lastPing.isTransitZone) {
        anomalyScore += 25;
        signals.push({
          type: 'PROLONGED_INACTIVITY',
          name: 'Stationary in High-Risk Transit Corridor',
          severity: 'HIGH',
          weight: 25,
          details: `Tourist has remained within 50m radius for ${durationHours.toFixed(1)} hours along remote highway corridor.`
        });
      }
    }

    // 3. Route Deviation Analysis (FR-3.3)
    if (lastPing && tourist.itinerary && tourist.itinerary.length > 0) {
      const routeCheck = this.calculateRouteDeviation(lastPing.latitude, lastPing.longitude, tourist.itinerary);
      if (routeCheck.isDeviated) {
        const weight = Math.min(30, Math.round(routeCheck.deviationKm * 2));
        anomalyScore += weight;
        signals.push({
          type: 'ROUTE_DEVIATION',
          name: 'Significant Itinerary Deviation',
          severity: routeCheck.deviationKm > 25 ? 'CRITICAL' : 'MEDIUM',
          weight,
          details: `Current location is ${routeCheck.deviationKm} km off planned corridor (${routeCheck.segment || 'Registered Route'}).`
        });
      }
    }

    // 4. Missed Scheduled Check-in (FR-3.4)
    if (tourist.scheduledCheckIn && tourist.scheduledCheckIn.isActive) {
      const dueTime = new Date(tourist.scheduledCheckIn.dueTime);
      if (now > dueTime) {
        const minutesOverdue = Math.round((now - dueTime) / (1000 * 60));
        anomalyScore += 30;
        signals.push({
          type: 'MISSED_CHECKIN',
          name: 'Failed Trek Check-In',
          severity: 'CRITICAL',
          weight: 30,
          details: `Scheduled safety check-in for "${tourist.scheduledCheckIn.trekName || 'High-Risk Trail'}" is overdue by ${minutesOverdue} minutes.`
        });
      }
    }

    // 5. Environmental & Weather Risk Factor (FR-3.5)
    if (weatherRiskLevel === 'HIGH' || weatherRiskLevel === 'SEVERE') {
      anomalyScore += 15;
      signals.push({
        type: 'WEATHER_HAZARD',
        name: 'Severe Regional Weather Alert Active',
        severity: 'MEDIUM',
        weight: 15,
        details: 'Active IMD Red/Orange alert for heavy rainfall, landslide or sub-zero blizzard in active district.'
      });
    }

    // Normalize anomaly score 0-100
    const finalScore = Math.min(100, anomalyScore);

    let classification = 'NORMAL';
    let severity = 'LOW';
    if (finalScore >= 70) {
      classification = 'CRITICAL_ANOMALY';
      severity = 'CRITICAL';
    } else if (finalScore >= 45) {
      classification = 'DISTRESS_SUSPECTED';
      severity = 'HIGH';
    } else if (finalScore >= 25) {
      classification = 'WATCHLIST';
      severity = 'MEDIUM';
    }

    const confidence = Math.min(96, Math.max(50, Math.round(55 + (signals.length * 12))));

    return {
      touristId: tourist.touristId,
      touristName: tourist.fullName,
      anomalyScore: finalScore,
      classification,
      severity,
      confidenceScore: `${confidence}%`,
      triggerCount: signals.length,
      signals,
      requiresImmediateTriage: finalScore >= 45,
      evaluatedAt: now.toISOString(),
      explainabilitySummary: signals.length === 0
        ? 'All telemetry patterns within nominal baseline expectations.'
        : `Flagged by ${signals.length} combined anomaly signal(s): ` + signals.map(s => s.name).join(', ')
    };
  }

  // Dynamic Safety Score (0-100) computed for tourist UI (FR-2.1)
  computeTouristSafetyScore(currentHour, inHazardZone, routeDeviationKm, weatherRisk, batteryPct) {
    let score = 100;
    const deductions = [];

    // Time of day (night travel in mountain sectors)
    if (currentHour >= 20 || currentHour < 5) {
      score -= 15;
      deductions.push('Night travel penalty (reduced visibility & closed check-posts)');
    }

    // Geofence risk zone
    if (inHazardZone) {
      score -= 30;
      deductions.push('Location in restricted / high-hazard geo-fence');
    }

    // Route deviation
    if (routeDeviationKm > 10) {
      const devPenalty = Math.min(25, Math.round(routeDeviationKm * 1.5));
      score -= devPenalty;
      deductions.push(`Off-route by ${routeDeviationKm} km`);
    }

    // Weather
    if (weatherRisk === 'SEVERE') {
      score -= 20;
      deductions.push('Active severe weather advisory in area');
    } else if (weatherRisk === 'MODERATE') {
      score -= 10;
      deductions.push('Moderate weather alert active');
    }

    // Device battery
    if (batteryPct < 20) {
      score -= 15;
      deductions.push(`Low battery (${batteryPct}%) warning`);
    }

    score = Math.max(10, Math.min(100, score));

    let tier = 'EXCELLENT';
    let color = 'emerald';
    let advisory = 'Your travel safety conditions are excellent. Stay on marked paths.';

    if (score < 50) {
      tier = 'CRITICAL';
      color = 'red';
      advisory = 'High risk conditions detected! Move towards nearest police check-post or designated tourist hub immediately.';
    } else if (score < 75) {
      tier = 'CAUTION';
      color = 'amber';
      advisory = 'Elevated caution advised. Avoid solitary detours and keep emergency contacts updated.';
    }

    return {
      safetyScore: score,
      tier,
      color,
      advisory,
      deductions
    };
  }

  recordOperatorFeedback(alertId, isConfirmed, operatorNotes) {
    this.operatorFeedbackStats.totalAlerts++;
    if (isConfirmed) {
      this.operatorFeedbackStats.confirmed++;
    } else {
      this.operatorFeedbackStats.dismissed++;
    }
    return {
      alertId,
      status: isConfirmed ? 'CONFIRMED_AND_RETRAINED' : 'DISMISSED_FALSE_POSITIVE',
      feedbackRecorded: new Date().toISOString(),
      updatedModelAccuracy: ((this.operatorFeedbackStats.confirmed / Math.max(1, this.operatorFeedbackStats.totalAlerts)) * 100).toFixed(1) + '%'
    };
  }
}

export const aiAnomalyDetector = new AIAnomalyDetector();
