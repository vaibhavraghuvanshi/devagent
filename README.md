# DevAgent

DevAgent is a Next.js + Prisma + NextAuth chat assistant with persistent chat history, agent tooling, and fully persisted user settings.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Prisma + PostgreSQL
- NextAuth (GitHub, Google, credentials)
- Zustand state store
- Groq SDK for model inference

## Recent updates

- Implemented full Settings backend + UI for:
  - Profile, Account, Preferences, Appearance, Data & Privacy
  - Security, Integrations, Billing, Notifications, Advanced
- Added dedicated user settings tables:
  - `UserSecurity`, `UserIntegrations`, `UserBilling`, `UserNotifications`, `UserAdvanced`
- Added authenticated settings APIs:
  - `/api/user/profile`
  - `/api/user/account`
  - `/api/user/preferences`
  - `/api/user/appearance`
  - `/api/user/data-privacy`
  - `/api/user/security`
  - `/api/user/integrations`
  - `/api/user/billing`
  - `/api/user/notifications`
  - `/api/user/advanced`
- Added session deletion API:
  - `DELETE /api/sessions/[id]`
- Wired settings into runtime behavior:
  - `defaultModel`, `defaultMode`, `sendOnEnter`
  - `streamResponses`, `verboseToolLogs`, `safeMode`, `developerMode`, `betaFeatures`
- Login now lands on welcome screen (no auto-opened chat).

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
DATABASE_URL=
AUTH_SECRET= # or NEXTAUTH_SECRET
GROQ_API_KEY=

# optional OAuth providers
GITHUB_ID=
GITHUB_SECRET=
GOOGLE_ID=
GOOGLE_SECRET=
```

3. Apply migrations:

```bash
npx prisma migrate deploy
```

4. Run development server:

```bash
npm run dev
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — lint code
- `npm run prisma:generate` — regenerate Prisma client

## Notes

- Prisma client is auto-generated on install (`postinstall`).
- If Prisma engine file lock appears on Windows during generate, close running Node/Next processes and regenerate.
