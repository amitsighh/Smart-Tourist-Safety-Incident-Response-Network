import crypto from 'crypto';
import { config } from '../config/index.js';
import { db } from '../models/db.js';

export class SmsAdapter {
  async sendSms({ to, message, idempotencyKey }) {
    throw new Error('Method not implemented.');
  }
}

export class MockSmsAdapter extends SmsAdapter {
  async sendSms({ to, message, idempotencyKey }) {
    const providerMessageId = 'SM_MOCK_' + crypto.randomBytes(8).toString('hex');
    return {
      success: true,
      providerMessageId,
      status: 'DELIVERED',
      cost: '0.00',
      timestamp: new Date().toISOString()
    };
  }
}

export class TwilioSmsAdapter extends SmsAdapter {
  async sendSms({ to, message, idempotencyKey }) {
    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioFromNumber) {
      const fallback = new MockSmsAdapter();
      return fallback.sendSms({ to, message, idempotencyKey });
    }

    try {
      const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
      const params = new URLSearchParams({
        To: to,
        From: config.twilioFromNumber,
        Body: message
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Twilio HTTP error ${response.status}`);
      }

      return {
        success: true,
        providerMessageId: data.sid,
        status: data.status === 'queued' ? 'SENT' : data.status.toUpperCase(),
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('Twilio SMS Delivery error:', err.message);
      return {
        success: false,
        error: err.message,
        status: 'FAILED',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export class Msg91SmsAdapter extends SmsAdapter {
  async sendSms({ to, message, idempotencyKey }) {
    const fallback = new MockSmsAdapter();
    return fallback.sendSms({ to, message, idempotencyKey });
  }
}

export class Fast2SmsAdapter extends SmsAdapter {
  async sendSms({ to, message, idempotencyKey }) {
    const fallback = new MockSmsAdapter();
    return fallback.sendSms({ to, message, idempotencyKey });
  }
}

export class NotificationService {
  constructor() {
    this.adapters = {
      mock: new MockSmsAdapter(),
      twilio: new TwilioSmsAdapter(),
      msg91: new Msg91SmsAdapter(),
      fast2sms: new Fast2SmsAdapter()
    };
  }

  getAdapter() {
    const providerKey = (config.smsProvider || 'mock').toLowerCase();
    return this.adapters[providerKey] || this.adapters.mock;
  }

  generateTrackingLink(incidentId, token) {
    const base = config.appDomain.replace(/\/+$/, '');
    const shortToken = token || crypto.randomBytes(3).toString('hex');
    return `${base}/s/${shortToken}?inc=${incidentId}`;
  }

  formatTimestampParts(dateObj) {
    const d = dateObj || new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const time = `${hours}:${mins}`;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = `${day}-${months[d.getMonth()]}`;
    return { time, date };
  }

  buildMessage({ role, data }) {
    const { time, date } = this.formatTimestampParts(data.timestamp ? new Date(data.timestamp) : new Date());
    const trackingLink = data.trackingLink || this.generateTrackingLink(data.incidentId || 'INC-1001');

    switch (role) {
      case 'police':
      case 'police_unit':
        return `[TOURIST SOS] HIGH\nID: ${data.touristId}\nName: ${data.touristName} | Ph: ${data.phone || '+91 98XXXXXX10'}\nLoc: ${Number(data.latitude).toFixed(4)},${Number(data.longitude).toFixed(4)} (${data.locationName || 'Shillong'}, +/-12m) ${time} ${date}\nMap: ${trackingLink}\nVia: ${data.via || 'Internet'} | Reply 1 to acknowledge`;

      case 'emergency_contact':
        return `ALERT: ${data.touristName} pressed the emergency button at ${time} on ${date}.\nLast location: ${trackingLink}\nPolice have been notified. Please try calling him/her.`;

      case 'tourism_official':
        return `[TOURISM ALERT] SOS from tourist ${data.touristId} near ${data.locationName || 'Sector Zone'}, ${time}. Police notified. Case #${data.incidentId || 'INC-1001'}. Details: ${trackingLink}`;

      case 'medical':
        return `[MEDICAL EMERGENCY SOS] PRIORITY\nTourist: ${data.touristName} (${data.touristId})\nMedical Need: ${data.medicalDetails || 'Health emergency triggered'}\nLoc: ${Number(data.latitude).toFixed(4)},${Number(data.longitude).toFixed(4)}\nAmbulance Dispatch: ${trackingLink}`;

      case 'disaster_response':
        return `[DISASTER / SDRF ALERT] High-Altitude / Forest Sector Incident\nID: ${data.touristId} (${data.locationName})\nCoordinates: ${Number(data.latitude).toFixed(4)},${Number(data.longitude).toFixed(4)}\nRescue Link: ${trackingLink}`;

      case 'tourist':
        return `Your SOS was received at ${time}. Police unit ${data.assignedUnitName || 'PU-07'} has been alerted. Stay where you are if safe. Help is on the way.`;

      case 'silent_anomaly':
        return `[SILENT TOURIST] MEDIUM\nID: ${data.touristId}, no signal since ${data.sinceTime || '08:15'}, missed ${data.missedCount || 2} check-ins.\nLast loc: ${Number(data.latitude).toFixed(4)},${Number(data.longitude).toFixed(4)} (${data.locationName || 'trek route'}). Reason: ${data.reasons || 'inactivity + route deviation'}.\nReview: ${trackingLink}`;

      case 'efir':
        return `[EFIR CREATED] Legal Missing Person Case #${data.firNumber} generated for ${data.touristId} (${data.touristName}). Certified copy: ${trackingLink}`;

      default:
        return `[SURAKSHA ALERT] Alert event: ${data.incidentId || data.touristId} at ${time}. Link: ${trackingLink}`;
    }
  }

  async sendToRecipient({
    incidentId,
    intendedRole,
    intendedRecipient,
    channel = 'SMS',
    messageData,
    idempotencyKey
  }) {
    if (idempotencyKey) {
      const existing = (db.data.notificationLogs || []).find(l => l.idempotencyKey === idempotencyKey);
      if (existing) {
        return { success: true, duplicate: true, log: existing };
      }
    }

    let actualRecipient = intendedRecipient;
    let textToSend = this.buildMessage({ role: intendedRole, data: messageData });

    if (config.demoMode) {
      actualRecipient = config.demoPhoneNumber;
      const rolePrefix = `[DEMO -> ${intendedRole.toUpperCase().replace(/_/g, ' ')}]\n`;
      textToSend = rolePrefix + textToSend;
    }

    const logEntry = {
      id: 'NOTIF-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      incidentId: incidentId || messageData.incidentId || null,
      intendedRole,
      intendedRecipient,
      actualRecipient,
      channel,
      messageText: textToSend,
      status: 'QUEUED',
      providerMessageId: null,
      idempotencyKey: idempotencyKey || null,
      attempts: 1,
      timestamp: new Date().toISOString(),
      error: null
    };

    if (!db.data.notificationLogs) db.data.notificationLogs = [];
    db.data.notificationLogs.unshift(logEntry);
    db.save();

    const adapter = this.getAdapter();
    const result = await adapter.sendSms({
      to: actualRecipient,
      message: textToSend,
      idempotencyKey: logEntry.id
    });

    logEntry.providerMessageId = result.providerMessageId || null;
    logEntry.status = result.success ? (result.status || 'SENT') : 'FAILED';
    logEntry.error = result.error || null;
    db.save();

    return {
      success: result.success,
      logId: logEntry.id,
      actualRecipient,
      status: logEntry.status,
      providerMessageId: logEntry.providerMessageId,
      messageText: textToSend
    };
  }

  async dispatchEvent(event, payload) {
    const results = [];
    const trackingLink = payload.trackingLink || this.generateTrackingLink(payload.incidentId || 'INC-GEN');
    const enrichedData = { ...payload, trackingLink };

    const tourist = payload.touristId ? db.data.touristIds.find(t => t.touristId === payload.touristId) : null;
    const emergencyContactPhone = (tourist && tourist.emergencyContact && tourist.emergencyContact.phone)
      ? tourist.emergencyContact.phone
      : '+919876543210';
    const touristPhone = (tourist && tourist.phone) ? tourist.phone : '+919988776655';

    if (event === 'SOS_PANIC' || event === 'SOS_TRIGGERED') {
      const isMedical = (payload.emergencyNote && /medical|doctor|heart|faint|fall|hospital/i.test(payload.emergencyNote)) ||
                        payload.triggerType === 'FALL_DETECTED';
      const isForest = (payload.locationName && /pass|forest|valley|trek|cave|mountain|peak|sanctuary/i.test(payload.locationName));

      // 1. Police Control Room
      results.push(await this.sendToRecipient({
        incidentId: payload.incidentId,
        intendedRole: 'police',
        intendedRecipient: '+911122334455',
        messageData: enrichedData,
        idempotencyKey: `IDEMP:SOS_POLICE:${payload.incidentId}`
      }));

      // 2. Nearest Patrol Unit
      if (payload.assignedUnitId || payload.assignedUnitName) {
        results.push(await this.sendToRecipient({
          incidentId: payload.incidentId,
          intendedRole: 'police_unit',
          intendedRecipient: '+911122334466',
          messageData: enrichedData,
          idempotencyKey: `IDEMP:SOS_UNIT:${payload.incidentId}`
        }));
      }

      // 3. Emergency Contact
      results.push(await this.sendToRecipient({
        incidentId: payload.incidentId,
        intendedRole: 'emergency_contact',
        intendedRecipient: emergencyContactPhone,
        messageData: enrichedData,
        idempotencyKey: `IDEMP:SOS_EMERGENCY_CONTACT:${payload.incidentId}`
      }));

      // 4. Tourism Official
      results.push(await this.sendToRecipient({
        incidentId: payload.incidentId,
        intendedRole: 'tourism_official',
        intendedRecipient: '+913612233445',
        messageData: enrichedData,
        idempotencyKey: `IDEMP:SOS_TOURISM:${payload.incidentId}`
      }));

      // 5. Tourist Confirmation
      results.push(await this.sendToRecipient({
        incidentId: payload.incidentId,
        intendedRole: 'tourist',
        intendedRecipient: touristPhone,
        messageData: enrichedData,
        idempotencyKey: `IDEMP:SOS_TOURIST_CONFIRM:${payload.incidentId}`
      }));

      // 6. Medical Desk if applicable
      if (isMedical) {
        results.push(await this.sendToRecipient({
          incidentId: payload.incidentId,
          intendedRole: 'medical',
          intendedRecipient: '+911081081081',
          messageData: { ...enrichedData, medicalDetails: payload.emergencyNote || 'Emergency Medical Response Required' },
          idempotencyKey: `IDEMP:SOS_MEDICAL:${payload.incidentId}`
        }));
      }

      // 7. Disaster Response (Forest/SDRF) if applicable
      if (isForest) {
        results.push(await this.sendToRecipient({
          incidentId: payload.incidentId,
          intendedRole: 'disaster_response',
          intendedRecipient: '+911077107710',
          messageData: enrichedData,
          idempotencyKey: `IDEMP:SOS_SDRF:${payload.incidentId}`
        }));
      }
    } else if (event === 'ANOMALY_SILENT') {
      results.push(await this.sendToRecipient({
        incidentId: payload.incidentId,
        intendedRole: 'silent_anomaly',
        intendedRecipient: '+911122334455',
        messageData: enrichedData,
        idempotencyKey: `IDEMP:ANOMALY_POLICE:${payload.touristId}:${payload.timestamp}`
      }));
      results.push(await this.sendToRecipient({
        incidentId: payload.incidentId,
        intendedRole: 'emergency_contact',
        intendedRecipient: emergencyContactPhone,
        messageData: enrichedData,
        idempotencyKey: `IDEMP:ANOMALY_CONTACT:${payload.touristId}:${payload.timestamp}`
      }));
      results.push(await this.sendToRecipient({
        incidentId: payload.incidentId,
        intendedRole: 'tourism_official',
        intendedRecipient: '+913612233445',
        messageData: enrichedData,
        idempotencyKey: `IDEMP:ANOMALY_TOURISM:${payload.touristId}:${payload.timestamp}`
      }));
    } else if (event === 'EFIR_CREATED') {
      results.push(await this.sendToRecipient({
        incidentId: payload.incidentId,
        intendedRole: 'efir',
        intendedRecipient: '+911122334455',
        messageData: enrichedData,
        idempotencyKey: `IDEMP:EFIR_POLICE:${payload.firNumber}`
      }));
      results.push(await this.sendToRecipient({
        incidentId: payload.incidentId,
        intendedRole: 'tourism_official',
        intendedRecipient: '+913612233445',
        messageData: enrichedData,
        idempotencyKey: `IDEMP:EFIR_TOURISM:${payload.firNumber}`
      }));
    }

    return results;
  }
}

export const notificationService = new NotificationService();
