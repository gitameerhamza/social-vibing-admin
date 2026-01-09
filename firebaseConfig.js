// firebaseConfig.js
// Initializes Firebase using config from `expo-constants` (populated from .env via app.config.js)
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig && Constants.expoConfig.extra) || (Constants.manifest && Constants.manifest.extra) || {};

const firebaseConfig = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID,
  measurementId: extra.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase Analytics is web-only. Initialize it only on web to avoid runtime errors on native.
let analytics = null;
if (Platform.OS === 'web') {
  import('firebase/analytics')
    .then(({ getAnalytics }) => {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        // ignore analytics errors on web
      }
    })
    .catch(() => {});
}

export { app as firebaseApp, auth, db, analytics, firebaseConfig };
