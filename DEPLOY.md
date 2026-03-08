# Deploy MeCook to GitHub + Railway (use the app anywhere)

This guide gets the **MeCook API** on Railway with a PostgreSQL database and the **mobile app** pointing at that API so you can use the app from anywhere (no USB, no local server).

---

## 1. Push the project to GitHub

If the project is not yet in a Git repo:

```bash
cd C:\Users\esdlr\AndroidStudioProjects\MeCook
git init
git add .
git commit -m "Initial MeCook app and API"
```

Create a new repository on GitHub (e.g. `MeCook`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/MeCook.git
git branch -M main
git push -u origin main
```

Use your actual GitHub username and repo name. If the repo already exists, just push your latest changes.

---

## 2. Create a Railway project and PostgreSQL database

1. Go to [railway.app](https://railway.app) and sign in (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo**.
3. Choose your **MeCook** repo.
4. Railway may detect the root; we need to deploy the **API** only:
   - After adding the repo, add a **PostgreSQL** service: **New** → **Database** → **PostgreSQL**.
   - Then we’ll configure the API service to use this DB and set the **root directory** to `me-cook-api`.

---

## 3. Configure and deploy the API on Railway

1. In the same project, click **New** → **GitHub Repo** (or **Add Service** and select the same repo again) so you have a **service** for the API.
2. Select that new service. In **Settings**:
   - **Root Directory**: set to `me-cook-api` (so Railway builds from the API folder).
   - **Build Command**: leave default (Railway will use the Dockerfile).
   - **Start Command**: leave default (Dockerfile `CMD` runs Prisma `db push` then the server).
3. **Variables** (Settings → Variables, or the **Variables** tab):
   - `DATABASE_URL` – from the PostgreSQL service: **PostgreSQL** → **Connect** → **Postgres Connection URL** (copy and paste).
   - `JWT_SECRET` – generate a long random string (e.g. `openssl rand -base64 32`) and paste it.
   - `PORT` – Railway sets this automatically; you can leave it unset or set to `4000`.
   - `APP_BASE_URL` – your public API URL (see below), e.g. `https://me-cook-api-production-xxxx.up.railway.app`.
   - `CORS_ORIGINS` – allow your app and any web clients, e.g. `https://mecook.app,capacitor://localhost,http://localhost:8081`.
   - `NODE_ENV` – `production`.
   - `MEDIA_UPLOAD_DIR` – e.g. `./uploads` (for persistent uploads, attach a **Volume** to this path in Railway and use the same value).
4. **Deploy**: Railway will build from the Dockerfile in `me-cook-api` and deploy. The first deploy will run `prisma db push` on startup to create/update tables.
5. **Public URL**: In the API service, open **Settings** → **Networking** → **Generate Domain**. Copy the URL (e.g. `https://me-cook-api-production-xxxx.up.railway.app`). Use this as `APP_BASE_URL` and as the API URL in the app (step 5).

---

## 4. (Optional) Seed the production database

To add sample recipes and data on Railway:

- **Option A – Railway shell**  
  In the API service, open **Settings** → run a one-off command (if available), or use **Deploy** → **View Logs** and ensure the app started. Then run the seed locally once, pointing at the production DB:
  ```bash
  cd me-cook-api
  set DATABASE_URL=<paste Railway Postgres URL here>
  npx tsx prisma/seed.ts
  ```
  (Use `export DATABASE_URL=...` on Mac/Linux.)

- **Option B – Add a seed script/endpoint**  
  You could add an admin-only HTTP endpoint that runs the seed; call it once after deploy, then disable or remove it.

---

## 5. Use the app anywhere (point at Railway API)

The mobile app reads the API URL from **build-time** env (EAS) or **runtime** config. To use the app from anywhere without USB or a local server:

### A. Development / testing on your phone (same app, production API)

In `me-cook-mobile/.env` set the API to your Railway API URL:

```env
EXPO_PUBLIC_API_URL=https://me-cook-api-production-xxxx.up.railway.app
```

Replace with your actual Railway API domain. Then:

```bash
cd me-cook-mobile
npx expo start
```

Open the app on the device (USB or Wi‑Fi as in DEV_SETUP.md). The app will talk to the API on Railway, so it works from anywhere.

### B. Production-style builds (EAS Build)

Your `eas.json` already has a production profile with:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://api.mecook.app"
  }
}
```

To use **Railway** instead of `api.mecook.app`:

1. In `me-cook-mobile/eas.json`, set the production (and optionally preview) API URL to your Railway URL:
   ```json
   "EXPO_PUBLIC_API_URL": "https://me-cook-api-production-xxxx.up.railway.app"
   ```
2. Build the app:
   ```bash
   cd me-cook-mobile
   eas build --platform android --profile production
   ```
3. Install the built APK on your phone or submit to the Play Store. The app will use the Railway API from anywhere.

---

## 6. Checklist

| Step | Done |
|------|------|
| Code on GitHub | |
| Railway project + PostgreSQL created | |
| API service: root directory = `me-cook-api` | |
| Variables: `DATABASE_URL`, `JWT_SECRET`, `APP_BASE_URL`, `CORS_ORIGINS` | |
| API domain generated and set in `APP_BASE_URL` and in the app | |
| (Optional) DB seeded | |
| App `.env` or EAS profile points to Railway API URL | |

---

## 7. Troubleshooting

- **API 500 / DB errors**  
  Check Railway logs. Ensure `DATABASE_URL` is the Postgres URL from the same project and that the deploy finished (Prisma `db push` runs on first start).

- **App can’t reach API**  
  Confirm `EXPO_PUBLIC_API_URL` uses the **public** Railway URL (https://…), not localhost. For production builds, rebuild after changing `eas.json` env.

- **CORS errors**  
  Add your app’s origin to `CORS_ORIGINS` (e.g. `https://mecook.app`, `capacitor://localhost`, `http://localhost:8081` for dev).

- **Uploads disappear after redeploy**  
  Attach a Railway **Volume** to the API service and set `MEDIA_UPLOAD_DIR` to the mounted path (e.g. `/data/uploads` and mount the volume at `/data`).

Once the API is on Railway and the app uses that URL, you can use the app from anywhere without USB or a local server.
