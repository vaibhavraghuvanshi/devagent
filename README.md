<p align="center">
  <img src="https://github.com/vaibhavraghuvanshi/devagent/blob/f9c2d38411de7bc38e02ce6194837520bb48cdeb/screenshots/login.png" alt="Login" width="100%" />
</p>
<p align="center">
  <img src="[./screenshots/hero.png](https://github.com/vaibhavraghuvanshi/devagent/blob/f9c2d38411de7bc38e02ce6194837520bb48cdeb/screenshots/landing-screen.png)" alt="Landing Screen" width="100%" />
</p>
<p align="center">
  <img src="./screenshots/agent-screen.png" alt="Agent Screen" width="100%" />
</p>
<p align="center">
  <img src="./screenshots/templates-screen.png" alt="Template Screen" width="100%" />
</p>

# DevAgent

An AI chat assistant built with Next.js, Prisma, and NextAuth. Supports persistent chat history, streaming agent tool execution, share links, and fully persisted per-user settings across 10 settings sections.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router), React 19, TypeScript 5 |
| Database | PostgreSQL via Prisma 5.17 ORM |
| Auth | NextAuth 5 (GitHub, Google OAuth + email/password credentials) |
| AI inference | Groq SDK — `llama-3.3-70b-versatile` and other Groq models |
| State | Zustand 4 |
| Styling | Tailwind CSS 4, lucide-react icons, next-themes |

---

## Features

### Chat & Agent
- **Streaming chat** with Groq models — token-budget-aware history trimming keeps large sessions within context limits
- **Agent mode** — multi-round tool execution (file read/write, shell, search) with per-call 30 s timeout guard
- **Cursor-based message pagination** — first 50 messages loaded; older messages fetched on demand
- **Session history** — grouped by Today / Yesterday / Last 7 days in the sidebar
- **Session title rename** — click-to-edit inline in the Session Info panel
- **Session search** — full-text search across session titles and message content

### Share
- **Public share links** — generate a read-only, token-secured link for any chat (no login required to view)
- **Revoke / refresh** — invalidate a link or generate a new token at any time
- **Public share page** — `/share/[token]` renders the conversation with OG metadata for social sharing

### Settings (10 sections, all persisted to DB)
| Section | What's saved |
|---------|--------------|
| Profile | Name, bio, language, timezone, avatar |
| Account | Email update, password change, connected OAuth providers, account deletion |
| Preferences | Default model, default mode (chat/agent), send-on-enter, code highlighting |
| Appearance | Theme (System / Light / Dark) |
| Data & Privacy | Save history toggle, analytics, data retention period |
| Security | 2FA toggle, login alerts, suspicious sign-in detection |
| Integrations | GitHub, Slack, Jira, Linear toggles; webhook URL, sync interval |
| Billing | Plan, billing cycle, spend limit, invoice email, tax ID |
| Notifications | Email/push, product updates, security alerts, quiet hours |
| Advanced | Developer mode, beta features, stream responses, verbose tool logs, safe mode |

### Performance (Phase 2)
- Parallel fetch on mount (`Promise.all` for preferences, advanced settings, sessions)
- `useMemo` on session grouping; `React.memo` on `SessionItem`
- Textarea resize throttled to 100 ms
- `setTimeout` copy feedback stored in `useRef` — cleared on unmount

### UX stability (Phase 3)
- **Init error banner** — visible dismissable alert if any startup fetch fails
- **Session loading skeleton** — shimmer rows in ChatLog while switching sessions
- **Stale-token detection** — if a JWT carries a deleted user ID the app auto-signs out
- **Stale session pruning** — orphaned session IDs are silently removed from the sidebar
- **Settings save guard** — `useRef` lock prevents duplicate in-flight save requests; all save errors are now surfaced inline
- **Registration success delay** — success message stays visible for 1.5 s before the form resets

---

## Project structure

