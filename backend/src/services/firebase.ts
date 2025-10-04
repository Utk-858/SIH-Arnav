// Firebase Admin SDK for backend operations

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Check if individual Firebase credentials are provided
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      // Use individual environment variables
      const serviceAccount = {
        type: process.env.FIREBASE_TYPE || 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
      } as admin.ServiceAccount;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin initialized with individual credentials');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase with individual credentials:', error);
      throw error;
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      // Fallback: Parse the service account JSON (legacy support)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin initialized with service account JSON');
    } catch (error) {
      console.error('❌ Failed to parse Firebase service account JSON:', error);
      throw error;
    }
  } else {
    // Use default credentials (for development with Firebase CLI)
    console.log('⚠️ No Firebase credentials found, using default credentials');
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
}

export const db = getFirestore();
export const auth = admin.auth();
export default admin;