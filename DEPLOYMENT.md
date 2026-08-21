# Deploy Cursis on Vercel

The website and Firestore-backed API are deployed together as one Next.js Vercel
project. The browser uses internal routes under `/api/backend/*`.

## 1. Push this repository to GitHub

Do not commit `.env` or `.env.local` files.

## 2. Deploy the website and API together

1. In Vercel, select **Add New > Project** and import this repository.
2. Set **Root Directory** to `Frontend`.
3. In Firebase Console, open **Project settings > Service accounts**, generate a
   new private key, and add these values in Vercel for Production, Preview, and
   Development:

   ```text
   FIREBASE_PROJECT_ID=<your-firebase-project-id>
   FIREBASE_CLIENT_EMAIL=<service-account-client-email>
   FIREBASE_PRIVATE_KEY=<service-account-private-key>
   JWT_SECRET=<a-long-random-secret>
   ```

   Paste the private key exactly as downloaded, including its newline characters.
4. Add the existing Firebase variables from your local frontend `.env.local` if
   Firebase sign-in and cloud data are required:

   ```text
   AUTH_SESSION_SECRET=<a-long-random-secret>
   NEXT_PUBLIC_FIREBASE_API_KEY=<value>
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<value>
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<value>
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<value>
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<value>
   NEXT_PUBLIC_FIREBASE_APP_ID=<value>
   ```

5. Deploy. The app includes its own Vercel configuration, which installs the
   required Next.js dependencies before the production build.

## 3. Verify Firestore is connected

Open this on the deployed Vercel site:

```text
https://<your-vercel-domain>/api/backend/health
```

It should return a healthy JSON response from the Firebase-backed API.

## Firestore data note

All backend API data is now read from and written to Firebase Firestore. There
is no external database, Prisma migration, or SQLite file required for the
Vercel deployment.
