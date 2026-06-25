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

`dev` and `start` run the **same application** — enabled bots, the scheduler, and every enabled adapter. The only difference: `dev` uses `tsx` without a build step; `start` compiles first.

---

## Quick start (local)

```bash
cp .env.example .env
npm install
npm run dev
```

With defaults the CLI menu is on: pick a **bot**, then use its menu. Press **Ctrl+C** any time to quit.

---

## Bots

Registered in `src/bots/registry.ts`. Each is independently toggled (see [Module enabling](#module-enabling-bots--adapters)).

| Bot | id | What it does | Docs |
|-----|-----|--------------|------|
| Code Redeemer | `code-redeem` | Scrape + redeem Hoyoverse codes (Genshin, HSR); scheduling, run history | [docs](src/bots/code-redeem-bot/docs/README.md) |
| MAL Friend Request Sender | `mal-friend-request-sender` | Bulk MyAnimeList friend requests | [docs](src/bots/mal-friend-request-sender/docs/README.md) |

---

## Input adapters

Registered in `src/adapters/registry.ts`; toggled via [`<ID>_ENABLED`](#module-enabling-bots--adapters).

| Adapter | id | Lifecycle |
|---------|-----|-----------|
| Terminal menu | `cli` | Foreground (blocks until Exit) |
| Telegram bot | `telegram` | Background (polling; needs `TELEGRAM_BOT_TOKEN`) |

With both enabled, Telegram runs in the background while the CLI menu holds the foreground. The shared `botRouter` (in `services/adapter-builder`) works for any adapter implementing `PromptPort` + `DisplayPresenter`.

### Telegram setup

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the token.
2. In `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_token_here
   # TELEGRAM_ENABLED defaults to on when a token is set
   ```
3. Run `npm run dev` / `npm start`, then send `/start` to your bot.

Scheduled runs notify the Telegram chat when `telegramChatId` is stored in the task metadata. The `originalSource` field in task metadata records which adapter created the schedule.

---

## Module enabling (bots & adapters)

Every **bot** and **input adapter** owns its own on/off state, gated by a dynamic env key derived from its id:

```text
<ID>_ENABLED        # id uppercased, non-alphanumerics → "_"
```

- Key **set** (`1/true/yes/on` or `0/false/no/off`) → that value wins.
- Key **unset** (or unrecognized) → the module's built-in **source-code default** applies.

| Module | Kind | id | Env key | Default |
|--------|------|-----|---------|---------|
| CLI menu | adapter | `cli` | `CLI_ENABLED` | enabled |
| Telegram | adapter | `telegram` | `TELEGRAM_ENABLED` | enabled **only if** `TELEGRAM_BOT_TOKEN` is set |
| Code Redeemer | bot | `code-redeem` | `CODE_REDEEM_ENABLED` | enabled |
| MAL Friend Request | bot | `mal-friend-request-sender` | `MAL_FRIEND_REQUEST_SENDER_ENABLED` | enabled |

On startup: `Active adapters: …` and `Enabled bots: …` are logged. Disabling all input adapters is valid — the scheduler still fires due tasks headlessly.

---

## Configuration

Copy `.env.example` → `.env`. **Application config only — no game credentials.**

Every variable is optional with a sensible default, so the app runs with an **empty `.env`** (CLI on, both bots on, Telegram on only if a token is set).

| Variable | Purpose | Default |
|----------|---------|---------|
| `<ID>_ENABLED` | Per-module toggle | per-module |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | — |
| `DATABASE_URL` | Data directory root | `file:./src/data` |
| `SCHEDULER_TIMEZONE` | IANA timezone for schedule times | `Asia/Kolkata` |
| `SCHEDULER_POLL_INTERVAL_MS` | Scheduler poll interval (min 5000 ms) | `10000` |
| `CHROME_EXECUTABLE_PATH` | Chrome binary (auto-detected if unset) | auto |
| `CHROME_USER_DATA_DIR` | Debug Chrome profile directory | platform default |
| `CHROME_DEBUG_PORT` | Remote-debugging port | `9222` |
| `HEADLESS` | Run Chrome headless | `false` |

---

## Storage

| Data | Location |
|------|----------|
| Scraped codes + redeem status | SQLite `codes` table in the bot DB |
| Scheduled tasks + run history | Same bot DB (`scheduled_tasks`, `run_history`) |
| Scheduler job queue | `scheduled_jobs` table in the bot DB |
| Chrome / site session | `CHROME_USER_DATA_DIR` |

**Bot database paths:** `<DATABASE_URL>/<bot-id>/<bot-id>.db`. Default dev: `src/data/`.

---

## Architecture

```text
bootstrap/runApplication
        │
        ├── bots/registry ──→ enabled bots (start DB + scheduler)
        │
        ├── adapters/registry ──→ createEnabledAdapters
        │       ├── foreground adapter (CLI)  ─┐
        │       └── background adapter (Telegram) ─┤──→ botRouter
        │                                           │       │
        │                                           │   pick bot → enter → menu → leave
        │                                           │
        └── scheduler ──→ onTrigger ──→ notifier routing ──→ scheduledRunHandler
```

### Services layer

```text
services/
  bridge/           pure contracts — Bot, AdapterModule, PromptPort, DisplayCard, …
  bot-builder/      workflow engine — createBotService, workflow().step().branch()…
  adapter-builder/  adapter engine — botRouter, createEnabledAdapters, schedule pickers, …
```

`bridge` has no logic — only TypeScript interfaces and constants. `bot-builder` and `adapter-builder` depend on `bridge` but not on each other or on concrete adapters/bots.

### Folder structure

```text
src/
├── index.ts
├── bootstrap/            shutdown + app wiring
├── services/
│   ├── bridge/           contracts (bot, adapter, prompts, display, scheduling)
│   ├── bot-builder/      workflow engine
│   └── adapter-builder/  adapter engine (botRouter, prompts, display, terminal, lib/)
├── adapters/
│   ├── registry.ts       adapterModules list — append new adapters here
│   ├── cli/
│   └── telegram/
├── tools/                browser, scraper, scheduler, database
├── utils/                env, errors, log, timing, datetime
└── bots/
    ├── registry.ts       botModules list — append new bots here
    ├── code-redeem-bot/
    └── mal-friend-request-sender/
```

---

## Deployment (Docker)

```bash
cp .env.example .env
# Set TELEGRAM_BOT_TOKEN; set CLI_ENABLED=false for headless containers (no TTY)

docker compose up --build -d
```

**Wipe persisted data and start fresh:**

```bash
npm run docker:reset
# or: docker compose down -v && docker compose up --build -d
```

Data is bind-mounted at `./src/data` — `down -v` does **not** delete host files. To fully reset, delete the contents of `src/data/` on the host after stopping the container.

---

## Extending

### Add a bot

1. Create `src/bots/<name>/` implementing `BotModule` from `@/services/bridge`.
2. For workflow-driven bots use `createBotService(BotDefinition)` from `@/services/bot-builder`.
3. Implement `isEnabled()` → `isModuleEnabled(BOT_ID, default)`.
4. Append to `src/bots/registry.ts`.

### Add an input adapter

1. Create `src/adapters/<name>/core/<name>AdapterModule.ts` implementing `AdapterModule` from `@/services/bridge`.
2. `lifecycle`: `"foreground"` (blocks, like CLI) or `"background"` (polling, like Telegram).
3. `create()` returns `{ adapter: TaskInputAdapter, scheduledRunNotifier? }`.
4. Append to `src/adapters/registry.ts` and document the env key in `.env.example`.

### Add a game (Code Redeemer)

1. Add the id to `GameId` in `src/bots/code-redeem-bot/constants.ts`.
2. Create `src/bots/code-redeem-bot/hoyoverse/<gameId>/` — `config/`, `controllers/`, `core/`.
3. Register in `src/bots/code-redeem-bot/functions/gameRegistry.ts`.

---

## Stack

- Node.js 20+, TypeScript (ESM, bundler resolution + tsup)
- `puppeteer-core`, `better-sqlite3`, `grammy`, `zod`, `@clack/prompts`
- **ESLint** (`simple-import-sort` + `import/no-duplicates`) and **Prettier**

Contributor rules: **[AGENTS.md](./AGENTS.md)**. Implementation tracking: **[PLAN.md](./PLAN.md)**.
