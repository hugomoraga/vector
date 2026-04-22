import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error('Service account file not found at: ' + serviceAccountPath);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
export const getAuth = admin.auth;