# MeCook

Premium iOS + Android recipe platform where verified creators publish step-by-step recipes and video instructions.

## Projects

- `me-cook-mobile`: Expo React Native app
- `me-cook-api`: Node + Express + Prisma backend

## Quick Start

### 1) API

1. Copy `me-cook-api/.env.example` to `me-cook-api/.env`
2. Set `DATABASE_URL` and `JWT_SECRET`
3. Run:

```bash
cd me-cook-api
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

Seeded test accounts:

- `admin@mecook.app` / `Password123!`
- `creator1@mecook.app` / `Password123!`
- `user1@mecook.app` / `Password123!`

### 2) Mobile

1. Copy `me-cook-mobile/.env.example` to `me-cook-mobile/.env`
2. Set `EXPO_PUBLIC_API_URL` (example: `http://localhost:4000`)
3. Run:

```bash
cd me-cook-mobile
npm install
npm run start
```

## Android Studio + Real Phone Testing

1. Generate Android native project from Expo:

```bash
cd me-cook-mobile
npx expo prebuild --platform android
```

2. Open Android Studio and select folder:

- `MeCook/me-cook-mobile/android`

3. On your Android phone:

- Enable Developer Options
- Enable USB Debugging
- Connect by USB and accept debug prompt

4. Build and run from Android Studio (or CLI):

```bash
cd me-cook-mobile
npx expo run:android --device
```

5. Set API URL for device testing:

- In `me-cook-mobile/.env`, set:
- `EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_LAN_IP>:4000`
- Make sure API server is running and firewall allows port `4000`.

## Deploy to use the app anywhere (GitHub + Railway)

To run the app from anywhere without USB or a local server:

1. Push this repo to **GitHub**.
2. Deploy the API to **Railway** with a PostgreSQL database (root directory: `me-cook-api`).
3. Point the mobile app at your Railway API URL (in `me-cook-mobile/.env` or in `eas.json` for production builds).

Full steps, env vars, and troubleshooting: **[me-cook-api/DEPLOY.md](me-cook-api/DEPLOY.md)**.

## Launch Readiness Checklist

- Enable Railway Postgres and set all API secrets
- Configure iOS bundle ID + Android application ID in stores
- Add Sentry/Firebase crash reporting and push notifications
- Wire real video transcode worker for production uploads
- Add legal pages (Privacy Policy, Terms, Content Policy)
