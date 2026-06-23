# Auto Code Redeemer v2

Modular Node.js app that runs one or more **bots** behind pluggable **input adapters** (CLI, Telegram) plus a scheduler.

Bundled bots:

- **Code Redeemer** — scrapes Hoyoverse promo codes (**Genshin Impact**, **Honkai: Star Rail**) and redeems them in-game via `puppeteer-core` + Chrome.
- **MAL Friend Request Sender** — bulk-sends MyAnimeList friend requests.

Game credentials and schedules are **not** stored in `.env` — they are entered via an enabled input adapter at runtime.

---

## Commands

```bash
# Run
npm run dev            # tsx — local development (no build step)
npm start              # build, then run dist/ (production)
npm run build          # compile TypeScript → dist/

# Quality
npm run typecheck      # tsc --noEmit (type-check only)
npm run lint           # eslint — import grouping + no-duplicates
npm run lint:fix       # eslint --fix
npm run format         # prettier --write src
npm run format:check   # prettier --check src

# Docker
npm run docker:reset   # compose down -v + rebuild + up -d
```

`dev` and `start` run the **same application** (`runApplication`) — enabled bots, the scheduler, and every enabled adapter. The only difference: `dev` uses `tsx` without a build step; `start` compiles first.

---

## Quick start (local)

```bash
cp .env.example .env
npm install
npm run dev
```

With defaults the CLI menu is on: pick a **bot**, then use its menu (Code Redeemer: **Run now**, **Schedule**, **List**, **Cancel**, **History**, **Exit**). Scheduled tasks fire while the process runs. Press **Ctrl+C** any time to quit.

---

## Bots

