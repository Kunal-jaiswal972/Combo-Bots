---
description: 
alwaysApply: true
---

# AGENTS.md — Auto Code Redeemer v2

Rules and structure for AI agents and contributors. User-facing docs: **[README.md](./README.md)**. Task tracking: **[PLAN.md](./PLAN.md)**. Restructure history: **[Restructure.md](./Restructure.md)**.

---

## Rules (most important)

### Do

- Validate all external input with **Zod**
- Read `process.env` only in **`src/utils/env.ts`** (via `getAppConfig()`)
- Use **options objects** when a function has 3+ parameters
- Keep game-specific URLs/selectors in **`src/bots/<bot>/hoyoverse/<game>/config/`**
- Use **extensionless** imports (`@/tools/scraper`, `./dom/query`) — **no `.js` suffix**; `moduleResolution: "bundler"` + **tsup** resolve paths and barrels
- Cross-folder imports use **`@/`** (`"@/*": ["src/*"]` in tsconfig); same-folder imports stay relative
- Keep adapters **thin**: collect input, route to bots, display output — no redeem/scrape logic
- Put redeem/scrape logic in **bot `engine/`** and **`hoyoverse/<game>/`**, never in adapters
- Use typed errors from **`@/utils`** (`errors.ts`)
- Fail gracefully — guard missing data, handle loading/error/empty states
- Register bots in **`src/bots/registry.ts`**; adapters in **`src/adapters/registry.ts`**; games in the bot's **`engine/gameRegistry.ts`**
- When saving a scheduled task, always stamp `originalSource` in the template metadata (the adapter id that scheduled it — e.g. `"cli"`, `"telegram"`) so triggered runs can route notifications back

### Do not

- Add credentials to `.env` or the database in plaintext outside normal runtime entry
- Put redeem/scrape logic in adapters or tools
- Use full `puppeteer` package (use `puppeteer-core` only, wrapped in `@/tools/browser`)
- Import from `bots/` inside `tools/`, `services/`, or `adapters/` (those layers are bot-agnostic)
- Import from `adapters/` inside `services/` (services are adapter-agnostic)
- Reintroduce `EXECUTION_MODE`, `GAME_ID`, env-based credentials, or JSON `codes.json` stores
- Leave legacy shims or `@deprecated` re-exports — delete replaced code in the same change
- Use `any` or non-null assertions (`!`)
- Bulk-replace imports with scripts without verifying TypeScript path resolution

---

## Architecture (summary)

```text
runApplication (bootstrap/runApplication.ts)
  → start enabled bots (DB, scheduler, schema init via bot.start())
  → createEnabledAdapters(modules, bots) — foreground + background split
  → botRouter: pick bot → enter → action menu → leave

Bot menu action → engine/menu → engine/run → controllers/{storage,scheduling,io}
Scheduler onTrigger → createSchedulerOnTrigger → notifier routing → scheduledRunHandler
```

`RedeemTask.source` — validated string saved on every task/run record. Registered sources: adapter ids (`"cli"`, `"telegram"`) + bot trigger ids (`"scheduler"`). Original scheduling adapter is preserved in `metadata.originalSource`.

---

## File structure

