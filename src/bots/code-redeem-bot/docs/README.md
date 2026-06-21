# Code Redeemer (`code-redeem`)

Scrapes Hoyoverse promo codes from community wikis and redeems them in-game via browser automation. Supports **Genshin Impact** and **Honkai: Star Rail**, with scheduling, run history, and multi-adapter input (CLI, Telegram, scheduler).

## Entry point

`index.ts` — registers `codeRedeemBotModule` with the host. On `start()`:

1. Opens per-game SQLite databases and store registries
2. Starts the scheduler (`@/tools/scheduler`) for due tasks

On `stop()`: stops scheduler, resets in-memory stores, closes DB connections.

## How a run works

```text
Adapter (CLI / Telegram / scheduler)
  → menu or scheduled trigger
  → createRedeemTask / load scheduled task
  → runRedeemTask
  → executeRedeemRun
       1. evaluateScrapePolicy — skip scrape if not due
       2. runScrape — game plugin fetches wiki codes → codes table
       3. launchChromeSession — Puppeteer on shared Chrome debug profile
       4. redeemCodes — game plugin logs in and redeems pending codes
       5. persist results → run_history + codes status
  → display result via adapter
```

Game-specific DOM, URLs, and login live under **`hoyoverse/`** (plug-in modules registered in `engine/gameRegistry.ts`). Orchestration stays in **`engine/`**.

## Menu actions

| Action | What it does |
|--------|----------------|
| Run now | Prompt for game, credentials, scrape policy → immediate redeem run |
| Schedule | Create recurring or one-shot scheduled task |
| List scheduled tasks | Show upcoming runs |
| Cancel | Remove a scheduled task |
| View run history | Last 10 runs with scrape/redeem summary |

## Storage

Per-game SQLite under `DATABASE_URL` (default `src/data/`):

| File | Purpose |
|------|---------|
| `genshin.db` | Genshin codes, schedules, run history, scrape meta |
| `hsr.db` | Same for Honkai: Star Rail |

Schema: `controllers/storage/schema.ts` — tables `scheduled_tasks`, `run_history`, `scrape_info`, `codes`.

Credentials are prompted per run/schedule and stored in `scheduled_tasks.credentials_json` (not in `.env`).

## Layout

```text
code-redeem-bot/
├── index.ts              BotModule + lifecycle
├── config/               Game IDs, DB paths, constants
├── types/                RedeemTask, schedule, run result, codes (Zod)
├── engine/               Menus, scrape policy, redeem orchestration
├── controllers/
│   ├── storage/          SQLite stores (codes, tasks, history)
│   ├── scheduling/       Scheduler wiring + queries
│   └── io/               Prompts, lists, run result display
├── hoyoverse/            Genshin + HSR scrapers/redeemers
└── utils/                Formatting helpers
```

## Shared tools

- **Browser** — `@/tools/browser` (Chrome launch, Puppeteer actions)
- **Scheduler** — `@/tools/scheduler` (poll interval from `SCHEDULER_POLL_INTERVAL_MS`)
- **Scraper** — `@/tools/scraper` (HTTP + DOM helpers for wiki scrape)

## Configuration

Uses global app env: `DATABASE_URL`, `CHROME_*`, `HEADLESS`, `SCHEDULER_POLL_INTERVAL_MS`. No bot-specific enable flag — always on when registered in `src/bots/registry.ts`.

Task sources: `"cli"`, `"telegram"`, `"scheduler"` (see `taskTriggerSources` on the module).
