import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Prevent duplicate Firebase app initialization (e.g. in React StrictMode)
export const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const messaging = typeof window !== 'undefined' ? (() => {
  try {
    return getMessaging(firebaseApp);
  } catch (err) {
    console.warn('[FCM] Messaging could not be initialized:', err);
    return null;
  }
})() : null;

/**
 * Programmatically deletes IndexedDB databases associated with Firebase Messaging
 * and Installations to recover from version mismatch errors.
 */
function deleteFirebaseDatabases(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const db1 = indexedDB.deleteDatabase('firebase-messaging-database');
      const db2 = indexedDB.deleteDatabase('firebase-installations-database');
      let count = 0;
      const done = () => {
        count++;
        if (count === 2) resolve();
      };
      db1.onsuccess = done;
      db1.onerror = done;
      db1.onblocked = done;
      db2.onsuccess = done;
      db2.onerror = done;
      db2.onblocked = done;
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Requests browser notification permission independently of Firebase.
 * Call this even when FCM is not configured ΓÇö it's needed for native
 * browser popup notifications (new Notification(...)) to work at all.
 * Returns true if permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[Notification] Not supported in this browser.');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    console.warn('[Notification] Permission was previously denied by the user.');
    return false;
  }
  const result = await Notification.requestPermission();
  console.log('[Notification] Permission result:', result);
  return result === 'granted';
}

/**
 * Requests notification permission, registers the service worker,
 * and returns the FCM registration token (or null on failure).
 */
export async function initWebPush(): Promise<string | null> {
  if (!messaging) {
    console.warn('[FCM] Messaging is not available (Firebase not configured).');
    return null;
  }
  if (!('Notification' in window)) {
    console.warn('[FCM] Notifications not supported in this browser.');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[FCM] Service workers not supported in this browser.');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('[FCM] Notification permission denied.');
    return null;
  }

  try {
    const apiKey = encodeURIComponent(import.meta.env.VITE_FIREBASE_API_KEY || '');
    const authDomain = encodeURIComponent(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '');
    const projectId = encodeURIComponent(import.meta.env.VITE_FIREBASE_PROJECT_ID || '');
    const messagingSenderId = encodeURIComponent(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '');
    const appId = encodeURIComponent(import.meta.env.VITE_FIREBASE_APP_ID || '');
    
    const swUrl = `/firebase-messaging-sw.js?apiKey=${apiKey}&authDomain=${authDomain}&projectId=${projectId}&messagingSenderId=${messagingSenderId}&appId=${appId}`;

    const swRegistration = await navigator.serviceWorker.register(
      swUrl,
      { scope: '/' }
    );

    let token: string | null = null;
    try {
      token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });
    } catch (err: any) {
      if (err && (err.name === 'VersionError' || err.message?.includes('VersionError'))) {
        console.warn('[FCM] IndexedDB version mismatch detected. Clearing databases and retrying...');
        await deleteFirebaseDatabases();
        token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        });
      } else {
        throw err;
      }
    }

    if (token) {
      // Log token so it can be copied for Firebase Console test sends
      console.info(
        '%c[FCM] Registration token (use in Firebase Console to send test push):',
        'color: #1e3a8a; font-weight: bold;'
      );
      console.info(token);
    }

    return token;
  } catch (err) {
    console.error('[FCM] Failed to get registration token:', err);
    return null;
  }
}

/**
 * Registers a callback for foreground messages (app tab is open).
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): () => void {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
