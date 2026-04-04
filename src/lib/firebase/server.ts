import { initializeApp, getApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '../config';

const ADMIN_APP_NAME = 'niiifty-admin';

function getAdminApp(): App {
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  if (existingApp) return existingApp;

  return initializeApp({
    projectId: firebaseConfig.projectId,
  }, ADMIN_APP_NAME);
}

export const adminDb: Firestore = getFirestore(getAdminApp());
