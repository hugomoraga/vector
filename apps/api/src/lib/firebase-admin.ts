import admin from 'firebase-admin';
import { ENV } from '@vector/config';

if (!admin.apps.length) {
  const hasServiceAccountKey =
    ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY;

  if (hasServiceAccountKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const getAuth = admin.auth;