# AgentDesk Frontend

Expo app for the AgentDesk clinic front desk. Staff run the appointment agent, review history, and approve risky actions. Patients book visits and manage their own appointments.

The API lives in the sibling `Backend` folder. This app talks to it over HTTP. Supabase is used for authentication only. Do not put the Supabase service-role key, database credentials, or other privileged secrets in this app.

## Prerequisites

- Node.js 20 or newer
- npm
- The AgentDesk API running locally when you need live data

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local env file:

   ```bash
   cp .env.example .env
   ```

3. Fill in `.env`. Do not commit that file.

   | Variable | Purpose |
   | --- | --- |
   | `EXPO_PUBLIC_API_BASE_URL` | API origin. Defaults to `http://localhost:3000` when unset. |
   | `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL. |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. This is the public client key, not the service-role key. |

Restart Expo after changing `.env`.

### Reaching the API from a device

`localhost` on a phone is the phone, not your computer.

- **Web and the iOS simulator:** `http://localhost:3000` reaches the computer running the API.
- **Physical device:** in development, a loopback API URL is rewritten to the Expo dev server's host (your computer's LAN address). You can also set `EXPO_PUBLIC_API_BASE_URL` to that address directly, for example `http://192.168.1.20:3000`.
- **Android emulator:** the same rewrite is used. If Expo does not report a host, the app uses `10.0.2.2`, the emulator's alias for the computer.
- **Production builds:** localhost is not rewritten. Set `EXPO_PUBLIC_API_BASE_URL` to the deployed API.

The API process must listen on `0.0.0.0`, not only `127.0.0.1`, or a phone cannot connect.

## Development

```bash
npm start
npm run ios
npm run android
npm run web
npm run lint
npm run typecheck
```

`npm start` opens Expo. From there you can open a development build, a simulator, or Expo Go.

EAS Build profiles live in `eas.json` (`development`, `preview`, `production`). The app version stays in `app.json` (`appVersionSource` is `local`). This repository did not previously include an `eas.json`; the file added here is the standard profile set and does not change the Expo SDK version.

## Architecture

Routes stay in `app/` so Expo Router owns navigation. Shared UI and business logic stay in `src/`. Route groups change who can open a screen. They do not change the URL.

```
app/
  _layout.tsx              Auth provider, fonts, role guards
  index.tsx                Signed-in staff home; patients redirect to /patient
  +not-found.tsx
  (auth)/sign-in.tsx       /sign-in
  (patient)/patient/       /patient, /patient/book, /patient/appointments, /patient/profile
  (staff)/appointments/    /appointments
  (staff)/agent/           /agent
  (staff)/history/         /history, /history/[runId]

src/
  components/ui/           Shared screen, button, card, and loading UI
  features/
    ai-agent/              Goal input, run progress, approvals
    appointments/          Staff day list, clinic dates, status
    auth/                  Session and role context
    history/               Past agent runs
    patients/              Patient booking, profile validation, appointment cards
  hooks/                   Fonts and shared async loading
  prototype/               Local clinic wireframe. Not mounted in the router.
  services/api/            Typed HTTP client and endpoint modules
  services/supabase/       Supabase Auth client (anon key only)
  theme/                   Colors, spacing, fonts, radius
```

There is no `(doctor)` route group. The live account role is `staff` or `patient`. A doctor role exists only inside `src/prototype`, which is a local wireframe and is not a signed-in screen.

`src/services/api/client.ts` attaches the Supabase access token, maps the API's `{ success, data, error }` envelope onto thrown `ApiError`s, and signs out locally on `401`. Endpoint modules (`account`, `appointments`, `patients`, `agents`) are re-exported from `src/services/api/index.ts`.

TypeScript path alias `@/*` points at `src/*` (see `tsconfig.json`). Expo Metro reads that alias, so route files import shared code as `@/components/...` rather than relative paths into `src`.
