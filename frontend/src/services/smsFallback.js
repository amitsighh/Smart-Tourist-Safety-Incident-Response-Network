async function sha256Hex(text) {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const smsFallback = {
  getNextCounter(touristId) {
    const key = `SURAKSHA_SMS_CTR_${touristId || 'DEFAULT'}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    const next = current + 1;
    localStorage.setItem(key, String(next));
    return next;
  },

  async createSignedCompactMessage({ touristId, latitude, longitude }) {
    const tid = touristId || 'TID-DEMO-01';
    const lat = Number(latitude || 25.5788).toFixed(4);
    const lng = Number(longitude || 91.8933).toFixed(4);
    const ts = Math.floor(Date.now() / 1000);
    const counter = this.getNextCounter(tid);

    const secretKey = 'suraksha-secure-hmac-shared-key-2026';
    const rawPayload = `${tid}:${lat},${lng}:${ts}:c${counter}:${secretKey}`;
    const hash = await sha256Hex(rawPayload);
    const compactSig = hash.substring(0, 16);

    return `SURAKSHA:SOS:${tid}:${lat},${lng}:${ts}:c${counter}:${compactSig}`;
  },

  buildSmsUri({ targetNumber = '+917307007253', bodyText }) {
    const encodedBody = encodeURIComponent(bodyText);
    const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
    const separator = isApple ? '&' : '?';
    return `sms:${targetNumber}${separator}body=${encodedBody}`;
  }
};
