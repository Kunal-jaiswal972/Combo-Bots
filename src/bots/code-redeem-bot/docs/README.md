# Code Redeemer (`code-redeem`)

Scrapes Hoyoverse promo codes from community wikis and redeems them in-game via browser automation. Supports **Genshin Impact** (live) and **Honkai: Star Rail** (login flow live; redemption stubbed), with scheduling, run history, and multi-adapter input (CLI, Telegram, scheduler).

**Bot id:** `code-redeem` — `BOT_ID_CODE_REDEEM` in `src/config/index.ts`.

**Enable/disable:** `CODE_REDEEM_ENABLED` env key. Defaults to enabled. See [Module enabling](../../../../AGENTS.md#module-enabling).

> Built with `createBotService` (`@/services/bot-builder`) using typed workflows — the same pattern as `mal-friend-request-sender`. A small bot-builder extension lets a background scheduler coexist with the workflow model.

---

## How it works

The bot opens a **shared Chrome session on enter** (`usesBrowser: true`) and runs two kinds of workflows: an `onEnter` workflow that settles the game + account, then per-action workflows.

### 1. Enter workflow (`redeemEnterWorkflow`) — runs before the menu

```text
select-game        → choose a registered game (Genshin Impact, HSR, …)

open-redeem-page   → navigate the session to that game's gift/redeem URL

detect-account     → read the masked account name from the live page
                     (Genshin: .login__dropdown strong · HSR: .mihoyo-account-role__nickname)

already-logged-in  → show "Already logged in as {name}."
                     → How would you like to continue?  Continue | Log out and use another account
                     → if logout: open the account dropdown, click Log Out, clear account

needs-login        → loginToHoyoInteractive: "Log in automatically with username and password?"
                       yes → fill the Hoyoverse SSO iframe, submit
                       no  → manual login, wait for confirmation
                     → re-read page to confirm, show "Logged in as {name}." or warn
```

Login is detected **from the live page** — the Chrome user-data dir persists the session across restarts (one Hoyoverse SSO cookie covers all games).

### 2. Action workflows (the menu)

| Action | Workflow | What it does |
|--------|----------|--------------|
| Redeem codes | `redeemNowWorkflow` | Pick server → optionally scrape the wiki → redeem on the **live, logged-in session** (no re-login) |
| Schedule a recurring/one-shot task | `createScheduleWorkflow` | Prompt recurrence + **username/password/server** → register a scheduled task |
| List scheduled tasks | `createListWorkflow` | Show upcoming runs |
| Cancel a scheduled task | `createCancelWorkflow` | Remove a scheduled task |
| View recent run history | `createHistoryWorkflow` | Last 10 runs with scrape/redeem summary |

The game chosen on enter applies to the whole session.

---

## Login models — interactive vs scheduled

- **Interactive** ("Redeem codes") uses the live session settled on enter. No credentials are prompted or stored; redemption runs with `alreadyLoggedIn: true`.
- **Scheduled** runs unattended, so the Schedule workflow **stores** username/password/server. At trigger time `reconcileHoyoAccount` reads the logged-in account and, if it is missing or a *different* account (compared against the stored username, accounting for Hoyoverse's masking), **logs out → logs in** as the stored account, then redeems.

---

## Scheduling and task sources

Every task carries a validated `source` (`"cli"` / `"telegram"` / `"scheduler"`). When a task is **scheduled**, the creating adapter's id is also stamped as `metadata.originalSource`, so triggered runs can route notifications back to the right channel.

---

## Storage

Per-game SQLite under `DATABASE_URL` (default `src/data/`):

| File | Tables |
|------|--------|
| `genshin.db` | `codes`, `scheduled_tasks`, `run_history`, `scheduled_jobs` |
| `hsr.db` | same |

Schema: `storage/schema.ts`. Scheduled-task credentials live in `scheduled_tasks.credentials_json` (never in `.env`); interactive runs store none.

---

## Layout

Mirrors the MAL bot's top-level layout (`core`, `functions`, `io`, `storage`, `scheduling`, `types`, `constants.ts`, `docs`), plus `hoyoverse/` and `utils/` as the extras this more complex bot needs.

```text
code-redeem-bot/
├── index.ts                  re-exports codeRedeemBotModule
├── constants.ts              GameId, HoyoServer, status enums, scheduler source
├── core/
│   ├── entry.ts              BotModule + BotDefinition (createBotService) + scheduler wiring
│   └── workflow.ts           RedeemState, enter + action workflows
├── functions/                run pipeline + task building (was engine/)
│   ├── run/                  redeemRun, interactiveRedeem, browserRedemption, scrapeService
│   ├── policies/             scrapePolicy
│   ├── gameRegistry.ts       GameModule plug-in registry (carries each game's HoyoGameConfig)
│   └── createRedeemTask.ts   build + validate RedeemTask
├── io/                       prompts, displayRunResult, list views
├── storage/                  SQLite: codes, scheduled_tasks, run_history (+ db path resolution)
├── scheduling/               scheduler wiring, queries, scheduledRunHandler
├── hoyoverse/                game plug-ins (each: config/, controllers/, core/)
│   ├── shared/               auth (account/login/logout/reconcile), server, config (selector shape + HoyoGameConfig), credentials, redeemMessageParser
│   ├── genshin/              config (gift + wiki selectors, verified live), controllers, core
│   └── hsr/                  config (own selectors), controllers, core/redeemer (stub)
├── types/                    RedeemTask, schedule, run result, codes (Zod)
├── utils/                    formatting helpers
└── docs/README.md
```

### Shared vs per-game

The **structure** is shared — `hoyoverse/shared/auth.ts` and `server.ts` take a `HoyoGameConfig` and work for any game; the **selector values are per-game** (Genshin's `cdkey-*`/`login__dropdown` markup differs from HSR's `web-cdkey-*`/`mihoyo-account-role`). The server region list (`HoyoServer`) is shared across all Hoyo games. The redeem-loop + result-modal parsing stays per-game (`hoyoverse/genshin/controllers/`) until HSR redemption is implemented.

---

## Selectors

Gift-page selectors were **verified live** against `genshin.hoyoverse.com/en/gift` and `hsr.hoyoverse.com/gift` and live in `genshin/config/genshin-elements.ts` and `hsr/config/hsr-elements.ts`. Update them there if Hoyoverse changes its markup. HSR's redeem-form/result-modal selectors are placeholders (redemption is stubbed).

---

## Adding a game

1. Create `hoyoverse/<game>/` with an `elements.ts` (satisfying `HoyoGiftSelectors`), a `config.ts` (satisfying `HoyoGameConfig`), and a redeemer.
2. Add a `GameId` entry in `constants.ts`.
3. Register the module in `functions/gameRegistry.ts`.

---

## Shared tools

- **Browser** — `@/tools/browser` (Chrome connect/close/actions; same profile as MAL, separate site cookies)
- **Scheduler** — `@/tools/scheduler` (`SCHEDULER_POLL_INTERVAL_MS`)
- **Scraper** — `@/tools/scraper` (HTTP + DOM helpers)

---

## Configuration

Global app env: `DATABASE_URL`, `CHROME_*`, `HEADLESS`, `SCHEDULER_POLL_INTERVAL_MS`. No bot-specific config beyond the enable flag. `HEADLESS=true` requires a prior saved session or successful auto-login — manual/interactive login needs a visible browser window.