Registered in `src/bots/registry.ts`. Each is independently toggled (see [Module enabling](#module-enabling-bots--adapters)).

| Bot | id | What it does | Docs |
|-----|-----|--------------|------|
| Code Redeemer | `code-redeem` | Scrape + redeem Hoyoverse codes (Genshin, HSR); scheduling, run history | [docs](src/bots/code-redeem-bot/docs/README.md) |
| MAL Friend Request Sender | `mal-friend-request-sender` | Bulk MyAnimeList friend requests | [docs](src/bots/mal-friend-request-sender/docs/README.md) |

---

## Input adapters

Registered in `src/adapters/host/registry/adapterModules.ts`; toggled via [`<ID>_ENABLED`](#module-enabling-bots--adapters).

| Adapter | id | Lifecycle |
|---------|-----|-----------|
| Terminal menu | `cli` | Foreground (blocks until Exit) |
| Telegram bot | `telegram` | Background (polling; needs `TELEGRAM_BOT_TOKEN`) |

With both enabled, Telegram runs in the background while the CLI menu holds the foreground. The shared `botRouter` works for any adapter implementing `PromptPort` + `DisplayPresenter`.

### Telegram setup

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the token.
2. In `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_token_here
   # TELEGRAM_ENABLED defaults to on when a token is set
   ```
3. Run `npm run dev` / `npm start`, then send `/start` to your bot.

Scheduled runs notify the Telegram chat when `telegramChatId` is stored in the task metadata.

---

## Module enabling (bots & adapters)

Every **bot** and **input adapter** owns its own on/off state, gated by a **dynamic env key derived from its id**:

```text
<ID>_ENABLED        # id uppercased, non-alphanumerics → "_"
```

- Key **set** (`1/true/yes/on` or `0/false/no/off`) → that value wins.
- Key **unset** (or unrecognized) → the module's built-in **source-code default** applies.

Enabling/disabling a module therefore never needs a config-schema change — the env key is derived automatically and is purely opt-in per deployment.

| Module | Kind | id | Env key | Default |
|--------|------|-----|---------|---------|
| CLI menu | adapter | `cli` | `CLI_ENABLED` | enabled |
| Telegram | adapter | `telegram` | `TELEGRAM_ENABLED` | enabled **only if** `TELEGRAM_BOT_TOKEN` is set |
| Code Redeemer | bot | `code-redeem` | `CODE_REDEEM_ENABLED` | enabled |
| MAL Friend Request | bot | `mal-friend-request-sender` | `MAL_FRIEND_REQUEST_SENDER_ENABLED` | enabled |

On startup the resolved set is logged: `Active adapters: …` and `Enabled bots: …`. Disabling all input adapters is valid — the app then runs headless and the **scheduler still fires** due tasks.

---

## Configuration

Copy `.env.example` → `.env`. **Application config only — no game credentials.**

Every variable is optional with a sensible default, so the app runs with an **empty `.env`** (CLI on, both bots on, Telegram on only if a token is set). Add only what you need to override.

| Variable | Purpose | Default |
|----------|---------|---------|
| `<ID>_ENABLED` | Per-module toggle — see [Module enabling](#module-enabling-bots--adapters) | per-module |
| `CLI_ENABLED` | Terminal menu | `true` |
| `TELEGRAM_ENABLED` | Telegram adapter | on iff `TELEGRAM_BOT_TOKEN` set |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | — |
| `DATABASE_URL` | Data directory (`<path>/genshin.db`, `<path>/hsr.db`) | `file:./src/data` |
| `SCHEDULER_TIMEZONE` | IANA timezone for schedule times | `Asia/Kolkata` |
| `SCHEDULER_POLL_INTERVAL_MS` | Scheduler poll interval (min 5000) | `10000` |
| `CHROME_EXECUTABLE_PATH` | Chrome binary (auto-detected if unset) | auto |
| `CHROME_USER_DATA_DIR` | Debug Chrome profile directory | platform default |
| `CHROME_DEBUG_PORT` | Remote-debugging port | `9222` |
| `HEADLESS` | Run Chrome headless | `false` |

**Practical minimums:** local CLI use needs nothing. Telegram needs `TELEGRAM_BOT_TOKEN`. Browser automation needs Chrome installed — set `CHROME_EXECUTABLE_PATH` only if it isn't auto-found.

---

## Storage

| Data | Location |
|------|----------|
| Scraped codes + redeem status | SQLite `codes` table in the bot DB |
| Scheduled tasks + run history | Same bot DB (`scheduled_tasks`, `run_history`) |
| Scheduler job queue | `scheduled_jobs` table in the bot DB |
| Chrome / site session | `CHROME_USER_DATA_DIR` |

**Bot database paths:** `<DATABASE_URL>/genshin.db`, `<DATABASE_URL>/hsr.db`, `<DATABASE_URL>/mal-friend-request-sender.db`.

Default dev (`DATABASE_URL=file:./src/data`): files under `src/data/`.

---

## Deployment (Docker)

Persists DBs and the Chrome profile to **`./src/data`** on the host (same path as local dev).

```bash
cp .env.example .env
# Set TELEGRAM_BOT_TOKEN; set CLI_ENABLED=false for headless containers (no TTY)

docker compose up --build -d
```

**Wipe persisted data and start fresh** (stop containers, remove compose volumes, rebuild):

```bash
npm run docker:reset
# or: docker compose down -v && docker compose up --build -d
```

Data is bind-mounted at `./src/data` — `down -v` does **not** delete host files. To fully reset SQLite DBs and the Chrome profile, delete the contents of `src/data/` on the host after stopping the container. Your host `.env` is not deleted.

---

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│  INPUT ADAPTERS (adapters/host/registry)                  │
│  CLI  │  Telegram  │  (future: Discord, HTTP API, …)      │
└─────────────┴────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │  botRouter             │
                 │  (pick bot → menu)     │
                 └───────────┬────────────┘
                             ▼
                 ┌────────────────────────┐
                 │  selected bot          │
                 │  menuActions → flows   │
                 │  → engine → storage    │
                 └────────────────────────┘
```

**Design rule:** adapters only collect input and display output. All bot logic lives in the bot's `engine/`. `RedeemTask.source`: `"cli"` | `"telegram"` | `"scheduler"`.

### Folder structure

```text
src/
├── index.ts                      # bootstrap → runApplication()
├── bootstrap/                    # shutdown + app wiring
├── adapters/
│   ├── host/                     # contracts, registry, botRouter
│   ├── cli/
│   └── telegram/
├── tools/                        # browser, scraper, scheduler, database
├── utils/                        # env, errors, log, timing, date, control
└── bots/
    ├── registry.ts
    ├── code-redeem-bot/
    └── mal-friend-request-sender/
```

Contributor rules: **[AGENTS.md](./AGENTS.md)**. Implementation tracking: **[PLAN.md](./PLAN.md)**. Restructure notes: **[Restructure.md](./Restructure.md)**.

---

## Extending

### Add a bot

1. Create `src/bots/<name>/` implementing `BotModule` (use `code-redeem-bot` as reference).
2. Implement `isEnabled()` → `isModuleEnabled(BOT_ID, default)`; the bot is then toggled by `<BOT_ID>_ENABLED` (see [Module enabling](#module-enabling-bots--adapters)).
3. Append the module to `src/bots/registry.ts`.

`runApplication` and the router pick it up automatically. Optional `start()`/`stop()` for DB + scheduler.

### Add an input adapter

1. Create `src/adapters/<name>/core/<name>AdapterModule.ts` implementing `AdapterModule`:
   - `isEnabled()` → `isModuleEnabled(id, default)`; the `<ID>_ENABLED` env key is automatic — no `appConfig` flag needed.
   - `lifecycle`: `"background"` (Discord, HTTP) or `"foreground"` (CLI).
   - `create()` → `{ adapter: TaskInputAdapter, scheduledRunNotifier? }`.
2. Append to `src/adapters/host/registry/adapterModules.ts`.
3. Document the `<ID>_ENABLED` key in `.env.example` and this README.

### Add a game (Code Redeemer)

1. Add the id to `GameId` in `src/bots/code-redeem-bot/config/constants.ts`.
2. Create `src/bots/code-redeem-bot/hoyoverse/<gameId>/` — `config/`, `controllers/`, `core/` (+ module file).
3. Register it in `src/bots/code-redeem-bot/engine/gameRegistry.ts`.

Scrapers must use `@/tools/scraper` only; browser steps must use `@/tools/browser` only.

---

## Code Redeemer — scrape policy

| Source | Typical policy |
|--------|----------------|
| Run now + user says yes | `{ type: "always" }` |
| Run now + user says no | `{ type: "never" }` |
| Scheduled task | `{ type: "ifNotScrapedToday" }` |

---

## Stack

- Node.js 20+, TypeScript (ESM, bundler resolution + tsup)
- `puppeteer-core`, `better-sqlite3`, `grammy`, `zod`, `@clack/prompts`
- Tooling: **ESLint** (`simple-import-sort` + `import/no-duplicates`) and **Prettier**
