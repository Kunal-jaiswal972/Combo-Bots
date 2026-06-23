# MAL Friend Request Sender (`mal-friend-request-sender`)

Sends a MyAnimeList friend request to **every friend** of a given MAL user. Drives Chrome via Puppeteer (remote debugging on a dedicated profile), logs into MAL once, then walks the target user's friends list and clicks **Add Friend** where possible.

## Entry point

`index.ts` — registers `malFriendRequestBotModule`. On `start()` opens SQLite; on `stop()` closes the DB handle.

**Bot id:** `mal-friend-request-sender` (`config/constants.ts`).

**Enable/disable:** gated by the `<ID>_ENABLED` convention → **`MAL_FRIEND_REQUEST_SENDER_ENABLED`**. Defaults to enabled (`isModuleEnabled(BOT_ID, true)`); set the key to `false` in `.env` to hide it from the bot menu. See [Module enabling](../../../../AGENTS.md#module-enabling) for the full convention.

## How a run works

```text
CLI menu → Run
  → runFriendRequestFlow
       1. launchChromeSession — shared Chrome debug profile (@/tools/browser)
       2. ensureMalLoggedIn — saved flag → existing session → auto-login prompt → manual login
       3. resolveTargetUsername — whose friends list to scrape (remembers last choice)
       4. fetchFriendProfileLinks — scrape /profile/{user}/friends
       5. for each friend profile:
            visit profile → read #request button state
            → send request / skip (already friends, pending, disabled)
            → pace: 5s between profiles, 25s after each sent request
       6. closeBrowser
```

Login session persists in the Chrome user-data dir (`CHROME_USER_DATA_DIR`). Login flag and last target username persist in SQLite.

## Menu actions

| Action | What it does |
|--------|----------------|
| Run | Full flow above (login if needed, then bulk friend requests) |

No scheduler — run-on-demand only.

## Storage

Single SQLite file: `src/data/mal-friend-request-sender.db` (under `DATABASE_URL`).

Schema: `controllers/storage/schema.ts` — table `bot_state` (singleton row):

| Column | Purpose |
|--------|---------|
| `is_logged_in` | Skip login step on future runs |
| `last_username` | Default for “whose friends to request” prompt |

## Layout

```text
mal-friend-request-sender/
├── index.ts              BotModule + lifecycle
├── config/               Selectors, delays, DB path, BOT_ID
├── types/                bot_state Zod schema
├── mal/                  MAL site automation (login, friends scrape/request)
├── engine/               runFriendRequestFlow + menu action
└── controllers/storage/  SQLite open/schema/state store
```

## MAL-specific config

`config/constants.ts` — `MalSelectors` (friends list, login form, friend button), `MalDelays` (rate-limit pacing). Update selectors if MAL changes markup.

## Shared tools

- **Browser** — `@/tools/browser` (same Chrome profile as Code Redeemer; separate site cookies)

## Credentials

MAL login username/password are **prompted** at runtime when auto-login is chosen — not stored in `.env`. To reset login, delete `mal-friend-request-sender.db` and log in again in the Chrome debug window.

## Configuration

Global env: `CHROME_EXECUTABLE_PATH`, `CHROME_USER_DATA_DIR`, `CHROME_DEBUG_PORT`, `HEADLESS`.

`HEADLESS=true` requires a prior saved session or successful auto-login; manual login needs a visible browser window.
