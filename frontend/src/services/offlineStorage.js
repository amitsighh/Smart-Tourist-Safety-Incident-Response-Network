const DB_NAME = 'SurakshaYatraOfflineDB';
const DB_VERSION = 1;
const STORE_SOS = 'queued_sos';
const STORE_DATA = 'cached_data';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_SOS)) {
        db.createObjectStore(STORE_SOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_DATA)) {
        db.createObjectStore(STORE_DATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export const offlineStorage = {
  isSimulatedOffline() {
    return localStorage.getItem('DEMO_OFFLINE_SIMULATION') === 'true';
  },

  setSimulatedOffline(val) {
    localStorage.setItem('DEMO_OFFLINE_SIMULATION', val ? 'true' : 'false');
    window.dispatchEvent(new Event('offline-mode-changed'));
  },

  isOnline() {
    if (this.isSimulatedOffline()) return false;
    return navigator.onLine;
  },

  async queueSos(payload) {
    const db = await openDatabase();
    const id = 'QSOS-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const item = {
      id,
      payload,
      attempts: 0,
      queuedAt: new Date().toISOString(),
      status: 'QUEUED'
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SOS], 'readwrite');
      const store = tx.objectStore(STORE_SOS);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async getQueuedSosList() {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_SOS], 'readonly');
        const store = tx.objectStore(STORE_SOS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
      });
    } catch {
      return [];
    }
  },

  async removeQueuedSos(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SOS], 'readwrite');
      const store = tx.objectStore(STORE_SOS);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async setCachedData(key, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DATA], 'readwrite');
      const store = tx.objectStore(STORE_DATA);
      const req = store.put({ key, value, cachedAt: new Date().toISOString() });
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async getCachedData(key) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_DATA], 'readonly');
        const store = tx.objectStore(STORE_DATA);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.value : null);
        req.onerror = (e) => reject(e.target.error);
      });
    } catch {
      return null;
    }
  },

  async flushSosQueue(sendCallback) {
    const list = await this.getQueuedSosList();
    if (list.length === 0) return [];

    const flushed = [];
    for (const item of list) {
      try {
        const res = await sendCallback(item.payload);
        if (res && res.success) {
          await this.removeQueuedSos(item.id);
          flushed.push(item);
        }
      } catch (err) {
        console.warn('Queue flush retry failed for item', item.id, err);
      }
    }
    return flushed;
  }
};