```
devagent/
├── app/
│   ├── (chat)/page.tsx          # Main chat UI (protected)
│   ├── login/page.tsx           # Sign-in / sign-up
│   ├── share/[token]/page.tsx   # Public shared chat viewer
│   └── api/
│       ├── auth/[...nextauth]/  # NextAuth handlers
│       ├── auth/register/       # Email registration
│       ├── agent/chat/          # Streaming agent endpoint
│       ├── sessions/            # CRUD + search
│       ├── sessions/[id]/       # Title update, delete
│       ├── sessions/[id]/messages/   # Paginated messages
│       ├── sessions/[id]/share/      # Share link management
│       ├── share/[token]/            # Public share read
│       └── user/{profile,account,preferences,
│                appearance,data-privacy,security,
│                integrations,billing,notifications,advanced}/
├── components/
│   ├── chat/   ChatLog, MessageBubble, InputBar, ToolCallCard, DiffBlock
│   └── layout/ Sidebar, TopBar, ShareModal, SessionInfoPanel,
│               SearchModal, SettingsView, LibraryView, AgentsView, TemplatesView
├── lib/
│   ├── auth.ts / auth.config.ts
│   ├── db.ts
│   ├── store.ts            # Zustand store
│   ├── models.ts           # Available Groq models
│   ├── agent-tools.ts      # Tool definitions & executor
│   ├── chat-serialize.ts   # Prisma → client message mapper
│   └── hooks/useGroqChat.ts
└── prisma/
    ├── schema.prisma
    └── seed.js             # Dev user seed (run: npx prisma db seed)
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in the required values:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname
AUTH_SECRET=your-secret-here          # or NEXTAUTH_SECRET
GROQ_API_KEY=gsk_...

# Required for production (optional in dev — defaults to http://localhost:3000)
AUTH_URL=https://your-domain.com

# Optional — OAuth providers (leave empty to disable)
GITHUB_ID=
GITHUB_SECRET=
GOOGLE_ID=
GOOGLE_SECRET=

# Optional — email SMTP (used by nodemailer)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=noreply@example.com

# Optional — agent tool sandboxing
PROJECT_ROOT=/path/to/project
```

### 3. Apply the database schema

```bash
npx prisma db push          # development (no migration history)
# or
npx prisma migrate deploy   # production (uses migration history)
```

### 4. Seed the dev user (optional but recommended)

```bash
npx prisma db seed
```

Creates (or resets) a dev account — safe to re-run after any database reset:

| Field | Value |
|-------|-------|
| Email | `dev@devagent.local` |
| Password | `DevAgent@123` |

### 5. Start the development server

```bash
npm run dev
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (auto-generates Prisma client first) |
| `npm run build` | Production build (auto-generates Prisma client first) |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run prisma:generate` | Manually regenerate Prisma client |
| `npx prisma db seed` | Seed default dev user |
| `npx prisma studio` | Open Prisma Studio at http://localhost:5555 |

---

## Database models

```
User ──┬── UserProfile
       ├── UserPreferences
       ├── UserAppearance
       ├── UserDataPrivacy
       ├── UserSecurity
       ├── UserIntegrations
       ├── UserBilling
       ├── UserNotifications
       ├── UserAdvanced
       ├── Account          (OAuth)
       ├── Session          (NextAuth DB session — unused with JWT strategy)
       ├── ChatSession ─────┬── ChatMessage ── ToolCall
       │                    ├── ContextFile
       │                    └── SharedChat
       └── SharedChat
```

---

## Notes

- **Prisma engine lock on Windows** — if `prisma generate` fails with EPERM, stop all running Next.js / Node processes (they hold the DLL), then re-run `npm run prisma:generate`.
- **JWT strategy** — sessions are stored in browser cookies only; the `Session` table is unused. If you reset the database, any existing browser JWTs will carry a stale user ID. Sign out and back in, or run `npx prisma db seed` to restore the dev user.
- **OAuth providers** — set `GITHUB_ID` / `GITHUB_SECRET` or `GOOGLE_ID` / `GOOGLE_SECRET` to enable the respective OAuth buttons on the login page. Omitting both env vars hides the buttons automatically.
- **Agent tools** — tool execution is sandboxed by a 30 s timeout (`withToolTimeout`). Add or remove tools in `lib/agent-tools.ts` and update the tool definitions array in `lib/prompts/`.
