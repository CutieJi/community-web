# Gather community

A simple, responsive community website built with Next.js, with Discord invite links and a password-protected admin area.

## Get started

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env.local` and fill in the values below.
3. Install dependencies and start the dev server:

   ```sh
   npm install
   npm run dev
   ```

The community site is at `http://localhost:3000`; the admin sign-in is at `http://localhost:3000/admin/login`.

## Environment

- `NEXT_PUBLIC_DISCORD_INVITE_URL`: your Discord server invite URL.
- `ADMIN_PASSWORD`: a long, unique admin password. Keep it private.
- `ADMIN_SESSION_SECRET`: a separate, long random secret used to sign seven-day, HTTP-only admin sessions.
- `FIREBASE_PROJECT_ID`: your Firebase project ID.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: the complete service account JSON downloaded from Firebase Console, pasted as one line. The example is intentionally blank; placeholder keys are not valid credentials. This is server-only; never add service-account credentials to client code or commit them.

To run locally, use `npm run dev`. For production, configure the same environment variables in your hosting provider, then run `npm run build` and `npm start`.

## Admin and Firestore

The admin area uses the shared `ADMIN_PASSWORD` and an HMAC-signed, HTTP-only cookie; Firebase is used only for database storage. The admin editor stores its welcome note and announcement in the Firestore document `site/community`. Firebase Admin SDK credentials are read only by server code. If Firestore is not configured, the admin UI explains that saving is unavailable; it does not pretend changes were saved.

Grant the service account the **Cloud Datastore User** role (`roles/datastore.user`) in Google Cloud IAM so the Firebase Admin SDK can read and write Firestore. This server-side access is controlled by IAM, not Firestore security rules; do not make the database rules public. Protect the admin password and session secret, use HTTPS in production, and rotate credentials if they are exposed. This initial admin setup is intended for a small, single-owner community.
