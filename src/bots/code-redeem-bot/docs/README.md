# Code Redeemer (`code-redeem`)

Scrapes Hoyoverse promo codes from community wikis and redeems them in-game via browser automation. Supports **Genshin Impact** and **Honkai: Star Rail**, with scheduling, run history, and multi-adapter input (CLI, Telegram, scheduler).

**Bot id:** `code-redeem` — `BOT_ID_CODE_REDEEM` in `src/config/index.ts`.

**Enable/disable:** `CODE_REDEEM_ENABLED` env key. Defaults to enabled. See [Module enabling](../../../../AGENTS.md#module-enabling).

---

## How a run works

```text
Adapter (CLI / Telegram / scheduler)
  → menu action or scheduled trigger
  → createRedeemTask / load scheduled task
  → runRedeemTask
  → executeRedeemRun
       1. evaluateScrapePolicy  — skip scrape if not due
       2. runScrape             — game plugin fetches wiki codes → codes table
       3. launchChromeSession   — connect to shared Chrome debug profile
       4. redeemCodes           — game plugin logs in + redeems pending codes
       5. persist               → run_history + codes status update
  → display result via adapter
```

Game-specific DOM, URLs, and login live under `hoyoverse/` (plug-in modules registered in `engine/gameRegistry.ts`). Orchestration stays in `engine/`.

---

## Menu actions

| Action | What it does |
|--------|--------------|
| Run now | Prompt for game + credentials + scrape policy → immediate redeem run |
| Schedule | Create recurring or one-shot scheduled task |
| List scheduled tasks | Show upcoming runs |
| Cancel | Remove a scheduled task |
| View run history | Last 10 runs with scrape/redeem summary |

---

## Scheduling and task sources

Every task carries a `source` field (validated on creation):

| source | When set |
|--------|----------|
| `"cli"` | User triggered from the CLI menu |
| `"telegram"` | User triggered from the Telegram bot |
| `"scheduler"` | Scheduler fired a due task automatically |

When a task is **scheduled** (not run immediately), the creating adapter's id is also stamped as `metadata.originalSource` on the task template. This persists through the scheduler's `materialize` step, so triggered runs always know which adapter originally scheduled them — useful for routing notifications back to the right channel.

---

## Storage

Per-game SQLite under `DATABASE_URL` (default `src/data/`):

| File | Tables |
|------|--------|
| `genshin.db` | `codes`, `scheduled_tasks`, `run_history`, `scheduled_jobs` |
| `hsr.db` | same |

Schema: `controllers/storage/schema.ts`.

Credentials are prompted per run/schedule and stored in `scheduled_tasks.credentials_json` (never in `.env`).

---

## Layout

```text
code-redeem-bot/
├── index.ts                  BotModule (start/stop/menuActions) — not workflow-based
├── config/                   game IDs, DB paths, constants
├── types/                    RedeemTask, schedule, run result, codes (Zod)
├── engine/
│   ├── menu/                 runNow.ts, schedule.ts — prompt user, build task
│   ├── run/                  redeemRun, scrapeService — execute task (no prompts)
│   ├── policies/             scrapePolicy
│   ├── gameRegistry.ts       GameModule plug-in registry
│   ├── createRedeemTask.ts   build + validate RedeemTask from user input
│   └── menuActions.ts        run / schedule / list / cancel / history
├── controllers/
│   ├── storage/              SQLite: codes, scheduled_tasks, run_history
│   ├── scheduling/           scheduler wiring, queries, scheduledRunHandler
│   └── io/                   prompts, displayRunResult, list views
├── hoyoverse/
│   ├── shared/               credentials, redeem-message parser
│   ├── genshin/              config/, controllers/, core/
│   └── hsr/
└── utils/                    formatting helpers
```

> This bot is **not** workflow-based — it implements `BotModule` directly in `index.ts`. Use `mal-friend-request-sender` as the reference for workflow-based bots built with `createBotService`.

---

## Shared tools

- **Browser** — `@/tools/browser` (Chrome connect/close/actions)
- **Scheduler** — `@/tools/scheduler` (`SCHEDULER_POLL_INTERVAL_MS`)
- **Scraper** — `@/tools/scraper` (HTTP + DOM helpers)

---

## Configuration

Uses global app env: `DATABASE_URL`, `CHROME_*`, `HEADLESS`, `SCHEDULER_POLL_INTERVAL_MS`. No bot-specific config beyond the enable flag.
