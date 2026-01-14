import admin from "firebase-admin";

export function initFirebaseAdmin() {
  if (admin.apps.length) return admin;

  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_JSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  return admin;
}