import { FirebaseApp, initializeApp } from 'firebase/app';
import { EmailAuthProvider, connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  getFirestore,
  Timestamp,
  where,
  query,
  limit,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { Functions, connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseConfig, firebaseEmulatorConfig, isProduction, useFirebaseEmulators } from '../config';
import {
  getAnalytics,
  isSupported,
  logEvent as firebaseLogEvent,
  setCurrentScreen as firebaseSetCurrentScreen,
  type Analytics,
} from 'firebase/analytics';

const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
const functions: Functions = getFunctions(firebaseApp, 'europe-west3');

// Auth exports
export const auth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();
export const emailAuthProvider = new EmailAuthProvider();

// Firestore exports
export const db = getFirestore(firebaseApp);

// Storage exports
export const storage = getStorage(firebaseApp);

// Connect to emulators IMMEDIATELY after initialization if needed
if (useFirebaseEmulators) {
  if (typeof window !== 'undefined') {
    connectAuthEmulator(auth, `http://${firebaseEmulatorConfig.auth.host}:${firebaseEmulatorConfig.auth.port}`, {
      disableWarnings: true,
    });
  }

  connectFirestoreEmulator(db, firebaseEmulatorConfig.firestore.host, firebaseEmulatorConfig.firestore.port);
  connectFunctionsEmulator(functions, firebaseEmulatorConfig.functions.host, firebaseEmulatorConfig.functions.port);
  connectStorageEmulator(storage, firebaseEmulatorConfig.storage.host, firebaseEmulatorConfig.storage.port);
}

// Analytics exports
let analytics: Analytics | null = null;

if (typeof window === 'object') {
  void isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp);
    }
  });
}

// Helper functions
export async function getUserWithUsername(username: string) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username), limit(1));

  const userSnapshot = await getDocs(q);

  if (userSnapshot.size > 0) {
    const doc = userSnapshot.docs[0];
    return {
      uid: doc.id,
      ...doc.data(),
    };
  }

  return null;
}

export const getStats = async () => {
  const fn = httpsCallable(functions, 'getStats');
  return fn();
};

export const timestamp = () => {
  return Timestamp.now();
};

export const setCurrentScreen = (screen: string) => {
  if (analytics) {
    firebaseSetCurrentScreen(analytics, screen);
  }
};

export type AnalyticsEvent = 'page_view' | 'create_file' | 'update_settings' | 'open_share_panel';

// https://developers.google.com/gtagjs/reference/event
export const logAnalyticsEvent = (event: AnalyticsEvent, params: Record<string, unknown> = {}) => {
  // console.log(event, params);
  if (isProduction && analytics) {
    firebaseLogEvent(analytics, event as string, params);
  }
};
export async function getFileBySlug(uid: string, slug: string): Promise<any | null> {
  const fileSnap = await getDoc(doc(db, `users/${uid}/files/${slug}`));

  if (!fileSnap.exists()) {
    return null;
  }

  return fileSnap.data();
}
