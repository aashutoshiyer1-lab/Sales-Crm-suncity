import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  remove,
  get
} from 'firebase/database';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';

// ─── Firebase Config ─────────────────────────────────────────────
const DATABASE_URL = import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://sales-crm-suncity-default-rtdb.firebaseio.com";
export const DB_COLLECTION = import.meta.env.VITE_FIREBASE_COLLECTION || 'bookings';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAGelwyYLzsPyQhxtyjYXjhnGPgAGyRoaw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sales-crm-suncity.firebaseapp.com",
  databaseURL: DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sales-crm-suncity",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sales-crm-suncity.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "771316692538",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:771316692538:web:ca4cf3c2fbda4512e86703",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RSV5ZM5Z3H"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const rtdb = getDatabase(app);
const auth = getAuth(app);

// ─── Automatic Silent Anonymous Authentication ───────────────────
let authReadyPromise = null;
export function ensureAuth() {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          resolve(user);
        } else {
          try {
            const credential = await signInAnonymously(auth);
            resolve(credential.user);
          } catch (err) {
            console.warn('[Firebase Auth] Anonymous sign-in notice (enable Anonymous in Firebase Console):', err.message);
            resolve(null);
          }
        }
      });
    });
  }
  return authReadyPromise;
}

// Auto-trigger auth check on load
ensureAuth();

async function getAuthToken() {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (e) {}
  return null;
}

// ─── REST API helpers (bulletproof fallback) ─────────────────────
async function restPut(path, data) {
  const token = await getAuthToken();
  const url = token ? `${DATABASE_URL}/${path}.json?auth=${token}` : `${DATABASE_URL}/${path}.json`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`REST PUT failed: ${res.status}`);
  return res.json();
}

async function restDelete(path) {
  const token = await getAuthToken();
  const url = token ? `${DATABASE_URL}/${path}.json?auth=${token}` : `${DATABASE_URL}/${path}.json`;
  const res = await fetch(url, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`REST DELETE failed: ${res.status}`);
}

