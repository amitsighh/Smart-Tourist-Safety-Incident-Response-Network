const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('suraksha_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const api = {
  // --- Auth ---
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async verifyMfa(mfaTempToken, otp) {
    const res = await fetch(`${API_BASE}/auth/verify-mfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mfaTempToken, otp })
    });
    return res.json();
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // --- Tourist ID & KYC ---
  async requestAadhaarOtp(aadhaarNumber) {
    const res = await fetch(`${API_BASE}/tourist-id/request-aadhaar-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadhaarNumber })
    });
    return res.json();
  },

  async issueDigitalId(data) {
    const res = await fetch(`${API_BASE}/tourist-id/issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getMyDigitalId() {
    const res = await fetch(`${API_BASE}/tourist-id/my-id`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getDigitalIdById(touristId) {
    const res = await fetch(`${API_BASE}/tourist-id/${touristId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getAllTouristIds() {
    const res = await fetch(`${API_BASE}/tourist-id/all`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async verifyQrCode(touristId, signature) {
    const res = await fetch(`${API_BASE}/tourist-id/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ touristId, signature })
    });
    return res.json();
  },

  async updateItinerary(touristId, itinerary) {
    const res = await fetch(`${API_BASE}/tourist-id/${touristId}/itinerary`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ itinerary })
    });
    return res.json();
  },

  async submitCheckIn(touristId, checkInData) {
    const res = await fetch(`${API_BASE}/tourist-id/${touristId}/check-in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(checkInData)
    });
    return res.json();
  },

  async updateTrackingConsent(touristId, consentData) {
    const res = await fetch(`${API_BASE}/tourist-id/${touristId}/tracking-consent`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(consentData)
    });
    return res.json();
  },

  // --- Tracking & SOS ---
  async submitPing(pingData) {
    const res = await fetch(`${API_BASE}/tracking/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pingData)
    });
    return res.json();
  },

  async triggerPanicSos(sosData) {
    const res = await fetch(`${API_BASE}/tracking/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sosData)
    });
    return res.json();
  },

  async getLiveMapLocations() {
    const res = await fetch(`${API_BASE}/tracking/live-map`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // --- Incidents & Alert Queue ---
  async getAlerts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/incidents${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async acknowledgeAlert(alertId) {
    const res = await fetch(`${API_BASE}/incidents/${alertId}/acknowledge`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async assignUnit(alertId, unitId, notes) {
    const res = await fetch(`${API_BASE}/incidents/${alertId}/assign-unit`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ unitId, notes })
    });
    return res.json();
  },

  async resolveAlert(alertId, resolutionNotes) {
    const res = await fetch(`${API_BASE}/incidents/${alertId}/resolve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolutionNotes })
    });
    return res.json();
  },

  // --- E-FIR ---
  async generateEfir(touristId, incidentId, officerDetails) {
    const res = await fetch(`${API_BASE}/efir/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ touristId, incidentId, officerDetails })
    });
    return res.json();
  },

  async getEfirList() {
    const res = await fetch(`${API_BASE}/efir`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getEfirById(id) {
    const res = await fetch(`${API_BASE}/efir/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // --- Geofences ---
  async getGeofences() {
    const res = await fetch(`${API_BASE}/geofences`);
    return res.json();
  },

  async createGeofence(fenceData) {
    const res = await fetch(`${API_BASE}/geofences`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(fenceData)
    });
    return res.json();
  },

  async toggleGeofence(id) {
    const res = await fetch(`${API_BASE}/geofences/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async deleteGeofence(id) {
    const res = await fetch(`${API_BASE}/geofences/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // --- AI Anomaly ---
  async scanAnomaly() {
    const res = await fetch(`${API_BASE}/anomaly/scan`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getExplainability(touristId) {
    const res = await fetch(`${API_BASE}/anomaly/explain/${touristId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async submitAiFeedback(alertId, isConfirmed, operatorNotes) {
    const res = await fetch(`${API_BASE}/anomaly/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ alertId, isConfirmed, operatorNotes })
    });
    return res.json();
  },

  // --- Blockchain ---
  async getBlockchainStatus() {
    const res = await fetch(`${API_BASE}/blockchain/status`);
    return res.json();
  },

  async getBlockchainBlocks() {
    const res = await fetch(`${API_BASE}/blockchain/blocks`);
    return res.json();
  },

  async verifyTouristBlockchainProof(touristId) {
    const res = await fetch(`${API_BASE}/blockchain/verify/${touristId}`);
    return res.json();
  },

  async testTamperDetection(blockIndex, simulateMaliciousEdit) {
    const res = await fetch(`${API_BASE}/blockchain/test-tamper`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ blockIndex, simulateMaliciousEdit })
    });
    return res.json();
  },

  // --- Admin & DPDP ---
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/audit-logs${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async runDpdpPurge() {
    const res = await fetch(`${API_BASE}/admin/run-dpdp-purge`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // --- IoT Wearables ---
  async getWearables() {
    const res = await fetch(`${API_BASE}/wearables`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async pairWearable(wearableId, touristId) {
    const res = await fetch(`${API_BASE}/wearables/pair`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ wearableId, touristId })
    });
    return res.json();
  },

  async unpairWearable(wearableId) {
    const res = await fetch(`${API_BASE}/wearables/unpair`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ wearableId })
    });
    return res.json();
  },

  async updateWearableTelemetry(data) {
    const res = await fetch(`${API_BASE}/wearables/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // --- Advisories ---
  async getAdvisories() {
    const res = await fetch(`${API_BASE}/advisories`);
    return res.json();
  },

  async broadcastAdvisory(advisoryData) {
    const res = await fetch(`${API_BASE}/advisories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(advisoryData)
    });
    return res.json();
  },

  // --- Help, Lost Passport & Grievances ---
  async submitLostPassportReport(data) {
    const res = await fetch(`${API_BASE}/help/lost-passport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async submitGrievance(data) {
    const res = await fetch(`${API_BASE}/help/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async trackCase(caseId) {
    const res = await fetch(`${API_BASE}/help/track/${encodeURIComponent(caseId)}`);
    return res.json();
  },

  async getConsularResources() {
    const res = await fetch(`${API_BASE}/help/resources`);
    return res.json();
  },

  // --- Live Location News & Bulletins ---
  async getNews(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/news${query ? `?${query}` : ''}`);
    return res.json();
  },

  async getNearbyNews(lat, lng, radiusKm = 100) {
    const res = await fetch(`${API_BASE}/news/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);
    return res.json();
  },

  async publishNews(newsData) {
    const res = await fetch(`${API_BASE}/news`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newsData)
    });
    return res.json();
  },

  async deleteNews(id) {
    const res = await fetch(`${API_BASE}/news/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // --- Notifications, SMS & Scenarios ---
  async getNotificationLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/notifications/logs${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async simulateScenario(data) {
    const res = await fetch(`${API_BASE}/notifications/simulate-scenario`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async sendInboundSms(data) {
    const res = await fetch(`${API_BASE}/notifications/sms-inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getPublicVerification(touristId) {
    const res = await fetch(`${API_BASE}/tourist-id/verify-public/${encodeURIComponent(touristId)}`);
    return res.json();
  }
};
