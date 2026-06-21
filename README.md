# Auto Code Redeemer v2

Node.js app that scrapes Hoyoverse promo codes and redeems them automatically via `puppeteer-core` + Chrome.

Supported games: **Genshin Impact**, **Honkai: Star Rail** (add more under `src/bots/code-redeem-bot/hoyoverse/`).

Game credentials and schedules are **not** stored in `.env` — they are entered via enabled input adapters at runtime.

---

## Commands

```bash
npm run dev            # tsx (local development)
npm start              # build + node (production)
npm run build          # Compile TypeScript → dist/
npm run typecheck      # Type-check without emit
```

Both `dev` and `start` run the **same application** (`runApplication`): enabled bots, scheduler, and every adapter enabled in `.env`. The only difference is `dev` uses `tsx` without a build step; `start` compiles first.

---

## Quick start (local)

```bash
cp .env.example .env
npm install
npm run dev
```

Ensure `.env` has `CLI_ADAPTER_ENABLED=true` (default). The app shows a **bot picker** first, then the Code Redeemer menu: **Run now**, **Schedule**, **List**, **Cancel**, **History**, **Exit**.

Scheduled tasks fire while the process is running.

---

## Input adapters

Adapters are registered in `src/adapters/host/registry/adapterModules.ts`. Enable each via `.env`:

| Variable | Adapter | Lifecycle |
|----------|---------|-----------|
| `CLI_ADAPTER_ENABLED=true` | Terminal menu | Foreground (blocks until Exit) |
| `TELEGRAM_ENABLED=true` + `TELEGRAM_BOT_TOKEN` | Telegram bot | Background (polling) |

With both enabled, Telegram runs in the background while the CLI menu runs in the foreground.

### Telegram

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the token.
2. Add to `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_token_here
   TELEGRAM_ENABLED=true
   ```
3. Run `npm run dev` or `npm start` and send `/start` to your bot.

Scheduled runs notify the Telegram chat when `telegramChatId` is stored in task metadata.

### Production (Docker)

Persists DBs and Chrome profile to **`./src/data`** on the host (same path as local dev).

```bash
cp .env.example .env
# Set TELEGRAM_BOT_TOKEN; set CLI_ADAPTER_ENABLED=false for headless containers

docker compose up --build
```

---

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│  INPUT ADAPTERS (adapters/host/registry)              │
│  CLI  │  Telegram  │  (future: Discord, HTTP API, …)     │
└─────────────┴────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │  botRouter             │
                 │  (pick bot → menu)     │
                 └───────────┬────────────┘
                             ▼
                 ┌────────────────────────┐
                 │  code-redeem-bot       │
                 │  menuActions → flows   │
                 │  → workflows → storage │
                 └────────────────────────┘
```

**Design rule:** Adapters only collect input and display output. All redeem logic lives in `src/bots/code-redeem-bot/engine/`.

`RedeemTask.source`: `"cli"` | `"telegram"` | `"scheduler"`.

### Folder structure

```text
src/
├── index.ts                      # bootstrap → runApplication()
├── bootstrap/
├── adapters/
│   ├── host/                     # contracts, registry, router
│   ├── cli/
│   └── telegram/
├── tools/                        # browser, scraper, scheduler, database
├── utils/                        # env, errors, log, timing, date
└── bots/
    ├── registry.ts
    └── code-redeem-bot/
```

Contributor rules: **[AGENTS.md](./AGENTS.md)**. Implementation tracking: **[PLAN.md](./PLAN.md)**. Restructure notes: **[Restructure.md](./Restructure.md)**.

---

## Adding a new input adapter

1. Create `src/adapters/<name>/core/<name>AdapterModule.ts` implementing `AdapterModule`:
   - `isEnabled(appConfig)` — read a new `.env` flag from `appConfig.ts`
   - `lifecycle`: `"background"` (Discord, HTTP) or `"foreground"` (CLI)
   - `create()` — return `{ adapter: TaskInputAdapter, scheduledRunNotifier? }`
2. Append the module to `src/adapters/host/registry/adapterModules.ts`
3. Add env vars to `appConfig.ts`, `.env.example`, and this README

The shared `botRouter` works for any adapter that implements `PromptPort` + `DisplayPresenter`.

---

## Storage

| Data | Location |
|------|----------|
| Scraped codes + redeem status | SQLite `codes` table in bot DB |
| Scheduled tasks + run history | Same bot DB (`scheduled_tasks`, `run_history`) |
| Scheduler job queue | `scheduled_jobs` table in bot DB |
| Chrome / Hoyoverse session | `CHROME_USER_DATA_DIR` |

**Bot database paths:** `<DATABASE_URL>/genshin.db`, `<DATABASE_URL>/hsr.db`

Default dev: `src/data/genshin.db`, `src/data/hsr.db` (when `DATABASE_URL=file:./src/data`).

---

## Environment

Copy `.env.example` → `.env`. Application config only — no game credentials.

| Variable | Purpose |
|----------|---------|
| `CLI_ADAPTER_ENABLED` | Terminal menu (`true` / `false`, default `true`) |
| `DATABASE_URL` | Data directory — per-game DBs are `<path>/genshin.db`, `<path>/hsr.db` |
| `SCHEDULER_POLL_INTERVAL_MS` | Scheduler poll interval (default 60000) |
| `CHROME_*`, `HEADLESS` | Browser launch |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `TELEGRAM_ENABLED` | `false` to disable bot while keeping token |

---

## Scrape policy

| Source | Typical policy |
|--------|----------------|
| Run now + user says yes | `{ type: "always" }` |
| Run now + user says no | `{ type: "never" }` |
| Scheduled task | `{ type: "ifNotScrapedToday" }` |

---

## Adding a new game

1. Add id to `GameId` in `src/bots/code-redeem-bot/config/constants.ts`
2. Create `src/bots/code-redeem-bot/hoyoverse/<gameId>/` — `config/`, `controllers/`, `core/` (+ module file)
3. Register in `src/bots/code-redeem-bot/engine/gameRegistry.ts`

Scrapers must use `@/tools/scraper` only. Browser steps must use `@/tools/browser` only.

---

## Adding a new bot

1. Create `src/bots/<name>/` implementing `BotModule` (see `code-redeem-bot` as reference)
2. Append to `src/bots/registry.ts`

Details in **[AGENTS.md](./AGENTS.md)**.

---

## Stack

- Node.js 20+, TypeScript (ESM, bundler resolution + tsup)
- `puppeteer-core`, `better-sqlite3`, `grammy`, `zod`, `@clack/prompts`
