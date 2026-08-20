# Deploy Cursis: Render backend + Vercel frontend

The frontend uses the internal route `/api/backend/*`. On Vercel, that route is
rewritten server-side to the Render backend, so the browser does not need a CORS
exception or a public API URL.

## 1. Push this repository to GitHub

Both providers deploy from the same repository. Do not commit `.env` or
`.env.local` files.

## 2. Deploy the backend to Render

1. In Render, select **New > Blueprint** and choose this repository.
2. Render detects `render.yaml`. Keep the generated `JWT_SECRET` and deploy.
3. When deployment finishes, copy the service URL, for example
   `https://cursis-backend.onrender.com`.
4. Check `https://<your-render-service>/api/health`. It should return a healthy
   JSON response.

The blueprint runs `prisma db push` at service start so a first deployment has
the tables it needs. Its bundled SQLite database is ephemeral on Render. This is
fine for testing, but use a managed database before relying on backend records
in production.

## 3. Deploy the frontend to Vercel

1. In Vercel, import the same Git repository.
2. Set **Root Directory** to `Frontend`.
3. Add this environment variable for **Production**, **Preview**, and
   **Development**:

   ```text
   BACKEND_URL=https://<your-render-service>.onrender.com
   ```

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

5. Deploy. The existing `Frontend/vercel.json` uses the correct workspace build
   configuration for this repository.

## 4. Verify they are connected

Open this on the deployed Vercel site:

```text
https://<your-vercel-domain>/api/backend/health
```

It should return the JSON from Render. If it does not, confirm `BACKEND_URL`
contains the full Render HTTPS URL, with no trailing slash, then redeploy Vercel.

## Production database note

Render's filesystem is not durable for the `file:./dev.db` SQLite database.
The frontend already prioritizes Firestore for many data operations, but the
backend API and health endpoint also use Prisma. Before production use, connect
Prisma's LibSQL adapter to a managed LibSQL/Turso database or migrate the Prisma
schema to a managed PostgreSQL database.