```text
src/
├── index.ts                          # entry → runApplication()
├── bootstrap/
│   ├── runApplication.ts             # composition root: wires bots + adapters
│   └── shutdown.ts                   # SIGINT/Ctrl+C, abort token, force-exit deadline
│
├── services/                         # shared engines — bot-agnostic, adapter-agnostic
│   ├── bridge/                       # contracts only (pure types, no logic)
│   │   ├── bot.ts                    # Bot, BotModule, BotContext, BotMenuAction
│   │   ├── adapter.ts                # AdapterModule, TaskInputAdapter, TerminalPorts
│   │   ├── scheduling.ts             # SchedulableRunPayload, ScheduledRunNotifier
│   │   ├── prompts/prompts.ts        # PromptPort + back/default navigation sentinels
│   │   ├── display/display.ts        # DisplayCard, DisplayPresenter
│   │   └── index.ts
│   ├── bot-builder/                  # how to define and run a Bot via workflows
│   │   ├── botService.ts             # createBotService(BotDefinition) → Bot
│   │   ├── workflow/builder.ts       # workflow<S>().step().branch().forEach()…
│   │   ├── workflow/engine.ts        # runWorkflow — abort-aware step runner
│   │   ├── workflow/types.ts         # Step, Workflow, WorkflowContext<S>
│   │   └── index.ts
│   └── adapter-builder/              # shared adapter engine — no concrete adapter imports
│       ├── botRouter.ts              # runBotRouter: pick bot → enter → menu → leave
│       ├── createEnabledAdapters.ts  # filter by isEnabled, foreground/background split
│       ├── terminal/terminal.ts      # createTerminalPorts (clack-based CLI/scheduler I/O)
│       ├── display/displayFormatter.ts # formatDisplayCardCliBody/TelegramHtml
│       ├── prompts/
│       │   ├── schedulePrompts.ts    # promptRecurrenceSpec (public entry point)
│       │   ├── promptConstants.ts    # choice lists + numeric bounds
│       │   └── prompt-types/
│       │       ├── timeOfDayPrompt.ts
│       │       ├── weekdayPrompt.ts
│       │       └── dateTimePrompt.ts
│       ├── lib/
│       │   ├── adapterLogger.ts      # createAdapterLogger, logAdapter
│       │   ├── schedulerOnTrigger.ts # createSchedulerOnTrigger — notifier routing
│       │   └── adapterSourceValidator.ts # bootstrapTaskSources, validateTaskSource
│       └── index.ts
│
├── adapters/
│   ├── registry.ts                   # adapterModules list — append new adapters here
│   ├── cli/
│   │   ├── core/cliAdapter.ts        # createCliAdapter → TaskInputAdapter
│   │   ├── core/cliAdapterModule.ts  # AdapterModule: isEnabled, create, lifecycle
│   │   └── index.ts
│   └── telegram/
│       ├── core/telegramAdapter.ts
│       ├── core/telegramAdapterModule.ts
│       ├── core/telegramPromptPort.ts
│       ├── lib/telegramPromptSession.ts
│       ├── lib/telegramScheduledRunNotifier.ts
│       └── index.ts
│
├── tools/
│   ├── browser/                      # puppeteer-core connect/close/actions
│   ├── scraper/                      # HTTP + DOM query helpers
│   ├── scheduler/                    # SchedulerRunner, recurrence drivers
│   └── database/                     # better-sqlite3 open/close/paths
│
├── utils/                            # env.ts, datetime.ts, timing.ts, logger.ts, errors.ts, index.ts
│
└── bots/
    ├── registry.ts                   # botModules — append new bots here
    ├── code-redeem-bot/              # reference implementation
    │   ├── index.ts
    │   ├── config/                   # constants, database path resolution
    │   ├── types/                    # task.ts, schedule.ts, run.ts, codes.ts, storage.ts
    │   ├── utils/                    # credentials, normalizeCodes, formatters
    │   ├── engine/
    │   │   ├── menu/                 # runNow.ts, schedule.ts — prompt user, build task
    │   │   ├── run/                  # redeemRun, scrapeService — execute task (no prompts)
    │   │   ├── policies/             # scrapePolicy
    │   │   ├── gameRegistry.ts
    │   │   ├── createRedeemTask.ts
    │   │   └── menuActions.ts
    │   ├── controllers/
    │   │   ├── storage/              # SQLite: codes, scheduled_tasks, run_history
    │   │   ├── scheduling/           # scheduler glue, queries, scheduledRunHandler
    │   │   └── io/                   # prompts, displayRunResult, list views
    │   └── hoyoverse/
    │       ├── shared/
    │       ├── genshin/
    │       └── hsr/
    └── mal-friend-request-sender/
        ├── index.ts
        ├── constants.ts
        ├── core/
        │   ├── entry.ts              # BotModule + BotDefinition
        │   └── workflow.ts           # malEnterWorkflow, sendBulkWorkflow
        ├── functions/
        │   ├── malLogin.ts
        │   └── malFriendRequestHandler.ts
        ├── storage/
        │   ├── db.ts
        │   ├── schema.ts
        │   └── stateStore.ts
        └── docs/README.md
```

### Runtime data paths (`src/data/` — not in git)

| Path | Purpose |
|------|---------|
| `src/data/code-redeem/genshin.db` | Genshin: `codes`, `scheduled_tasks`, `run_history`, `scheduled_jobs` |
| `src/data/code-redeem/hsr.db` | HSR: same tables |
| `src/data/mal-friend-request-sender/mal-friend-request-sender.db` | MAL bot state |

Bot DBs live under `<DATABASE_URL>/<bot-id>/` (default dev: `src/data/`).

---

## Import conventions

```typescript
// external packages first, then @/ cross-folder, then relative — blank line between groups
import { z } from "zod";

import { runBotRouter } from "@/services/adapter-builder";
import type { Bot } from "@/services/bridge";

import { createCliAdapter } from "./cliAdapter";
```

`moduleResolution: "bundler"` resolves barrel folders (`scheduler/index.ts`) automatically — no per-barrel `paths` entries.

Production build: **tsup** bundles `src/index.ts` → `dist/index.js`.

---

## Commands

```bash
npm run dev            # tsx watch — local dev (no build)
npm start              # tsup build + node dist/
npm run build          # compile only
npm run typecheck      # tsc --noEmit
npm run lint           # eslint (import grouping + no-duplicates)
npm run lint:fix        # eslint --fix
npm run format         # prettier --write src
npm run format:check   # prettier --check src
npm run docker:reset   # compose down -v + rebuild + up -d
```

