# Archer Mobile

Archer's iOS and Android client, built with React Native, Expo, TypeScript, Expo Router, TanStack Query, and SecureStore.

See [../SPEC.md](../SPEC.md) for product behavior and [../AGENTS.md](../AGENTS.md) for repository and API boundaries.

## Setup

Requirements: Node.js 20+ and the Expo-supported iOS/Android development environment. Install packages and configure the API URL:

```bash
npm install
cp .env.example .env
npm start
```

Start the API in another terminal with `cd api && npm run dev`. When `EXPO_PUBLIC_API_URL` is empty, the app uses the host address Expo Go reports for the development server, which lets a physical phone on the same Wi-Fi reach the computer's API. Android emulators use `http://10.0.2.2:4000/api/v1`; iOS simulators use `http://localhost:4000/api/v1`.

If automatic host detection does not work, set `EXPO_PUBLIC_API_URL` in `mobile/.env` to `http://<your-computer-LAN-IP>:4000/api/v1` (for example `http://192.168.1.20:4000/api/v1`). Keep the phone and computer on the same Wi-Fi and allow inbound connections to port 4000 through the computer's firewall. After changing `.env`, restart Expo with `npm start -- --clear`. Check connectivity by opening `http://<your-computer-LAN-IP>:4000/health` in the phone's browser; it should return JSON with status `ok`.

Use the Expo CLI prompt to open the app in an iOS simulator, Android emulator, or Expo Go. iOS simulator builds require macOS. For native development builds, use the documented Expo `run:ios` or `run:android` workflow.

## Implemented mobile flows

- Email/password registration and sign-in with client/freelancer role selection.
- Secure access and refresh token storage, automatic refresh on expired access tokens, and sign out.
- Role-aware home overview and job discovery/search.
- Job details, freelancer proposal submission, and proposal review/accept/reject/withdraw.
- Client job brief creation and publishing.
- Project list and participant workspace with status, milestone, and project messaging actions.
- In-app notifications that open related proposals and projects.
- Profile name, headline, and bio editing.

The API remains authoritative for validation and permissions. Payment processing, push notifications, file uploads, and offline writes are not implemented.
