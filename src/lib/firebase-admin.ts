
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

let adminApp: admin.app.App;

if (admin.apps.length) {
  adminApp = admin.app();
} else {
  if (serviceAccount) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } else {
    // This is a placeholder for environments where the service account is not available.
    // Server-side actions requiring admin privileges will not work.
    console.warn("Firebase Admin SDK not initialized. Service account key is missing.");
    // We create a dummy object so the app doesn't crash on import,
    // but any calls to it will fail.
    adminApp = {} as admin.app.App; 
  }
}

export { adminApp };