---

## Layering & dependency direction

```text
bootstrap/runApplication   ← composition root; only place that imports both registries
    │
    ├── adapters/registry  → concrete adapters (cli, telegram)
    │        │
    │        └── services/adapter-builder  (pure engine: botRouter, createEnabledAdapters, prompts…)
    │                 │
    │                 └── services/bridge  (pure contracts: Bot, AdapterModule, PromptPort…)
    │
    ├── bots/registry      → concrete bots
    │        │
    │        └── services/bot-builder  (pure engine: createBotService, workflow runner)
    │                 │
    │                 └── services/bridge
    │
    └── tools/  utils/     (lowest layer — no app imports)
```

**Key rules:**
- `services/bridge` — no imports from `services/`, `adapters/`, or `bots/`
- `services/bot-builder` / `services/adapter-builder` — no imports from `adapters/` or `bots/`
- `adapters/` — no imports from `bots/`
- `tools/` / `utils/` — no imports from `bots/`, `adapters/`, or `services/`

### Adapters stay thin

- Adapters implement **ports** (`PromptPort`, `DisplayPresenter`, `TaskInputAdapter`).
- `botRouter` delegates to `Bot.menuActions`; bots own run/schedule/list/cancel/history.
- Generic display formatting (`formatDisplayCard*`) lives in `services/adapter-builder/display/`.

### Feature placement

| Concern | Belongs in |
|---------|------------|
| Prompt I/O contract | `services/bridge/prompts/prompts.ts` |
| Schedule pickers (recurrence, date, time, weekday) | `services/adapter-builder/prompts/` |
| Bot routing loop | `services/adapter-builder/botRouter.ts` |
| Adapter enabling logic | `services/adapter-builder/createEnabledAdapters.ts` |
| Task source registration + validation | `services/adapter-builder/lib/adapterSourceValidator.ts` |
| Scheduled run routing (notifiers) | `services/adapter-builder/lib/schedulerOnTrigger.ts` |
| Bot definition + workflow runner | `services/bot-builder/` |
| When to scrape | `bots/.../engine/policies/scrapePolicy.ts` |
| Redeem orchestration | `bots/.../engine/run/` |
| Game-specific DOM | `bots/.../hoyoverse/<game>/controllers/` |
| Game scrape logic | `bots/.../hoyoverse/<game>/core/` |

---

## Module enabling

Every bot **and** adapter owns its own enable decision via `isEnabled()`, gated by a dynamic env key:

```text
<ID>_ENABLED        # id uppercased, non-alphanumerics → "_"
```

- **Env key set** (`1/true/yes/on` or `0/false/no/off`) → wins.
- **Env key unset** → module's source-code default applies.

| Module | id | Env key | Default |
|--------|-----|---------|---------|
| CLI menu | `cli` | `CLI_ENABLED` | enabled |
| Telegram | `telegram` | `TELEGRAM_ENABLED` | enabled iff `TELEGRAM_BOT_TOKEN` set |
| Code Redeemer | `code-redeem` | `CODE_REDEEM_ENABLED` | enabled |
| MAL Friend Request | `mal-friend-request-sender` | `MAL_FRIEND_REQUEST_SENDER_ENABLED` | enabled |

```ts
isEnabled(): boolean {
  return isModuleEnabled(BOT_ID, /* default */ true);
}
```

---

## How to add a bot

1. Create `src/bots/<name>/` implementing `BotModule` (use `code-redeem-bot` or `mal-friend-request-sender` as reference).
2. For workflow-driven bots: use `createBotService(BotDefinition)` from `@/services/bot-builder`.
3. Implement `isEnabled()` → `isModuleEnabled(BOT_ID, default)`.
4. Append the module to **`src/bots/registry.ts`**.

The router and `runApplication` pick it up automatically.

### How to add an input adapter

1. Create `src/adapters/<name>/core/<name>AdapterModule.ts` implementing `AdapterModule` from `@/services/bridge`.
2. `lifecycle`: `"foreground"` (CLI-style, blocks) or `"background"` (Telegram-style, polling).
3. `create()` returns `{ adapter: TaskInputAdapter, scheduledRunNotifier? }`.
4. `isEnabled()` → `isModuleEnabled(id, default)`.
5. Append to **`src/adapters/registry.ts`** and document the env key in `.env.example` + README.

### How to add a game (Code Redeemer)

1. Add id to `GameId` in `src/bots/code-redeem-bot/constants.ts`.
2. Create `src/bots/code-redeem-bot/hoyoverse/<gameId>/` — `config/`, `controllers/`, `core/`.
3. Register in `src/bots/code-redeem-bot/functions/gameRegistry.ts`.

Scrapers must use `@/tools/scraper` only; browser steps must use `@/tools/browser` only.
