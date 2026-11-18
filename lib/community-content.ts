import "server-only";
import { createPrivateKey } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export type CommunityContent = {
  welcome: string;
  announcement: string;
};

export class FirebaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirebaseConfigurationError";
  }
}

export const FIRESTORE_PERMISSION_ERROR_MESSAGE =
  "Firestore denied access. Grant the service account the Cloud Datastore User (roles/datastore.user) role in Google Cloud IAM.";

export function isFirestorePermissionDenied(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return error.code === 7 || error.code === "permission-denied" || error.code === "PERMISSION_DENIED";
}

export const DEFAULT_COMMUNITY_CONTENT: CommunityContent = {
  welcome: "A cozy corner of the internet for curious minds, kind humans, and whatever you’re into this week.",
  announcement: "",
};

function firestore() {
  const existing = getApps()[0];
  if (existing) return getFirestore(existing);

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!projectId || !serviceAccountJson) {
    throw new FirebaseConfigurationError("FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_JSON are required.");
  }

  let serviceAccount: { client_email?: string; private_key?: string; project_id?: string };
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new FirebaseConfigurationError("FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON.");
  }
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new FirebaseConfigurationError("Firebase service account JSON must include client_email and private_key.");
  }

  const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
  try {
    createPrivateKey(privateKey);
  } catch {
    throw new FirebaseConfigurationError(
      "The Firebase private key is invalid or still a placeholder. Download a service-account JSON file from Firebase Console and use its private_key value."
    );
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail: serviceAccount.client_email,
      privateKey,
    }),
    projectId,
  });
  return getFirestore(app);
}

export async function getCommunityContent(): Promise<CommunityContent> {
  const snapshot = await firestore().doc("site/community").get();
  if (!snapshot.exists) return DEFAULT_COMMUNITY_CONTENT;
  const data = snapshot.data() ?? {};
  return {
    welcome: typeof data.welcome === "string" ? data.welcome : DEFAULT_COMMUNITY_CONTENT.welcome,
    announcement: typeof data.announcement === "string" ? data.announcement : DEFAULT_COMMUNITY_CONTENT.announcement,
  };
}

export async function saveCommunityContent(content: CommunityContent) {
  await firestore().doc("site/community").set({ ...content, updatedAt: new Date() }, { merge: true });
}
