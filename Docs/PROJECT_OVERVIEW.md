# CodeOrbit — Project Reference

> In-depth reference for the whole monorepo: architecture, every major flow, data model, API surface, config, and known issues.
> Generated from a read-through of the source (not by running it). Where something is inferred rather than observed, it says so.
> Folder names: `ui/` (was `codeorbit`), `server/` (was `codeorbit_backend`), `ai/`.

---

## Table of contents

1. [What CodeOrbit is](#1-what-codeorbit-is)
2. [Architecture at a glance](#2-architecture-at-a-glance)
3. [Repository layout](#3-repository-layout)
4. [Tech stack](#4-tech-stack)
5. [Configuration & environment variables](#5-configuration--environment-variables)
6. [Running locally](#6-running-locally)
7. [Data model (MongoDB)](#7-data-model-mongodb)
8. [Authentication & authorization](#8-authentication--authorization)
9. [Feature flows](#9-feature-flows)
   - 9.1 Platform connection & sync
   - 9.2 Dashboard & analytics
   - 9.3 Leaderboard, contests, resources
   - 9.4 Smart Insights (AI recommendations)
   - 9.5 Collab Space: friends, notifications, pings
   - 9.6 Collaboration rooms: chat, canvas, video
   - 9.7 Mock Interview (AI service)
10. [Server reference](#10-server-reference-serverjs-express)
11. [AI service reference](#11-ai-service-reference-fastapi)
12. [UI reference](#12-ui-reference-nextjs) (incl. [12.1 Design system & styling](#121-design-system--styling))
13. [Full API route table](#13-full-api-route-table)
14. [Background jobs](#14-background-jobs)
15. [Deployment](#15-deployment)
16. [Known issues & gotchas](#16-known-issues--gotchas)
17. [Where to change what](#17-where-to-change-what)

---

## 1. What CodeOrbit is

A developer-analytics and prep platform. Three things in one product:

1. **Unified coding dashboard** — pulls stats from LeetCode, Codeforces, CodeChef, GeeksforGeeks and GitHub into one profile: problems solved, ratings, contest history, a 365-day activity heatmap, streaks, consistency score, badges, a leaderboard.
2. **Collab Space** — a small social layer: find users, follow/friend them, "ping" a friend to start a live collaboration room with text chat, a shared whiteboard and a video call (Stream Chat + Stream Video).
3. **AI features** — (a) *Smart Insights*: LLM-generated problem recommendations and learning paths from recent solves (Groq, in the Node server); (b) *Mock Interview*: a conversational AI interviewer (Groq via LangChain, in a separate Python FastAPI service) with resume analysis, a question-bank retriever, answer scoring, adaptive difficulty and a final report.

UI labels in the sidebar differ from internal names:

| Sidebar label | Internal id / route |
|---|---|
| OrbitHub | `dashboard` (`/`) |
| Portfolio | `profile` (`/profile`) |
| Activity | `activity` |
| Contest Tracker | `contests` |
| Knowledge Hub | `resources` |
| Collab Space | `social` (`/social`) |
| Mock Interview | `mock-interview` (`/mock-interview`) |
| Smart Insights | `ai-insights` |
| Settings | `settings` (placeholder — "Coming soon") |

---

## 2. Architecture at a glance

```
                    ┌───────────────────────────────┐
                    │  Browser  (Next.js 16 / React 19)  │   ui/  :3000
                    └──────┬──────────┬──────────┬──┘
        REST + JWT/Firebase│          │ WebSocket │ WebRTC/WS
                           │          │ (Stream)  │ (Stream Video)
                           ▼          ▼           ▼
        ┌─────────────────────┐   ┌──────────────────────────┐
        │  server/  Express 5  │   │  Stream Chat / Video     │  (3rd-party SaaS)
        │  :5000   (ESM)       │──▶│  channels, events, calls │
        └───┬────────┬────────┘   └──────────────────────────┘
            │        │ axios
            │        ▼
            │   ┌──────────────────────┐        ┌─────────────────┐
            │   │ ai/  FastAPI :8000   │──────▶ │  Groq LLM API   │
            │   │ sessions in memory   │        └─────────────────┘
            │   │ Chroma + MiniLM      │
            │   └──────────────────────┘
            ▼
     ┌──────────────┐     outbound scraping / APIs from server:
     │ MongoDB Atlas│     LeetCode GraphQL, Codeforces API, GitHub REST+GraphQL,
     └──────────────┘     CodeChef & GFG (Puppeteer HTML scraping), Groq (recs)
```

Key architectural facts:

- **The browser only talks to the Node server for business logic.** The Node server proxies all AI-interview calls to the Python service. The one exception: the UI posts audio straight to the AI service's `/voice/speech-to-text` (see §16).
- **MongoDB holds everything persistent** except interview sessions, which live in the AI service's process memory.
- **Real-time is delegated to Stream** (chat channels + custom events). There is **no Socket.IO / WebSocket server** in this repo; `User.socketId` and `onlineStatus` exist in the schema but nothing maintains them.
- **Two auth mechanisms coexist**: Firebase ID tokens (Google sign-in) and the server's own JWT (email/password). One middleware accepts both.
- Firebase is used **only** for Google login. Firestore/other Firebase products are not used.

---

## 3. Repository layout

```
D:\CodeOrbit
├── ui/                          Next.js frontend
│   ├── app/                     App Router pages (see §12)
│   ├── components/              feature components + shadcn/ui primitives (components/ui/*)
│   ├── contexts/                auth, stream, stats-mode providers
│   ├── lib/                     api clients (api.ts, auth.ts, api-client.ts, ai-interview-api.ts), firebase.ts
│   ├── hooks/                   use-toast, use-mobile, use-counter-animation
│   └── Docs/                    older design/interview-prep notes (markdown)
│
├── server/                      Express API (ES modules)
│   ├── server.js                entry: connect DB → init Stream → cron → listen
│   ├── app.js                   express app, CORS, route mounting
│   ├── config/                  db.js (mongoose), firebase.js (admin SDK)
│   ├── middleware/              auth.middleware.js  (`protect`)
│   ├── models/                  User, FriendRequest, Notification, PingRequest, Room
│   ├── routes/ + controllers/   one pair per feature area (21 route files)
│   ├── services/                external integrations (LeetCode, CF, GitHub, Groq, Stream, scrapers)
│   ├── utils/                   activity, consistency, heatmap, weeklyTrend, validation
│   ├── jobs/                    node-cron jobs
│   ├── uploads/                 multer temp dir (resume PDFs, audio)
│   └── Docs/                    API_DOCUMENTATION.md, API_ENDPOINTS.md
│
└── ai/                          Python FastAPI interview service
    ├── app.py                   FastAPI app (uvicorn app:app)
    ├── routes/                  interview_api.py, voice_api.py, resume.py (unused)
    ├── services/                conductor, evaluator, difficulty adapter, report, session manager,
    │                            resume analyzer/parser, question bank loader, llm, embeddings, speech
    ├── models/                  interview_session.py (pydantic)
    ├── datasets/                9 question banks (JSON arrays inside .txt files)
    ├── rebuild_vector_db.py     rebuilds Chroma stores from datasets
    ├── render.yaml, start.sh    Render deploy config
    └── docs/                    detailed per-file docs for the AI service (already exist)
```

---

## 4. Tech stack

**UI** — Next.js 16.1 (App Router), React 19.2, TypeScript 5.7, Tailwind CSS 4, shadcn/ui (Radix primitives), framer-motion, recharts 2.15, lucide-react, next-themes (dark default), sonner + a Radix toast, react-hook-form + zod, axios, Firebase JS SDK 12, `stream-chat` + `stream-chat-react`, `@stream-io/video-react-sdk`, `@vercel/analytics`. `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true` (type errors will not fail a build).

**Server** — Node (ESM, `"type": "module"`), Express 5.2, Mongoose 8, `firebase-admin`, `jsonwebtoken` + `bcryptjs`, `axios`, `cheerio` (installed, not used in code read), `puppeteer` (CodeChef/GFG scraping), `node-cron`, `multer`, `form-data`, `stream-chat`, `uuid`. Dev: `nodemon`. Package name is still `codolio_backend` (earlier project name "Codolio"; LeetCode verification codes are prefixed `CODOLIO-`).

**AI** — Python 3.11 (`runtime.txt` pins 3.11.11; local machine runs 3.13), FastAPI + uvicorn, LangChain (`langchain-groq`, `langchain-community`, `langchain-huggingface`), ChromaDB, `sentence-transformers/all-MiniLM-L6-v2`, `pypdf`. LLM: Groq `llama-3.1-8b-instant`. **Not in `requirements.txt`** but imported optionally: `openai-whisper`, `gtts` (voice features).

**External services** — MongoDB Atlas, Firebase Auth, Stream (Chat + Video), Groq, GitHub OAuth app, public LeetCode/Codeforces endpoints.

---

## 5. Configuration & environment variables

Never commit real values. (Note: during analysis the server `.env` contents were printed in a chat session — rotate those keys.)

### server/.env
| Var | Used by | Notes |
|---|---|---|
| `MONGO_URI` | `config/db.js` | Atlas SRV string. DB name comes from the URI path (the current one has none → default `test` DB). |
| `JWT_SECRET` | auth controller, middleware | Signs 30-day email/password tokens. Use a long random value. |
| `PORT` | `server.js` | default `5000` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY_ID`, `FIREBASE_PRIVATE_KEY` (with `\n` escapes), `FIREBASE_CLIENT_EMAIL`, `FIREBASE_CLIENT_ID` | `config/firebase.js` | Service account for verifying Google ID tokens. |
| `STREAM_API_KEY`, `STREAM_API_SECRET` | `services/stream.service.js` | Chat user upsert, token minting, channels, events. |
| `GROQ_API_KEY` | `services/groq.service.js` | If missing, recommendations fall back to local heuristics. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `exchangeGithubCode` | **Required for GitHub OAuth; not present in the `.env` that was read.** |
| `GITHUB_TOKEN` | — | Present in `.env` but not referenced by any code read. |
| `AI_SERVICE_URL` | `ai-interview.controller.js` | default `http://localhost:8000` |

### ui/.env.local
| Var | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | Node server base (default `http://localhost:5000`). **The current file has a malformed line `i ahve thisNEXT_PUBLIC_API_URL=...`**, so this var is effectively unset; code falls back to the same default, so it works by accident. |
| `NEXT_PUBLIC_FIREBASE_*` (API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID) | Firebase web config |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | OAuth authorize URL |
| `NEXT_PUBLIC_FRONTEND_URL` | Builds OAuth `redirect_uri` = `${FRONTEND_URL}/api/auth/callback/github`; must match the GitHub OAuth app. |
| `NEXT_PUBLIC_AI_SERVICE_URL` | Used only for direct speech-to-text calls (default `http://localhost:8000`). |

### ai/.env
`GROQ_API_KEY` (read via `python-dotenv` in `services/llm.py`). On Render also `PYTHON_VERSION=3.11`. Optional `PORT`.

### CORS
Server allows only: `localhost:3000`, `localhost:3001`, and three `*.vercel.app` URLs (hard-coded in `server/app.js`). A new frontend origin requires editing that list. The AI service allows `*`.

---

## 6. Running locally

```powershell
# 1. Server (needs MongoDB reachable + .env)
cd D:\CodeOrbit\server
npm install
npm run dev            # nodemon server.js  → http://localhost:5000

# 2. UI
cd D:\CodeOrbit\ui
npm install            # (pnpm-lock.yaml also present; package-lock.json is the one in use)
npm run dev            # http://localhost:3000

# 3. AI service (only needed for Mock Interview)
cd D:\CodeOrbit\ai
pip install -r requirements.txt
# optional for voice:  pip install openai-whisper gtts
uvicorn app:app --host 0.0.0.0 --port 8000        # NOT main:app, NOT $PORT (that's bash syntax)
```

Startup order inside `server.js`: **connectDB → initializeStreamChat → startStatsCron → startExpirePingsCron → listen**. If MongoDB fails to connect, `connectDB` calls `process.exit(1)` and nodemon reports "app crashed" — the HTTP server never starts. Typical Atlas causes: IP not allow-listed, cluster paused, wrong credentials, DNS/SRV blocked.

First start of the AI service downloads the `all-MiniLM-L6-v2` model (slow, HF warnings are harmless).

Friend accept/remove use Mongo **transactions**, which need a replica set (Atlas is fine; a standalone local mongod is not).

---

## 7. Data model (MongoDB)

Five collections (`users`, `friendrequests`, `notifications`, `pingrequests`, `rooms`). Everything about a person's coding profile is **embedded in `User`**.

### User (`server/models/User.js`)
```
email*(unique)  password (required only if no firebaseUid)
firebaseUid(unique, sparse)  provider: 'local'|'google'
displayName, photoURL
username(unique, sparse, lowercase)  uniqueId(unique, sparse)   ← uniqueId is never generated anywhere
bio(≤500)  profileImage  bannerImage  accountType: 'public'|'private'
socialLinks{github,linkedin,portfolio,twitter}
— social graph (arrays of ObjectId → User):
followers[]  following[]  friends[]  friendRequestsSent[]  friendRequestsReceived[]  blockedUsers[]
— presence: onlineStatus(default true)  lastSeen  socketId        ← never updated by any code
— Stream: streamUserId  streamToken
— platforms (embedded sub-documents):
leetcode{ username, verified, verificationCode, codeExpiry, totalSolved, contestRating,
          contestsPlayed, totalActiveDays, difficultyBreakdown[{name,value,color}], badges[{name,icon}] }
codeforces{ handle, rating, maxRating, rank, solvedProblems, contestsPlayed }
github{ username, avatar, followers, following, publicRepos, totalStars, totalContributions,
        contributionGraph[], accessToken, connectedAt }       ← accessToken stored in plain text
codechef{ username, rating, highestRating, stars, globalRank, countryRank, problemsSolved, lastFetched }
gfg{ username, score, problemsSolved, codingScore, lastFetched }
— activity[{ date:'YYYY-MM-DD', count }]    ← the merged daily-activity series every analytic is computed from
— lastRecommendations{ generatedAt, recommendations{analysis,recommendations[],learningPath}, basedOnProblems }
lastSyncedAt
```
Indexes: text index on `displayName/username/bio`, `onlineStatus`. (`username`/`uniqueId` are already unique-indexed by `unique: true`; the extra `schema.index()` calls for them produce Mongoose "Duplicate schema index" warnings — harmless. `roomId` in `Room` has the same issue.)

### FriendRequest
`sender, receiver (User), status: pending|accepted|rejected|cancelled, type: follow|friend, createdAt, respondedAt`

### Notification
`sender, receiver, type, title, message, metadata{roomId, requestId, channelId}, read, createdAt`
`type` enum: `friend_request, request_accepted, follow, ping_request, ping_accepted, ping_rejected, message, room_invite`. **`new_friend` is NOT in the enum but is used by code** (see §16).

### PingRequest
`sender, receiver, status: pending|accepted|rejected|expired, message, roomId(→Room), createdAt, expiresAt (default now+5min), respondedAt`

### Room
`roomId (uuid v4, unique), participants[User], createdBy, active, streamChannelId ("room-<uuid>"), canvasData{ strokes[{type: draw|erase, points[Number], color, width, timestamp}] }, createdAt, closedAt`

---

## 8. Authentication & authorization

### Three ways to get a token

| Method | Endpoint | What the server does | Token returned |
|---|---|---|---|
| Email signup | `POST /api/auth/signup` | bcrypt(10) hash; creates `User{provider:'local'}`; creates Stream user (`streamUserId = _id`) | none (user must log in) |
| Email login | `POST /api/auth/login` | bcrypt compare; ensures Stream user; signs **JWT `{userId}` valid 30 days** | JWT |
| Google | `POST /api/auth/google` `{idToken}` | `admin.auth().verifyIdToken`; find-or-create by `firebaseUid`; refresh name/photo; ensure Stream user | **the Firebase ID token itself** |

Google flow in the UI: `signInWithPopup(auth, googleProvider)` → `user.getIdToken()` → POST to server → store returned token in `localStorage.token`.

### The `protect` middleware (`server/middleware/auth.middleware.js`)
Reads `Authorization: Bearer <token>`. Tries `admin.auth().verifyIdToken(token)` first; if that throws for any reason it falls back to `jwt.verify(token, JWT_SECRET)`; if both fail → 401 `Invalid token`. On the Firebase path it find-or-creates a User. Sets `req.user = <User _id>` (an **ObjectId, not a document**) and, for Firebase, `req.firebaseUser`.

Consequences: every controller does `User.findById(req.user)`; there are no roles/permissions. Authorization is per-resource inside controllers (e.g. "is participant of room", "is receiver of ping").

Public (no `protect`): `/api/auth/signup|login|google|check`, `/api/leaderboard`, `/api/contests`, `/api/resources`, `/api/profile/:email`.

### Client side
- `lib/auth.ts` and `lib/api-client.ts` each define an axios instance; both attach `localStorage.token`. On 401 they clear storage and redirect to `/auth/login` (`auth.ts` skips login/signup URLs; network errors do **not** log the user out). `lib/api.ts` imports the instance from `auth.ts`.
- `AuthProvider` (`contexts/auth-context.tsx`): on mount, if a token exists it calls `GET /api/auth/profile`; on 401 clears token, on other errors falls back to `localStorage.user_data`.
- `AuthGuard` wraps protected pages and redirects to `/auth/login` when there is no user.
- `ProfileCompletionModal` forces a new user to pick a `username` (regex `^[a-zA-Z0-9_]+$`) via `PATCH /api/users/profile`; completion is remembered in `localStorage`.

---

## 9. Feature flows

### 9.1 Platform connection & sync

Each platform has a *connect* endpoint (initial link) and a *sync* endpoint (refresh). All write into the embedded sub-document on `User` and merge daily counts into `user.activity`.

**LeetCode — verified ownership flow**
1. `POST /api/leetcode/connect {username}` → server stores `leetcode{username, verified:false, verificationCode:"CODOLIO-<8 hex>", codeExpiry:+15min}` and returns the code.
2. User pastes the code into their LeetCode profile "About me".
3. `POST /api/leetcode/verify` → server calls LeetCode GraphQL `getFullProfile` (`matchedUser.profile.aboutMe`, `submitStats`, `badges`, `userCalendar.submissionCalendar`, `userContestRanking`). If `aboutMe` contains the code → saves totals, Easy/Medium/Hard breakdown (with OKLCH colors), contest rating/count, active days, badges, and **adds** calendar counts to `activity`.
4. `POST /api/sync/leetcode` re-pulls the same data (only if `verified`).

**Codeforces** — `POST /codeforces/connect {handle}`: three public API calls (`user.info`, `user.rating`, `user.status`); `solvedProblems` = distinct `contestId-index` with verdict OK. No ownership verification. Seeds today's activity with `solvedProblems` via `updateActivity`.

**GitHub — OAuth**
1. UI `ConnectGithubModal` redirects to `https://github.com/login/oauth/authorize?client_id=…&redirect_uri=<FRONTEND>/api/auth/callback/github&scope=read:user,repo`.
2. GitHub redirects to Next route `app/api/auth/callback/github/route.ts`, which just forwards `code`/`error` to the page `/auth/github/callback`.
3. That page calls `POST /api/github/oauth/callback {code}`. Server exchanges the code (`exchangeGithubCode`), fetches the authenticated user, then `fetchGithubProfile(login, accessToken)` (REST profile + repos for stars + GraphQL contribution calendar). Saves `user.github` **including `accessToken`** and merges the calendar into `activity`.
4. Also: `POST /github/refresh` (re-fetch using the stored token, rewrites last-year activity), `POST /github/disconnect`, `GET /github/status` (never returns the token).

**CodeChef / GeeksforGeeks** — no public API used; `services/codechefService.js` and `gfgService.js` launch **headless Chromium (Puppeteer) per request**, load the profile page, wait 3–5 s, and regex the page text (rating / stars / problems solved; GFG also clicks the "Coding Score" tab). Fragile: any site markup change breaks it, each call costs seconds and RAM.

**Sync all** — `POST /api/sync/all` runs every connected platform in sequence inside try/catch blocks and returns a per-platform result object plus `activityDaysAdded`; sets `lastSyncedAt`. The dashboard's "Sync" button on `ProfileSummaryCard` uses it.

**Activity merge rules** (inconsistent — see §16): connect/verify paths *add* counts; sync paths take `max(existing, new)`.

### 9.2 Dashboard & analytics

`app/page.tsx` renders a tab-switched SPA shell (`AppSidebar` + `TopNavbar`) with a **DSA / Dev** toggle (`StatsModeContext`). DSA mode: `StatsWidgets` (streaks), `PlatformStatsGrid`, `TotalProblemsSolved`, `DifficultyDistribution`, `ContestRatingsChart`, `ActivityHeatmap`, `WeeklyActivityChart`, `ConsistencyScore`, `PlatformComparison`, `BadgesShowcase`. Dev mode: `GithubStatus`.

Backing endpoints (all `protect`, all computed on the fly from the `User` doc):

| Endpoint | Computation |
|---|---|
| `GET /analytics/dashboard-stats` | `currentStreak` (consecutive days ending **today** with count>0), `longestStreak`, `activeDays`, `consistency` |
| `GET /analytics/consistency` | active days in the last 30 ÷ 30 × 100 |
| `GET /analytics/weekly-activity` | last 7 days; `problems = min(ceil(count/4), 6)` per day (a heuristic: LeetCode counts are submissions, not problems) |
| `GET /analytics/heatmap` | 366 day series `{date,count}` from `activity` |
| `GET /analytics/problem-stats` | per-platform solved (LeetCode, CF, CodeChef, GFG; GitHub uses *contributions*), total, LeetCode difficulty split |
| `GET /analytics/contest-ratings` | current LC / CF / CodeChef ratings |
| `GET /analytics/badges` | LeetCode badges |
| `GET /analytics/platform-comparison` | table rows per platform (uses `leetcode.totalSubmissions`, a field not in the schema → always 0) |
| `GET /problems/all`, `/problems/:platform` | live fetch of recent solved problems (LeetCode: last 100 accepted, dedup, details for first 20 via GraphQL; Codeforces: all OK submissions, statement scrape for first 20). **Only LeetCode and Codeforces supported.** |

`/profile/me` returns a slimmed profile + `stats{activeDays, consistencyScore}`. `/profile/:email` (public, unauthenticated) returns heatmap, weekly trend, platform data and a leaderboard score.

### 9.3 Leaderboard, contests, resources

- **Leaderboard** `GET /leaderboard?page=` — Mongo aggregation, 20 per page, `score = leetcodeSolved + codeforcesRating/10 + githubStars*2`. Returns email/displayName/avatar/metrics. Public.
- **Contests** `GET /contests` — merges next 10 upcoming Codeforces contests (`contest.list`, phase BEFORE) and next 10 LeetCode contests (`allContests` GraphQL), sorted by start. `TopNavbar` polls hourly to show "today's contests".
- **Resources** `GET /resources` — a **hard-coded** list of 12 curated links (DSA sheets, system design, interview prep) in `services/resource.service.js`.

### 9.4 Smart Insights (AI recommendations)

`GET /recommendations/ai`:
1. Gather up to 15 recent solved problems from LeetCode and Codeforces (live fetch). 400 if none.
2. Build `userProfile` (totals, ratings, preferred languages, connected platforms).
3. `analyzeAndRecommendProblems` (`groq.service.js`): builds a prompt with topic-frequency and difficulty distribution and asks Groq `llama-3.3-70b-versatile` for JSON `{analysis, recommendations[5-7], learningPath}`. Retries 429s with exponential backoff (max 3), then drops to `llama-3.1-8b-instant`. No key / bad JSON / error → **local heuristic fallback** (`generateIntelligentRecommendations`; there is also a separate `fallback-recommendations.service.js` that is not wired in).
4. Result is cached into `user.lastRecommendations` and returned (with `analysis.aiModel` telling you whether Groq or the fallback produced it).

`GET /recommendations/learning-path` — builds a phased learning path from topic frequency / current level (mostly deterministic). `GET /recommendations/difficulty-progression?platform=` — maps rating bands to current/next level with canned suggestions.

UI: `components/pages/ai-insights-page.tsx` (tabs: Overview / Recommendations / Learning Path).

### 9.5 Collab Space: friends, notifications, pings

**Mental model:** "follow" and "friend" are collapsed. Becoming connected always makes the relationship **mutual** (both users end up in each other's `friends`, `followers` and `following`).

**Sending a request** — `POST /friends/request/:id`
- Rejects self, blocked, already friends/following, or an existing pending request in either direction.
- **Receiver `accountType === 'public'`** → instant mutual friendship (no request), notification + Stream event.
- **Receiver `private`** → creates `FriendRequest{type:'follow'}`, pushes ids into `friendRequestsSent/Received`, creates `Notification{type:'friend_request'}` and fires Stream event `friend_request_received`.

**Responding** — `accept/:senderId` runs inside a Mongo transaction (marks request accepted, makes both users mutual friends, clears the request arrays, then creates a `request_accepted` notification + Stream message). `reject/:senderId`, `cancel/:receiverId` just flip status and pull ids. `DELETE /friends/remove/:id` removes the mutual relationship (transaction).

**Reading** — `/friends/list` (populated friends), `/friends/requests` (pending incoming), `/friends/followers/:id`, `/friends/following/:id`, `/users/search?q=` (regex over username/displayName/uniqueId/email, limit 20), `/users/suggestions` (top 10 non-followed, sorted by follower count), `/users/mutual/:id`, `/users/:username`, `PATCH /users/profile`.

**Notifications** — stored in Mongo (`/notifications`, `/unread-count`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id`). UI: `NotificationBell` + `NotificationsSection`. In addition, **live toasts** arrive through Stream events (see below).

**Pings (invite a friend to a live room)** — `POST /ping/send/:id`
- Must be friends; receiver must be `onlineStatus` true (always true in practice); one pending ping per pair.
- Creates `PingRequest` (expires in 5 min), a `ping_request` Notification, and a Stream event `ping_request` on the receiver's `notifications-<userId>` channel.
- `accept/:pingId` (receiver only): ensures both users exist in Stream, creates Stream channel `room-<uuid>` (type `messaging`, both as members, acceptor is creator), creates `Room` in Mongo, marks ping accepted, notifies the sender (Notification + Stream event `ping_accepted` with `roomId`). The sender's browser, listening on its notification channel, shows a toast and navigates to `/room/<roomId>` after 1 s.
- `reject/:pingId` flips status and sends `ping_rejected`. `GET /ping/pending` lists incoming pending pings.
- A cron job marks stale pending pings `expired` every minute.

**Stream notification channel.** Each user watches `messaging:notifications-<userId>` (`StreamProvider`). Server-side helpers in `stream.service.js` send custom events (`friend_request_received`, `ping_request`, `ping_accepted`, `ping_rejected`, `user_online`, `user_offline`) or system messages. `StreamProvider` shows a toast per event.

### 9.6 Collaboration rooms: chat, canvas, video

Route `/room/[roomId]` (`app/room/[roomId]/page.tsx`, ~720 lines):
1. `GET /rooms/:roomId` (participants only → else 403) loads room + populated participants.
2. Waits for the Stream client from `StreamProvider`, gets/watches channel `room-<roomId>`, subscribes to `message.new`, typing events and the custom `room_closed` event.
3. **Chat**: native Stream channel messages with typing indicators.
4. **Canvas** (`components/room/collaborative-canvas.tsx`): an HTML canvas; every stroke is broadcast as a Stream channel event `canvas_draw` (and `canvas_clear`), and the full stroke array is persisted with `POST /rooms/:roomId/canvas`. Peers redraw from received events. On mount it loads saved strokes with `GET /rooms/:roomId/canvas`.
5. **Video** (`components/room/video-call.tsx`): `StreamVideoClient` with the same Stream API key/token; `client.call('default', callId).join({create:true})`; mic/camera controls and participant grid.
6. **Closing**: `POST /rooms/:roomId/close` (participants only) sets `active:false, closedAt`, sends `room_closed` event on the channel, deletes the Stream channel. All clients react to the event and redirect.
`GET /rooms/user/me` lists the user's active rooms (`RoomsSection`).

Stream credentials come from `GET /api/stream/token` (server upserts the Stream user, then `createToken(userId)`; returns `{token, apiKey, userId}`).

### 9.7 Mock Interview (AI service)

**UI** `/mock-interview` → `MockInterviewLayout` state machine: `setup → interview → report`.

1. **Setup** (`interview-setup.tsx`): optionally upload a PDF résumé; choose interview type (`mixed` default; others: hr, technical, dsa, react, node, cpp_java, dbms, os, cn, oops, system_design, competitive) and difficulty (beginner/intermediate/advanced).
   - `POST /api/ai-interview/upload-resume` (multer 5 MB, PDF only → temp file) → Node streams it to AI `POST /interview/upload-resume`, which saves under `ai/uploads/` and runs `analyze_resume` (PyPDF → LLM → JSON of name/skills/projects/experience/…). Response returns the AI-side `path`.
   - `POST /api/ai-interview/start` → Node validates difficulty, builds a `coding_profile` and forwards to AI `POST /interview/start?resume_path=…`. AI creates an in-memory session (stage `introduction`), analyzes the résumé if given, and returns a canned introduction question + `session_id`.
2. **Interview room** (`interview-room.tsx`): chat-style UI with an animated `AICharacter`. The question is spoken with the **browser's `speechSynthesis`**. The user answers by text, or records with `MediaRecorder` (audio/webm) → direct POST to AI `/voice/speech-to-text` → transcription → auto-submit.
   - `POST /api/ai-interview/answer {session_id, answer}` → AI: (first answer) LLM extracts the candidate's first name → `AnswerEvaluator` scores 0–10 on 5 dimensions via LLM JSON (with a default-5.0 fallback) → store Q&A → LLM writes a ≤15-word empathetic reaction (`response_to_answer`) → `DifficultyAdapter` (avg of last 3 scores >8.5 ⇒ up, <4.0 ⇒ down) → `InterviewConductor.generate_question` builds a long prompt from stage, résumé skills/projects, coding profile, last 5 questions, difficulty and (technical stage only) question-bank samples → recompute session scores → return `{evaluation, response_to_answer, next_question, stage, difficulty, overall_score, questions_answered}`.
   - Optional `POST /followup`, `POST /stop-speech/:id`, `POST /voice-answer/:id` (full audio round-trip; not used by this UI), `POST /text-to-speech` (gTTS mp3 stream; not used by this UI).
3. **End**: `POST /api/ai-interview/end/:id` → AI `ReportGenerator`: LLM JSON with scores, strengths/weaknesses, topics to improve, missed concepts, recommended LeetCode problems/resources, hiring recommendation, detailed feedback (default fallback if JSON parse fails) + duration and counts. `InterviewReport` renders it.

Interview **stages** exist (`introduction → resume_discussion → technical_round → behavioral_round → closing`) and are advanced only by `POST /interview/advance-stage/:id` — see §16 for why that never happens from the UI.

---

## 10. Server reference (`server/`)

### Request lifecycle
`server.js` → `app.js`: `cors(corsOptions)` → `express.json()` → router mounted at `/api/<area>` → `protect` (per-route) → controller → Mongoose / external service. There is **no global error handler, no request logging middleware, no rate limiting, no input-validation library** (a few hand-written helpers in `utils/validation.util.js` — `validateUsername/Bio/Url/sanitizeSearchQuery` — are defined but not used by `updateProfile`).

### Controllers → responsibilities
| File | Responsibility |
|---|---|
| `auth.controller` | signup, login, googleAuth, getProfile (`/auth/profile`) |
| `leetcode/codeforces/codechef/gfg/github.controller` | connect (+ verify/disconnect/refresh/status for LC/GH), solved-problem lists |
| `sync.controller` | per-platform + all-platform sync |
| `analytics.controller` | dashboard stats, streaks, heatmap, weekly trend, comparison, problem stats, ratings, badges |
| `profile.controller` | `me` and public-by-email |
| `leaderboard.controller` | aggregation pipeline |
| `contest.controller`, `resource.controller` | thin wrappers over services |
| `problems.controller` | aggregate recent solved problems |
| `recommendations.controller` | Groq recommendations, learning path, difficulty progression |
| `users.controller` | search, suggestions, mutual friends, profile update, by-username |
| `friends.controller` | friend graph |
| `notifications.controller` | CRUD on notifications |
| `ping.controller` | ping lifecycle + room creation |
| `rooms.controller` | room fetch/list/close, canvas save/load |
| `stream.controller` | Stream token + user init |
| `ai-interview.controller` | proxy to the AI service (+ multer temp-file cleanup) |

### Services
`leetcode.service` (GraphQL: full profile, recent AC list, problem details), `codeforces.service` (REST, plus statement scraping via regex), `github.service` (REST+GraphQL, OAuth code exchange), `codechefService` / `gfgService` (Puppeteer), `contest.service`, `resource.service` (static), `groq.service` (prompting, retries, fallback; ~575 lines), `fallback-recommendations.service` (unused), `stream.service` (Stream Chat wrapper: users, channels, tokens, events), `gfgService-new.js` and `gfgProblems.service.js` (the latter is empty) are leftovers.

### Utils
`activity.util.updateActivity(user,count)` (adds to today), `consistency.util` (30-day ratio), `heatmap.util` (366-day fill), `weeklyTrend.util` (7-day heuristic), `validation.util`.

---

## 11. AI service reference (`ai/`)

`app.py` defines `app = FastAPI(...)`, CORS `*`, `GET /` and `GET /health` **before** importing routers (so health checks pass during slow imports), then mounts `interview_api.router` (prefix `/interview`) and `voice_api.router` (prefix `/voice`). `routes/resume.py` is **not mounted**.

### Module map
| Module | Role |
|---|---|
| `models/interview_session.py` | Pydantic: `InterviewType`, `DifficultyLevel`, `InterviewStage`, `CodingProfile`, `QuestionAnswer`, `InterviewSession` |
| `services/session_manager.py` | **in-process dict** `sessions`; create/get/update/delete; `advance_stage` |
| `services/llm.py` | one shared `ChatGroq(model="llama-3.1-8b-instant")` |
| `services/interview_conductor.py` | introduction text, name extraction, reaction text, next-question prompt, follow-up prompt, stage instructions, interview-type → dataset domain map |
| `services/answer_evaluator.py` | LLM scoring → JSON (regex-extracted), session score aggregation (technical = overall; communication = 0.9×; confidence = 0.95× — these are **derived multipliers, not separately measured**) |
| `services/difficulty_adapter.py` | rolling-3 average rules; per-level prompt blurbs |
| `services/report_generator.py` | final JSON report (+ fallback) |
| `services/resume_analyzer.py`, `resumeParser.py` | PyPDF loader → LLM JSON extraction |
| `services/question_bank_loader.py` | per-domain Chroma store built from `datasets/<domain>.txt`; `get_questions(domain, difficulty, k)` |
| `services/embeddings.py`, `vectorstore.py`, `retriever.py`, `chunker.py`, `load_questions.py`, `questions_generator.py`, `evaluator.py` | older/legacy helpers; mostly unused (`retriever.py` opens a Chroma store at import time) |
| `services/speech_service.py` | optional Whisper STT (`base`) + gTTS TTS; flags disable themselves if packages are missing |
| `rebuild_vector_db.py` | wipes `vector_db/` and rebuilds all 9 domain stores |
| `datasets/*.txt` | each a JSON array of `{domain, topic, difficulty, source, question, expected_points[]}`; ~4k entries per domain, 56k for DSA |

### Endpoints
| Method & path | Purpose |
|---|---|
| `POST /interview/upload-resume` | save PDF to `uploads/`, analyze |
| `POST /interview/start?resume_path=` | create session, return intro |
| `POST /interview/answer` | evaluate + next question |
| `POST /interview/followup` | follow-up on last answer |
| `POST /interview/end/{id}` | report |
| `GET /interview/session/{id}` | status |
| `POST /interview/advance-stage/{id}` | move to next stage and ask a question for it |
| `POST /voice/speech-to-text` | Whisper transcription |
| `POST /voice/text-to-speech` | gTTS → mp3 |
| `POST /voice/voice-answer/{id}` | STT + evaluate + next question + TTS, returns `audio_url` |
| `GET /voice/audio/{filename}` | serve mp3 from `/tmp/` |
| `POST /voice/stop-speech/{id}` | no-op acknowledgement |

Detailed per-file docs already exist in `ai/docs/` (`FILE_BY_FILE*.md`, `ROUTES.md`, `VECTOR_DB_GUIDE.md`, …).

---

## 12. UI reference (`ui/`)

### Routes (`app/`)
| Path | Notes |
|---|---|
| `/` | `app/page.tsx` — tab-switched shell (dashboard, profile, activity, contests, resources, discuss, ai-insights; analytics/settings are placeholders) |
| `/profile`, `/activity`, `/contests`, `/resources`, `/ai-insights` | standalone route versions that wrap the same page components (≈50 lines each) |
| `/social` | Collab Space: tabs Search / Friends / Notifications / Pings / Rooms + `BackendStatusIndicator` (pings `/auth/check` every 30 s, shows a banner only when offline) |
| `/room/[roomId]` | live room (chat + canvas + video) |
| `/mock-interview` | AI interview |
| `/settings` | "Coming soon" placeholder |
| `/auth/login`, `/auth/signup`, `/auth/layout.tsx` | email + Google auth (use `lib/auth.ts`) |
| `/auth/github/callback` (page) + `/api/auth/callback/github` (route handler) | GitHub OAuth landing |
| `/debug` | dumps heatmap + dashboard stats for the signed-in user |

Navigation note: the sidebar mixes in-page tab switching (`onTabChange`) with real links (`href`) for `/social` and `/mock-interview`; those pages re-implement a tab→route map so the sidebar still works.

### Providers (`app/layout.tsx`)
`ThemeProvider (dark default, class strategy) → AuthProvider → StreamProvider → children + <Toaster/>` + Vercel Analytics. `StatsModeProvider` is applied per-page (dashboard/settings).

### Contexts
- `auth-context.tsx` — `user, loading, login, logout, refreshUser, handleTokenExpiration`.
- `stream-context.tsx` — on `user` change: `GET /stream/token` → `StreamChat.getInstance(apiKey).connectUser({id}, token)` → watches `notifications-<id>` → toast handlers → exposes `client, notificationChannel, isConnected, joinRoom, leaveRoom`.
- `stats-mode-context.tsx` — `'dsa' | 'dev'`.

### API layer (`lib/`)
- `api.ts` (≈830 lines) — all typed endpoint wrappers grouped by area: analytics, leaderboard, problems, contests, resources, profile, platform connect, recommendations, sync, users, friends, notifications, ping, rooms, Stream.
- `auth.ts` — axios instance + `signupWithEmail`, `loginWithEmail`, `signInWithGoogle`, `getUserProfile`, `logout`, `isAuthenticated`.
- `api-client.ts` — a second axios instance (used by `BackendStatusIndicator`) with a toast on 401.
- `ai-interview-api.ts` — separate axios instance rooted at `/api/ai-interview`.
- `platforms.ts` — an older set of connect helpers (includes a `/github/connect` call to an endpoint that no longer exists).
- `firebase.ts` — client-only Firebase init + `GoogleAuthProvider`.

### Component folders
- `components/ui/*` — shadcn primitives (accordion … tooltip); don't hand-edit unless customizing.
- `components/dashboard/*` — charts, heatmap, platform cards, widgets, badges, profile summary (sync button + progress).
- `components/pages/*` — page bodies (activity, ai-insights, contests, profile, resources, discussion) and `mock-interview/*` (layout, setup, room, report, ai-character).
- `components/social/*` — user search, friends list, notifications, pings, rooms, notification bell.
- `components/room/*` — canvas, video call.
- `components/profile/*` — profile completion modal, edit dialog.
- Top-level: `app-sidebar`, `top-navbar` (search, contest ticker, user menu), `connect-platforms-modal` (LC/CF/CodeChef/GFG connect UI incl. the LC verify step), `connect-github-modal` (OAuth launcher), `github-status`, `auth/auth-guard`, `backend-status-indicator`, `theme-provider`.
- `discussion-page.tsx` ("discuss" tab) is a **local-state mock chat** — it does not use Stream or the server.

### 12.1 Design system & styling

**Stack:** Tailwind CSS **v4, CSS-first** (no `tailwind.config.*`; theme lives in CSS via `@theme inline`), PostCSS plugin `@tailwindcss/postcss`, `tw-animate-css` for `animate-in/fade-in/slide-in-*` utilities, shadcn/ui (`components.json`: style **new-york**, base colour *neutral*, `cssVariables: true`, icon library **lucide**, aliases `@/components`, `@/lib/utils`, `@/hooks`). Class merging via `cn()` = `twMerge(clsx(...))` in `lib/utils.ts`. Variants use `class-variance-authority`. Path alias `@/*` → project root (`tsconfig.json`).

**Which CSS file is live:** only `app/globals.css` (imported by `app/layout.tsx`). `styles/globals.css` is the untouched shadcn default (neutral grey theme) and is **not imported anywhere** — safe to delete.

**Theme tokens (`app/globals.css`)** — semantic variables in the **OKLCH** colour space, one set for `:root` (light) and one for `.dark`, exposed to Tailwind through `@theme inline` as `--color-*`:

| Group | Tokens |
|---|---|
| Surfaces | `background`, `foreground`, `card`, `popover` (+ `-foreground`), `sidebar*` (8 tokens) |
| Intent | `primary`, `secondary`, `muted`, `accent`, `destructive` (+ `-foreground`), `success`, `warning` |
| Chrome | `border`, `input`, `ring` |
| Data viz | `chart-1` … `chart-5` |
| Shape | `--radius: 0.75rem` → `radius-sm/md/lg/xl` (`-4px`, `-2px`, `0`, `+4px`) |

Brand look: a single **blue-violet hue (OKLCH hue 260)** for neutrals and `primary` (light `0.55 0.22 260`, dark `0.65 0.2 260`); `chart-2` green (hue 165), `chart-3` amber (80), `chart-4` magenta (330), `chart-5` orange (30). Dark surfaces are very dark blue-grey (`background oklch(0.13 0.01 260)`).

**Dark mode:** `next-themes` (`attribute="class"`, `defaultTheme="dark"`, `enableSystem`, `disableTransitionOnChange`) toggles the `dark` class; Tailwind uses `@custom-variant dark (&:is(.dark *))`. The toggle is a Sun/Moon dropdown (Light / Dark / System) in `TopNavbar`. ~71 explicit `dark:` variants exist for places that use raw palette colours.

**Typography:** no `next/font` and no web fonts — `--font-sans` is the **system UI stack** (`ui-sans-serif, system-ui, Segoe UI, Roboto, …`) and `--font-mono` the system mono stack. Headings use Tailwind weights (`font-bold`, `tracking-tight`); page titles are `text-2xl font-bold`, helper text `text-sm text-muted-foreground`. Logo wordmark = `Code` in `text-primary` + `Orbit` in `text-foreground`.

**Custom animations** (keyframes in `globals.css`): `shimmer`, `pulse-glow`, `count-up`, `fade-in-up`, `slide-in-left` (+ `.animate-*` classes). `animate-slide-in-left` is used for sidebar labels; I did not trace where the others are used. Other motion: `AnimatedNumber`/`useCounterAnimation` (2 s ease count-up, optional K/M formatting), framer-motion in `AICharacter`, `tw-animate-css` classes (`animate-in fade-in slide-in-from-bottom-2`) for chat bubbles, `animate-pulse`/`animate-spin` for status and loaders. Custom thin scrollbars (6 px) are defined for WebKit.

**Layout patterns**
- *App shell* (dashboard, profile, settings, mock-interview, social): `flex min-h-screen` → `AppSidebar` (sticky, `h-screen`, **240 px / 68 px collapsed**, tooltips when collapsed) + column with sticky `TopNavbar` (`h-16`, `bg-background/80 backdrop-blur-xl`) and a scrolling `<main>` containing `mx-auto max-w-7xl p-6 lg:p-8`.
- *Sidebar items*: active = `bg-primary/10 text-primary` with a dot; inactive = muted with `hover:bg-accent`. Items with `href` render as `<Link>` and are never "active" (see §16).
- *Cards*: shadcn `Card` (`bg-card`, `border-border`, rounded `radius-lg`), hover gradient overlays on platform cards (`bg-gradient-to-br from-<tone>/10 to-<tone>/5` fading in on hover).
- *Dashboard grids*: `grid gap-4 lg:grid-cols-2` (charts), `lg:grid-cols-3` (weekly / consistency / comparison).
- *Room page*: full-height flex; fixed-width **chat column `w-80`** on the left, canvas in the centre, video/participants column on the right; only the message list scrolls. Close button is `destructive`.
- *Auth pages*: two-column split — left half (`hidden lg:flex lg:w-1/2`) is marketing (logo, headline gradient text, 2×2 feature cards, rotating orbit rings); right half is the form. Background has `from-background via-background to-primary/5` plus floating translucent circles. Uses `bg-clip-text text-transparent` gradient headings.
- *Contest alert banner* (TopNavbar): orange→red gradient strip with `animate-pulse` icon, shown when a contest starts today; dismissible.

**Data-visualisation styling** (`components/dashboard/charts.tsx`, `activity-heatmap.tsx`): Recharts `BarChart` (platform totals, weekly activity), `PieChart` donut (difficulty split), `LineChart` (contest ratings). Series colours come from the **server** as OKLCH strings (e.g. `oklch(0.7 0.18 165)` for Easy, `0.75 0.15 80` Medium, `0.6 0.22 330` Hard) or from the token palette. The heatmap is a CSS grid of cells coloured by 5 intensity buckets using `bg-chart-1` at `/30 /50 /70 /100` opacity (0, 1–2, 3–5, 6–8, 9+ contributions). Contest rating tiers map ratings to Codeforces-style colours (hard-coded hex: red `#FF0000` ≥2500 … light-green `#77FF77` ≥1200) with star counts and tier names.

**Icons & imagery:** `lucide-react` everywhere (57 importing files). `public/` has the CodeOrbit logo (`iconLogo.png`, `icon.svg`, light/dark 32 px favicons chosen via `prefers-color-scheme`, `apple-icon.png`) and platform logos (LeetCode, Codeforces, CodeChef). `next/image` runs with `unoptimized: true`. `metadata.generator` is still `v0.app` and `themeColor` is `#1a1a2e` — the project was scaffolded with **v0 (Vercel)**, which explains the shadcn/new-york + OKLCH setup.

**Component library notes**
- `components/ui/*` is the stock shadcn set (~55 primitives). Custom additions: `loading.tsx` (spinner + text), `animated-number.tsx`, `icons.tsx`, `use-toast.ts`.
- **Two toast systems** coexist: the Radix `toast`/`toaster`/`use-toast` (used by 15 files, mounted in `layout.tsx`) and `sonner` (`ui/sonner.tsx` exists but nothing mounts it).
- `ui/chart.tsx` (shadcn `ChartContainer`) is unused — charts use raw Recharts with inline colours.
- `ui/sidebar.tsx` (shadcn sidebar + `use-mobile`) is also unused; the app has its own `AppSidebar`.
- Video call imports Stream's stylesheet (`@stream-io/video-react-sdk/dist/css/styles.css`) inside `video-call.tsx`; chat UI is hand-built (no `stream-chat-react` CSS).

**Styling conventions in practice**
- Token classes dominate: `text-muted-foreground` ×~400, `border-border` ×~110, `text-primary` ×~89, `bg-primary` ×~69, `bg-card` ×~63, `bg-accent` ×~63.
- Raw Tailwind palette colours still appear ~190 times (green 46, blue 45, orange 29, gray 21, red 19, yellow 17, purple 11), mostly for status badges, difficulty chips, platform branding and the room/video UI (e.g. `from-blue-500 to-purple-500` avatar fallbacks).
- Responsive utilities are used moderately: `sm:` ×29, `md:` ×33, `lg:` ×31, **no `xl:`/`2xl:`** — content is capped by `max-w-7xl`.

---

## 13. Full API route table

Base: `http://localhost:5000/api`. 🔒 = requires `Authorization: Bearer <token>`.

**Auth** `/auth` — `POST /signup`, `POST /login`, `POST /google`, 🔒`GET /profile`, `GET /check`
**LeetCode** `/leetcode` — 🔒`POST /connect`, 🔒`POST /verify`, 🔒`GET /problems`
**Codeforces** `/codeforces` — 🔒`POST /connect`, 🔒`GET /problems`
**GitHub** `/github` — 🔒`GET /status`, 🔒`POST /oauth/callback`, 🔒`POST /disconnect`, 🔒`POST /refresh`
**CodeChef** `/codechef` — 🔒`POST /connect` · **GFG** `/gfg` — 🔒`POST /connect`
**Sync** `/sync` — 🔒`POST /all|/leetcode|/codeforces|/github|/codechef|/gfg`
**Problems** `/problems` — 🔒`GET /all`, 🔒`GET /:platform` (leetcode | codeforces)
**Analytics** `/analytics` — 🔒`GET /dashboard-stats|/problem-stats|/contest-ratings|/badges|/consistency|/weekly-activity|/heatmap|/platform-comparison`
**Profile** `/profile` — 🔒`GET /me`, `GET /:email` (public)
**Leaderboard** `/leaderboard` — `GET /?page=` (public) · **Contests** `/contests` — `GET /` (public) · **Resources** `/resources` — `GET /` (public)
**Recommendations** `/recommendations` — 🔒`GET /ai|/learning-path|/difficulty-progression?platform=`
**Users** `/users` — 🔒`GET /search?q=`, `/suggestions`, `/mutual/:id`, `/:username`; 🔒`PATCH /profile`
**Friends** `/friends` — 🔒`POST /request/:id|/cancel/:id|/accept/:id|/reject/:id`, `DELETE /remove/:id`, `GET /list|/requests|/followers/:id|/following/:id`
**Notifications** `/notifications` — 🔒`GET /`, `GET /unread-count`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id`
**Ping** `/ping` — 🔒`POST /send/:id|/accept/:id|/reject/:id`, `GET /pending`
**Rooms** `/rooms` — 🔒`GET /user/me`, `GET /:roomId`, `POST /:roomId/close`, `POST /:roomId/canvas`, `GET /:roomId/canvas`
**Stream** `/stream` — 🔒`GET /token`, 🔒`POST /initialize`
**AI interview** `/ai-interview` (all 🔒) — `POST /start`, `POST /upload-resume` (multipart `resume`), `POST /answer`, `POST /followup`, `POST /end/:session_id`, `GET /session/:session_id`, `POST /advance-stage/:session_id`, `POST /voice-answer/:session_id` (multipart `audio`), `POST /stop-speech/:session_id`, `POST /text-to-speech`

Existing prose docs: `server/Docs/API_DOCUMENTATION.md`, `API_ENDPOINTS.md`, `ui/Docs/API_ENDPOINTS.md` (may lag the code).

---

## 14. Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `jobs/updateStats.job.js` | `0 2 * * *` (02:00 server time) | For **every** user: refresh Codeforces and GitHub stats, then `updateActivity(user, cfSolved + githubStars)`, set `lastSyncedAt`. Errors per user are swallowed. See §16 — GitHub refresh throws without a token; and the activity value it adds is a total, not a daily delta. |
| `jobs/expirePings.job.js` | every minute | `PingRequest.updateMany({status:'pending', expiresAt<now}, {status:'expired'})` |

Cron runs inside the web process (so it duplicates if you run multiple instances).

---

## 15. Deployment

- **UI** — Vercel (CORS allow-list names `codeorbit-sage.vercel.app` and two preview URLs). Set the `NEXT_PUBLIC_*` vars; update `NEXT_PUBLIC_FRONTEND_URL` and the GitHub OAuth callback to the production URL.
- **Server** — a commented-out URL in `ui/.env.local` points to a Render service (`codeorbit-backend-…onrender.com`). Needs a Chromium-capable image for Puppeteer (or remove CodeChef/GFG scraping).
- **AI** — Render blueprint `ai/render.yaml`: Python 3.11, `uvicorn app:app --host 0.0.0.0 --port $PORT --timeout-keep-alive 0`, health check `/health`, 1 GB disk mounted at `vector_db`. It declares `buildCommand: bash build.sh`, but **`build.sh` does not exist** in the repo. `start.sh` is an equivalent bash launcher.
- After deploying AI, set `AI_SERVICE_URL` on the server.

---

## 16. Known issues & gotchas

Ordered roughly by impact. All derived from reading the code; not all were reproduced by running it.

### Security
1. **Public profile leaks GitHub OAuth tokens.** `GET /api/profile/:email` is unauthenticated and returns `platforms.github: user.github` — that sub-document contains `accessToken` (scopes `read:user,repo`). Anyone who knows an email can read it. Also lets anyone enumerate emails. Fix: project/omit `accessToken`, ideally require auth or use username.
2. **Leaderboard is public and returns user emails.**
3. **Secrets handling:** GitHub tokens stored plaintext in Mongo; `JWT_SECRET` in the dev `.env` is a trivially guessable string; the AI service CORS is `*`; no rate limiting anywhere (LLM endpoints are an easy bill-burner).
4. `searchUsers` interpolates the raw query into `$regex` (`sanitizeSearchQuery` exists but isn't used) → regex-DoS risk and user-controlled patterns.
5. `updateProfile` accepts `accountType`, `socialLinks`, images with no validation (the validation helpers are unused).

### Functional bugs
6. **Google users get logged out after ~1 hour.** `/auth/google` returns the Firebase **ID token** as the app token; it expires in 1 h and the UI never refreshes it, so the next call 401s and the interceptor wipes the session.
7. **GitHub sync is broken without a stored token.** `fetchGithubProfile` throws if no `accessToken` is passed, but `syncGithub`, `syncAllPlatforms` and the nightly cron call it with only a username. Those paths fail (silently in cron/sync-all). `lib/api.ts`/`platforms.ts` also call `POST /github/connect`, which does not exist on the server.
8. **Public-account friend add returns 500 *after* creating the friendship.** It creates a `Notification` of type `new_friend`, which is not in the schema enum → validation error. Same block also pushes the *receiver's* id into the *sender's* `followers` (should be the receiver's followers).
9. **Canvas never reloads saved strokes.** Server returns `{ canvasData: { strokes } }` but the component reads `data.strokes`.
10. **Mock-interview stages never advance from the UI.** The UI helper calls `/advance/:id`, the server route is `/advance-stage/:id` (404), and nothing calls it automatically anyway — so sessions stay in `introduction`, meaning the résumé-discussion, technical (question-bank) and behavioral stages are never reached. Related (by reading, unverified): `QuestionBankLoader` loads each dataset with `TextLoader` as **one** giant document, so `json.loads(doc.page_content)` yields a *list*, and `InterviewConductor` then calls `q.get(...)` on it — likely `AttributeError` the first time the technical stage runs. `Chroma.from_documents(..., persist_directory=…)` is also re-run on every process start, appending duplicates to the persisted store.
11. **Interview personalization is dead.** `startInterview` reads `req.user.leetcodeStats`, `req.user.analytics…` but `req.user` is just an ObjectId, so `coding_profile` is always empty/null.
12. **Voice features need extra packages.** `openai-whisper` and `gtts` aren't in `requirements.txt`, so STT/TTS are disabled and `/voice/speech-to-text` errors. The UI relies on that STT endpoint for the mic button (called directly on the AI service, bypassing the Node proxy). `GET /voice/audio/*` reads from `/tmp/`, which doesn't exist on Windows (and `tempfile.mktemp` paths differ anyway).
13. **Interview sessions are in-memory** (`SessionManager.sessions`): lost on restart/redeploy, not shared between workers, never expired. `ai/interview_sessions/` is empty/unused. Nothing about a finished interview is saved to Mongo, so there is no interview history.
14. **Presence is fake.** `onlineStatus` defaults true and is never changed; `socketId`/`lastSeen` unused; `notifyUserOnline/Offline` are never called. The ping "user is offline" check can't trigger.
15. **Activity data is inconsistent.** Connect/verify adds counts (double counts on re-verify); sync uses `max`; the nightly cron adds *totals* (CF solved + GitHub stars) as "today's activity", which inflates the heatmap/streak. `platform-comparison` reads a nonexistent `leetcode.totalSubmissions`. `uniqueId` is searchable but never generated.
16. **`ping_request` toast reads the wrong fields** — the server nests data under `event.data.pingRequest`, the UI reads `event.data.displayName`, so the toast shows `undefined`.
17. **Stage/score semantics:** `technical_score`, `communication_score`, `confidence_score` are all scaled copies of the same average, not independent measurements.
18. **`ui/.env.local` has a malformed line** (`i ahve thisNEXT_PUBLIC_API_URL=…`) → the var is unset (works only because of code defaults).

### Operational
19. **CodeChef/GFG scraping** via Puppeteer: slow (3–8 s), memory heavy, selector/regex fragile, one browser per request, no timeout guard around `browser.close()` on some error paths.
20. **No pagination/caching** on live platform calls (`/problems/*`, `/recommendations/*` hit LeetCode/Codeforces each time; Codeforces `user.status` returns the entire history).
21. **Transactions** in friends accept/remove require a replica set.
22. **Cron runs in the web process** (duplicates under horizontal scaling) and the stats job iterates all users sequentially.
23. `typescript.ignoreBuildErrors: true` hides type errors in production builds. Two axios instances (`auth.ts`, `api-client.ts`) duplicate interceptor logic; `auth-context.tsx` contains a large commented-out older copy; `middleware/auth.middleware.js` has a commented-out older copy at the top.
24. `server/uploads/` and `ai/uploads/` hold transient files; `server/.gitignore` doesn't ignore `uploads/`.
25. `render.yaml` references a missing `build.sh`.
26. Mongoose duplicate-index warnings on startup (`username`, `uniqueId`, `roomId`) — cosmetic; remove the redundant `schema.index()` lines.

### UI / styling issues
27. **Charts are dark-theme-only.** `charts.tsx` hard-codes dark OKLCH values for tooltip background/text, grid lines, axis ticks and cursor fill (`oklch(0.17 0.01 260)`, `oklch(0.25 0.015 260)`, …) instead of CSS variables, so in light mode the grid lines are heavy/dark and the tooltip is a dark box. Use `var(--border)`, `var(--muted-foreground)`, `var(--card)`.
28. **Undefined animation classes.** `login` and `signup` use `animate-spin-slow` and `animate-spin-slower` (the rotating orbit rings), but neither is defined in `globals.css` or by `tw-animate-css` → the rings don't rotate. Add keyframes/utilities or use `animate-[spin_8s_linear_infinite]`.
29. **Not really mobile-friendly.** `AppSidebar` is always rendered at 240/68 px with no `hidden md:flex` or drawer, so on a phone it eats most of the viewport; the shadcn mobile sidebar + `use-mobile` hook are present but unused. The room page's three fixed-width columns (`w-80` chat etc.) have the same problem. No `xl:`/`2xl:` breakpoints.
30. **Active nav state is wrong for route-based items.** Items with `href` (Collab Space, Mock Interview) are rendered as `<Link>` that never gets the active style in the shell on `/`; the standalone pages pass `activeTab` but the Link branch ignores `isActive`.
31. **Design-token drift.** ~190 raw palette colours bypass the theme (so a rebrand won't reach them), CSS has two files (`styles/globals.css` unused), two toast systems, and several unused shadcn modules (`chart`, `sidebar`, `sonner`). No `next/font` — typography depends on the user's OS font.
32. `tsconfig.json` ends with a pasted prose comment (`// Now listen i want to prepare my project for an interviewer…`). It's valid JSONC so it doesn't break builds, but it should be removed. `metadata.generator` still says `v0.app`.

---

## 17. Where to change what

| I want to… | Look at |
|---|---|
| Add a coding platform | `User.js` (new sub-schema) → `services/<platform>.service.js` → `controllers/<platform>.controller.js` + route in `app.js` → add to `sync.controller` (all + single) → `analytics.controller` (problem-stats, comparison) → UI `connect-platforms-modal.tsx`, `lib/api.ts`, `dashboard/platform-stats.tsx` |
| Change leaderboard scoring | `controllers/leaderboard.controller.js` (pipeline) and `profile.controller.getPublicProfile` (duplicate formula) |
| Tune AI recommendations | `services/groq.service.js` (`createRecommendationPrompt`, model names, retry logic, fallback) |
| Add an interview type | `ai/models/interview_session.py` (`InterviewType`), `InterviewConductor._get_domain_from_interview_type`, add `datasets/<x>.txt` + `DATASET_MAPPING`, rebuild with `python rebuild_vector_db.py`, add option in `interview-setup.tsx` |
| Change interviewer behavior/tone | prompts in `ai/services/interview_conductor.py`, `answer_evaluator.py`, `report_generator.py`; model in `services/llm.py` |
| Persist interview history | replace `SessionManager` dict with Mongo/Redis; have `/end` store the report; expose a history endpoint via Node |
| Add a new real-time event | emit via `stream.service.js` (`channel.sendEvent`) → handle in `contexts/stream-context.tsx` (notification channel) or in `app/room/[roomId]/page.tsx` (room channel) |
| Change friend/follow semantics | `controllers/friends.controller.js` (+ `User` arrays); note UI sections in `components/social/*` assume mutual friendship |
| Allow a new frontend origin | `corsOptions.origin` in `server/app.js` |
| Add a new API call in the UI | wrapper in `ui/lib/api.ts` (typed), reuse the `auth.ts` axios instance |
| Add an authenticated page | create `app/<route>/page.tsx`, wrap in `AuthGuard`, add sidebar entry in `components/app-sidebar.tsx` and the tab→route map used by `/social`, `/settings`, `/mock-interview` |
