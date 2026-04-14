import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig, useFirebaseEmulators, firebaseEmulatorConfig } from '../config';
 
 const ADMIN_APP_NAME = 'niiifty-admin';
 
 if (useFirebaseEmulators) {
   process.env.FIRESTORE_EMULATOR_HOST = `${firebaseEmulatorConfig.firestore.host}:${firebaseEmulatorConfig.firestore.port}`;
   process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${firebaseEmulatorConfig.storage.host}:${firebaseEmulatorConfig.storage.port}`;
   console.log(`[Firebase Admin] EARLY INJECTION: Firestore (${process.env.FIRESTORE_EMULATOR_HOST}), Storage (${process.env.FIREBASE_STORAGE_EMULATOR_HOST})`);
 }
 
 function getAdminApp(): App {
   const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
   if (existingApp) return existingApp;
 
   return initializeApp({
     projectId: firebaseConfig.projectId,
   }, ADMIN_APP_NAME);
 }
 
 export const adminDb: Firestore = getFirestore(getAdminApp());
