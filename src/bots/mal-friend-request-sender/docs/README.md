# MAL Friend Request Sender (`mal-friend-request-sender`)

Sends a MyAnimeList friend request to every friend of a given MAL user. Drives Chrome via Puppeteer (remote debugging on a shared profile), confirms the active MAL account on entry, then walks the target user's friends list and clicks **Add Friend** where possible.

**Bot id:** `mal-friend-request-sender` — `BOT_ID_MAL` in `src/config/index.ts`.

**Enable/disable:** `MAL_FRIEND_REQUEST_SENDER_ENABLED` env key. Defaults to enabled. See [Module enabling](../../../../AGENTS.md#module-enabling).

---

## How it works

This bot is built with `createBotService` (`@/services/bot-builder`) using a typed workflow definition. Two workflows run in sequence:

### 1. Enter workflow (`malEnterWorkflow`) — runs before the menu

```text
detect-account     → read a.header-profile-button from the live page
                     (null = not logged in)

already-logged-in  → show "Already logged in as {username}."
                     → prompt: Continue as {username} | Log out and use another account
                     → if logout: submit logout.php form, clear account

needs-login        → loginToMal: ask "Log in to MAL automatically with username and password?"
                       yes → auto-fill credentials via enterText, submit
                       no  → prompt for manual login, wait for confirmation
                     → re-read page to confirm login succeeded
                     → show "Logged in as {username}." or warn if unconfirmed
```

Login is detected **from the live page** — no database flag. The Chrome user-data dir persists the session across restarts.

### 2. Send bulk requests workflow (`sendBulkWorkflow`) — the menu action

```text
target-username    → prompt for MAL username to scrape
                     (defaults to last used username from SQLite)

fetch-friends      → GET /profile/{username}/friends, collect profile links

send-requests      → for each profile link:
                       visit page → read #request button state
                       → send request / skip (already friends, pending, or disabled)
                       → wait betweenProfiles (5s) between visits
                       → wait afterRequest (25s) after each sent request
```

---

## Menu actions

| Action | What it does |
|--------|--------------|
| Send bulk friend requests | Full send-requests workflow above |

No scheduler — run-on-demand only.

---

## Storage

Single SQLite: `src/data/mal-friend-request-sender/mal-friend-request-sender.db` (under `DATABASE_URL`).

Schema: `storage/schema.ts` — table `bot_state` (singleton row):

| Column | Purpose |
|--------|---------|
| `last_username` | Default for the "whose friends to scrape" prompt (`lastScrapedUsername`) |

Login state is **not** stored — detected from the live page each time.

---

## Layout

```text
mal-friend-request-sender/
├── index.ts                  re-exports malFriendRequestBotModule
├── constants.ts              MalConfig, MalSelectors, MalDelays, URL helpers
├── core/
│   ├── entry.ts              BotModule + BotDefinition (createBotService)
│   └── workflow.ts           MalState, malEnterWorkflow, sendBulkWorkflow
├── functions/
│   ├── malLogin.ts           getLoggedInMalUsername, loginToMal, logOutOfMal,
│   │                         resolveMalTargetUsername
│   └── malFriendRequestHandler.ts  fetchMalFriendProfileLinks, processMalFriendProfile
├── storage/
│   ├── db.ts                 openMalDatabase, getMalDbHandle, bootstrapMalStorage, closeMalDatabase
│   ├── schema.ts             initSchema (bot_state table)
│   └── stateStore.ts         loadMalBotState, saveMalBotState, MalBotState
└── docs/README.md
```

> This bot is the reference implementation for **workflow-based bots** using `createBotService` from `@/services/bot-builder`.

---

## Selectors and delays

`constants.ts` — update `MalSelectors` if MAL changes its markup. `MalDelays` controls rate-limit pacing (tuned from manual testing).

---

## Shared tools

- **Browser** — `@/tools/browser` (same Chrome profile as Code Redeemer; separate site cookies)

---

## Credentials

MAL username/password are **prompted at runtime** when auto-login is chosen — never stored in `.env` or the database. The Chrome user-data dir persists the logged-in cookie session. To force a fresh login, close the Chrome window and run the bot again.

---

## Configuration

Global env: `CHROME_EXECUTABLE_PATH`, `CHROME_USER_DATA_DIR`, `CHROME_DEBUG_PORT`, `HEADLESS`.

`HEADLESS=true` requires a prior saved session or successful auto-login — manual login needs a visible browser window.
