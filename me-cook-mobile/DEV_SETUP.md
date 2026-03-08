# MeCook – Running on a physical Android device

You can run the app **with USB** (simplest) or **over Wi‑Fi without USB**.

---

## Option A: With USB cable

1. **Start Metro** (from `me-cook-mobile`):
   ```bash
   npx expo start
   ```
2. **Forward the bundler port** (phone connected by USB, USB debugging on):
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```
3. In `.env` you can use:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:4000
   ```
4. Open or reload the app on the device.

---

## Option B: Without USB (Wi‑Fi only)

Phone and PC must be on the **same Wi‑Fi** network.

### 1. Get your PC’s IP address

- **Windows (PowerShell):** `ipconfig` → look for "IPv4 Address" under your Wi‑Fi adapter (e.g. `192.168.1.241`).
- **Mac/Linux:** `ifconfig` or `ip addr` → same idea.

Use that IP below (e.g. `192.168.1.241`).

### 2. Configure the API URL

In `me-cook-mobile/.env` set the API to your PC’s IP (the phone cannot use `localhost`):

```env
EXPO_PUBLIC_API_URL=http://192.168.1.241:4000
```

Replace `192.168.1.241` with your actual IP. Save the file.

### 3. Start the API and Metro

- **Terminal 1** (API): from `me-cook-api` run `npm run dev` (API on port 4000).
- **Terminal 2** (Metro): from `me-cook-mobile` run:
  ```bash
  npx expo start
  ```
  Note the LAN URL Metro prints, e.g. `exp://192.168.1.241:8081`.

### 4. Allow the bundler and API through the firewall

So the phone can reach your PC:

- **Windows:** Allow inbound TCP ports **8081** (Metro) and **4000** (API) for your private network (e.g. "Node.js" or add a rule for these ports).
- **Mac:** If a firewall is on, allow "Node" or add rules for 8081 and 4000.

### 5. Point the app at the bundler (first time or after “Unable to load script”)

1. Open the MeCook app on the phone (no USB).
2. If you see the red **“Unable to load script”** screen:
   - Shake the device to open the **developer menu** (or run `adb shell input keyevent 82` if you have wireless ADB).
   - Tap **“Settings”** (or “Debug server host & port for device”).
   - Set the host to your PC’s IP and port **8081**, e.g. `192.168.1.241:8081`.
   - Go back and tap **“Reload”**.
3. The app should load; it will use `EXPO_PUBLIC_API_URL` from `.env` to talk to your API.

### 6. Optional: Tunnel (phone on a different network)

If the phone is **not** on the same Wi‑Fi as the PC, you can use Expo’s tunnel so the device can still load the JS bundle:

```bash
npx expo start --tunnel
```

- Install `@expo/ngrok` if prompted.
- The phone can then load the app via the tunnel URL. The **API** must still be reachable (e.g. same Wi‑Fi, or a deployed API URL in `.env`).

---

## Quick checklist (no USB)

| Step | Action |
|------|--------|
| 1 | PC and phone on same Wi‑Fi |
| 2 | `.env`: `EXPO_PUBLIC_API_URL=http://<YOUR_PC_IP>:4000` |
| 3 | Start API: `npm run dev` in `me-cook-api` |
| 4 | Start Metro: `npx expo start` in `me-cook-mobile` |
| 5 | Firewall: allow TCP 8081 and 4000 |
| 6 | In app Dev Menu → set debug server to `<YOUR_PC_IP>:8081` → Reload |

---

## If it still fails

- **“Unable to load script”:** Dev Menu → set server to `PC_IP:8081`, then Reload. Confirm firewall allows 8081.
- **API errors / no recipes:** Check `EXPO_PUBLIC_API_URL` uses your PC IP (not `localhost`). Confirm API is running and firewall allows 4000.
- **Wireless ADB (optional):** To use Dev Menu without USB: `adb tcpip 5555` (with USB once), then `adb connect <PHONE_IP>:5555`. You can then unplug USB and use `adb shell input keyevent 82` to open the dev menu.