async function restGet(path) {
  const token = await getAuthToken();
  const url = token ? `${DATABASE_URL}/${path}.json?auth=${token}` : `${DATABASE_URL}/${path}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`REST GET failed: ${res.status}`);
  return res.json();
}

// ─── Helper: Convert data object to sorted array ─────────────────
function dataToArray(data) {
  if (!data || typeof data !== 'object' || data.error) return [];
  return Object.keys(data)
    .filter(key => key !== 'error' && data[key] && typeof data[key] === 'object')
    .map(key => ({ id: key, ...data[key] }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

// ─── Deduplication (kept for backward compat) ────────────────────
export function deduplicateBookings(list) {
  const map = new Map();
  (list || []).forEach(item => {
    if (!item || !item.id) return;
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values())
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

// ─── Subscribe: Real-time listener + REST polling fallback ───────
export const subscribeBookings = (callback) => {
  let lastData = [];

  const emitData = (bookings) => {
    lastData = bookings;
    callback(bookings);
  };

  // 1. Try Firebase SDK real-time listener
  let sdkListenerActive = false;
  try {
    const bookingsRef = ref(rtdb, DB_COLLECTION);
    onValue(bookingsRef, (snapshot) => {
      sdkListenerActive = true;
      const bookings = snapshot.exists() ? dataToArray(snapshot.val()) : [];
      console.log(`[Firebase SDK] Real-time: ${bookings.length} bookings`);
      emitData(bookings);
    }, (error) => {
      console.warn('[Firebase SDK] Listener error, REST polling active:', error.message);
      sdkListenerActive = false;
    });
  } catch (e) {
    console.warn('[Firebase SDK] Setup failed, using REST only:', e.message);
  }

  // 2. REST polling fallback (runs every 3s, ensures data even if SDK fails)
  const poll = async () => {
    try {
      const data = await restGet(DB_COLLECTION);
      const bookings = dataToArray(data);
      // Only emit if SDK listener is NOT active (avoid double updates)
      if (!sdkListenerActive) {
        console.log(`[Firebase REST] Polled: ${bookings.length} bookings`);
        emitData(bookings);
      }
    } catch (e) {
      console.warn('[Firebase REST] Poll failed:', e.message);
    }
  };

  // Initial REST fetch (immediate data while SDK connects)
  poll();
  const pollInterval = setInterval(poll, 3000);

  return () => {
    clearInterval(pollInterval);
  };
};

// ─── Save Booking ────────────────────────────────────────────────
export const saveBooking = async (bookingData) => {
  const bookingId = bookingData.id || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const payload = {
    id: bookingId,
    ...bookingData,
    createdAt: bookingData.createdAt || new Date().toISOString(),
  };

  // Try SDK first, fall back to REST
  try {
    await set(ref(rtdb, `${DB_COLLECTION}/${bookingId}`), payload);
    console.log(`[Firebase SDK] Saved ${bookingId}`);
  } catch (sdkErr) {
    console.warn(`[Firebase SDK] Save failed, trying REST:`, sdkErr.message);
    await restPut(`${DB_COLLECTION}/${bookingId}`, payload);
    console.log(`[Firebase REST] Saved ${bookingId}`);
  }

  return payload;
};

// ─── Update Booking ──────────────────────────────────────────────
export const updateBooking = async (bookingId, bookingData) => {
  // Read existing data first
  let existing = {};
  try {
    const snapshot = await get(ref(rtdb, `${DB_COLLECTION}/${bookingId}`));
    existing = snapshot.exists() ? snapshot.val() : {};
  } catch (e) {
    try {
      existing = (await restGet(`${DB_COLLECTION}/${bookingId}`)) || {};
    } catch (e2) {}
  }

  const updated = {
    ...existing,
    ...bookingData,
    id: bookingId,
    updatedAt: new Date().toISOString(),
  };

  // Try SDK first, fall back to REST
  try {
    await set(ref(rtdb, `${DB_COLLECTION}/${bookingId}`), updated);
    console.log(`[Firebase SDK] Updated ${bookingId}`);
  } catch (sdkErr) {
    console.warn(`[Firebase SDK] Update failed, trying REST:`, sdkErr.message);
    await restPut(`${DB_COLLECTION}/${bookingId}`, updated);
    console.log(`[Firebase REST] Updated ${bookingId}`);
  }
};

// ─── Delete Booking ──────────────────────────────────────────────
export const deleteBooking = async (bookingId) => {
  // Try SDK first, fall back to REST
  try {
    await remove(ref(rtdb, `${DB_COLLECTION}/${bookingId}`));
    console.log(`[Firebase SDK] Deleted ${bookingId}`);
  } catch (sdkErr) {
    console.warn(`[Firebase SDK] Delete failed, trying REST:`, sdkErr.message);
    await restDelete(`${DB_COLLECTION}/${bookingId}`);
    console.log(`[Firebase REST] Deleted ${bookingId}`);
  }
};

// ─── Reset All Bookings ──────────────────────────────────────────
export const resetAllBookings = async () => {
  try {
    await remove(ref(rtdb, DB_COLLECTION));
    await remove(ref(rtdb, `${DB_COLLECTION}_deleted_ids`));
    console.log('[Firebase SDK] All bookings reset');
  } catch (sdkErr) {
    console.warn('[Firebase SDK] Reset failed, trying REST:', sdkErr.message);
    await restDelete(DB_COLLECTION);
    await restDelete(`${DB_COLLECTION}_deleted_ids`);
    console.log('[Firebase REST] All bookings reset');
  }
};

export { rtdb, auth };

// ─── Manual Discount Entries Management ────────────────────────
export const MANUAL_DISCOUNTS_COLLECTION = "manual_discounts";

export const subscribeManualDiscounts = (callback) => {
  let cached = [];
  try {
    const raw = localStorage.getItem("crm_cached_manual_discounts");
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}
  if (cached.length > 0) callback(cached);

  try {
    const discountsRef = ref(rtdb, MANUAL_DISCOUNTS_COLLECTION);
    onValue(discountsRef, (snapshot) => {
      const list = snapshot.exists() ? dataToArray(snapshot.val()) : [];
      try {
        localStorage.setItem("crm_cached_manual_discounts", JSON.stringify(list));
      } catch (e) {}
      callback(list);
    }, (error) => {
      console.warn("[Firebase] manual_discounts listener error:", error.message);
    });
  } catch (e) {
    console.warn("[Firebase] manual_discounts setup error:", e.message);
  }

  const poll = async () => {
    try {
      const data = await restGet(MANUAL_DISCOUNTS_COLLECTION);
      const list = dataToArray(data);
      try {
        localStorage.setItem("crm_cached_manual_discounts", JSON.stringify(list));
      } catch (e) {}
      callback(list);
    } catch (e) {}
  };
  poll();
  const interval = setInterval(poll, 4000);

  return () => clearInterval(interval);
};

export const saveManualDiscount = async (entry) => {
  const entryId = entry.id || `discount-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const payload = {
    ...entry,
    id: entryId,
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const current = JSON.parse(localStorage.getItem("crm_cached_manual_discounts") || "[]");
    const index = current.findIndex(e => e.id === entryId);
    let updated;
    if (index >= 0) {
      updated = [...current];
      updated[index] = payload;
    } else {
      updated = [payload, ...current];
    }
    localStorage.setItem("crm_cached_manual_discounts", JSON.stringify(updated));
  } catch (e) {}

  try {
    await set(ref(rtdb, `${MANUAL_DISCOUNTS_COLLECTION}/${entryId}`), payload);
  } catch (e) {
    try {
      await restPut(`${MANUAL_DISCOUNTS_COLLECTION}/${entryId}`, payload);
    } catch (e2) {}
  }
  return payload;
};

export const deleteManualDiscount = async (entryId) => {
  try {
    const current = JSON.parse(localStorage.getItem("crm_cached_manual_discounts") || "[]");
    const updated = current.filter(e => e.id !== entryId);
    localStorage.setItem("crm_cached_manual_discounts", JSON.stringify(updated));
  } catch (e) {}

  try {
    await remove(ref(rtdb, `${MANUAL_DISCOUNTS_COLLECTION}/${entryId}`));
  } catch (e) {
    try {
      await restDelete(`${MANUAL_DISCOUNTS_COLLECTION}/${entryId}`);
    } catch (e2) {}
  }
};
