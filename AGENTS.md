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
- Read `process.env` only in **`src/shared/utils/env/appConfig.ts`** (via `getAppConfig()`)
- Use **options objects** when a function has 3+ parameters
- Keep game-specific URLs/selectors in **`src/bots/<bot>/hoyoverse/<game>/config/`**
- Use **`.js` extensions** in import paths (ESM + `NodeNext` — resolves to compiled output)
- Import barrel folders as **`@/shared/tools/scraper.js`**, not `.../index.js` (see Import conventions)
- Keep adapters **thin**: collect input, route to bots, display output — no redeem/scrape logic
- Put redeem/scrape logic in **bot `engine/`** and **`hoyoverse/<game>/`**, never in adapters
- Use typed errors from **`@/shared/utils/errors.js`**
- Fail gracefully — guard missing data, handle loading/error/empty states in UI adapters
- Register bots in **`src/bots/registry.ts`**; register games in the bot's **`engine/gameRegistry.ts`**

### Do not

- Add credentials to `.env` or the database in plaintext outside normal runtime entry
- Put redeem/scrape logic in adapters or shared tools
- Use full `puppeteer` package (use `puppeteer-core` only, wrapped in `@/shared/tools/browser.js`)
- Import from `bots/` inside `shared/tools`, `shared/adapters`, or `shared/adapters/host` (host layer is bot-agnostic)
- Reintroduce `EXECUTION_MODE`, `GAME_ID`, env-based credentials, or JSON `codes.json` stores
- Leave legacy shims or `@deprecated` re-exports — delete replaced code in the same change
- Use `any` or non-null assertions (`!`)
- Bulk-replace imports with scripts without verifying TypeScript path resolution

---

## Architecture (summary)

```text
runApplication
  → start enabled bots (DB, scheduler, migrations)
  → start enabled adapters (CLI foreground / Telegram background)
  → botRouter: pick bot → bot menu loop

Bot menu action → engine/menu → engine/run → controllers/{storage,scheduling,io}
Scheduler onTrigger → runRedeemTask → redeemRun workflow
```

`RedeemTask.source`: open string — validated against registered adapter ids + bot `taskTriggerSources` at bootstrap.

---

## File structure

```text
src/
├── index.ts                          # bootstrap → runApplication()
├── bootstrap/
│   └── runApplication.ts             # composition root: wires bots + adapters
├── shared/
│   ├── adapters/
│   │   ├── host/                   # contracts, registry, router — hosts plug-in adapters
│   │   ├── cli/
│   │   └── telegram/
│   ├── tools/
│   │   ├── browser/                  # launch, actions, lifecycle, paths (opaque handles)
│   │   ├── scraper/                  # fetchHtml + cheerio query helpers
│   │   ├── scheduler/                # generic scheduler + drivers + scheduleSpec
│   │   └── database/                 # SQLite connection, CRUD, parseUrl
│   └── utils/                        # env, errors, log, timing, date (index barrel)
└── bots/
    ├── registry.ts                   # botModules — append new bots here
    └── code-redeem-bot/              # reference implementation
        ├── index.ts                  # Bot contract: DB, scheduler, menuActions
        ├── config/                   # constants, database path resolution
        ├── types/                    # domain.ts, schedule.ts, run.ts, codes.ts, storage.ts
        ├── utils/                    # credentials, normalizeCodes, formatters
        ├── engine/
        │   ├── menu/                 # runNow, schedule — prompt user, build task
        │   ├── run/                  # redeemRun, scrapeService — execute task (no prompts)
        │   ├── policies/           # scrapePolicy
        │   ├── gameRegistry.ts     # GameModule registry + plugin contracts
        │   ├── createRedeemTask.ts # build validated RedeemTask from user input
        │   └── menuActions.ts      # run / schedule / list / cancel / history
        ├── controllers/
        │   ├── storage/              # SQLite: codes, scheduled_tasks, run_history (index barrel)
        │   ├── scheduling/           # bot scheduler glue, queries, scheduledRunHandler
        │   └── io/                   # prompts, displayRunResult, list views
        └── hoyoverse/
            ├── shared/               # credentials, redeem-message parser
            ├── genshin/              # config/, controllers/ (scrape + browser), core/
            └── hsr/                  # stub
```

### Runtime data paths (`src/data/` — not in git)

Created at runtime from `.env` defaults (`DATABASE_URL`):

| Path | Purpose |
|------|---------|
| `src/data/genshin.db` | Genshin: `codes`, `scheduled_tasks`, `run_history`, `scheduled_jobs` |
| `src/data/hsr.db` | HSR: same tables |

Per-game DBs live directly under `<DATABASE_URL>` (default dev: `src/data/`). Override base via `DATABASE_URL` in `.env`. Docker mounts `/data`.

---

## Import conventions

Cross-folder imports use the `@/` alias (`"@/*": ["src/*"]` in `tsconfig.json`). Same-folder imports stay relative (`./foo.js`).

**Barrel folders** have an `index.ts` re-export. Import them without `/index.js`:

```typescript
import { fetchHtml } from "@/shared/tools/scraper.js";
import type { RedeemTask } from "@/bots/code-redeem-bot/types.js";
import { bootstrapStorage } from "@/bots/code-redeem-bot/controllers/storage.js";
```

TypeScript does not resolve `foo.js` → `foo/index.ts` through `@/*` alone. Explicit `paths` entries in `tsconfig.json` map each barrel:

| Import path | Resolves to |
|-------------|-------------|
| `@/bots/code-redeem-bot.js` | `bots/code-redeem-bot/index.ts` |
| `@/bots/code-redeem-bot/types.js` | `bots/code-redeem-bot/types/index.ts` |
| `@/bots/code-redeem-bot/controllers/storage.js` | `bots/code-redeem-bot/controllers/storage/index.ts` |
| `@/shared/utils.js` | `shared/utils/index.ts` |
| `@/shared/utils/env.js` | `shared/utils/env/index.ts` |
| `@/shared/utils/errors.js` | `shared/utils/errors.ts` |
| `@/shared/tools/browser.js` | `shared/tools/browser/index.ts` |
| `@/shared/tools/scraper.js` | `shared/tools/scraper/index.ts` |
| `@/shared/tools/database.js` | `shared/tools/database/index.ts` |
| `@/shared/tools/scheduler.js` | `shared/tools/scheduler/index.ts` |

When adding a new barrel folder imported via `@/`, add a matching `paths` entry. Build uses `tsc && tsc-alias` to rewrite aliases in `dist/`.

**Do not** add root shim files like `types.ts` that only re-export a folder — use `types/index.ts` + path mapping.

---

## Commands

```bash
npm run dev      # tsx, hot path for local work
npm start        # build + node dist/
npm run build && npm run typecheck
```

---

## Layering & dependency direction

```text
src/index.ts → bootstrap/runApplication (composition root — wires bots + adapters)
adapters (cli/telegram) → adapters/host (contracts, core, registry) → bots (via injected instances)
bots → shared/tools + shared/utils
```

- **Bootstrap** (`bootstrap/runApplication.ts`) — the only place that imports both `bots/registry` and the adapter host. Calls `bootstrapTaskSources`, wires scheduled-run handlers, passes started bot instances to adapters.
- **`shared/adapters/cli|telegram/`** — plug-in input surfaces. Each implements `AdapterModule` from `adapters/host`.
- **`shared/adapters/host/`** — adapter host: ports/contracts, bot router, terminal prompts, adapter registry, **task source validation**. Wires plug-in adapters to bots. Must not import from `bots/`.
- **Shared tools** — standalone packages: browser, scraper, scheduler, database. Generic over payload type `T`. Zero imports from `bots/`.
- **Shared utils** — env, errors, log, timing, date. Lowest layer; no app imports.
- **Bots** — own types, storage, scheduler, workflows, game plugins. Consume tools through public APIs only. Declare `taskTriggerSources` (e.g. `"scheduler"`) on `BotModule` for non-adapter sources.

**Forbidden imports:** `shared/tools` → `bots/` · `shared/adapters/host` → `bots/` · `shared/adapters` → `bots/` · adapters → bot storage implementations (use bot menu actions / workflows).

### Adapters stay thin

- Adapters implement **ports** (`PromptPort`, `DisplayPresenter`, `TaskInputAdapter`).
- `botRouter` delegates to `Bot.menuActions`; bots own run/schedule/list/cancel/history.
- Display formatting for redeem results lives in **bot `controllers/io/`** and **`utils/`**; generic `formatDisplayCard` stays in `adapters/host`.

### Feature placement

| Concern | Belongs in |
|---------|------------|
| When to scrape | `bots/.../engine/policies/scrapePolicy.ts` |
| Redeem orchestration | `bots/.../engine/workflows/redeemRun.ts` |
| Browser + code-store redeem | `bots/.../engine/workflows/browserRedemption.ts` |
| When task runs next | `@/shared/tools/scheduler` drivers + `scheduleSpec` |
| What user sees (redeem) | `bots/.../controllers/io/` + `utils/` |
| What gets stored | `bots/.../controllers/storage/` |
| Game-specific DOM | `bots/.../hoyoverse/<game>/controllers/` |
| Game scrape logic | `bots/.../hoyoverse/<game>/core/` using `@/shared/tools/scraper.js` |

---

## How to add a bot

1. Create `src/bots/<name>/` implementing the `BotModule` contract (`index.ts`, `config/`, `types/`, `engine/`, `controllers/` as needed). Use **`code-redeem-bot`** as the reference.
2. Read bot-specific env in the bot's `config/` (not shared `appConfig`).
3. Append the module to **`src/bots/registry.ts`**.

The router and `runApplication` pick it up automatically. Optional: `start()`/`stop()` for DB + scheduler, `hoyoverse/<target>/` namespace for multi-game bots.

### How to add an input adapter

1. Create `src/shared/adapters/<name>/core/<name>AdapterModule.ts` implementing `AdapterModule`.
2. Append to `src/shared/adapters/host/registry/adapterModules.ts`.
3. Add env flag in `appConfig.ts`, `.env.example`, and README.

### How to add a game (code-redeem-bot)

1. Add id to `GameId` in `bots/code-redeem-bot/config/constants.ts`.
2. Create `hoyoverse/<gameId>/{config,controllers,core}` — scraper uses `@/shared/tools/scraper.js` only; controllers use `@/shared/tools/browser.js` only.
3. Register module in `bots/code-redeem-bot/engine/gameRegistry.ts`.

---

## Before Phase 9 (multi-user)

Restructure Phases 1–5 are **complete** — see `Restructure.md`. Phase 9 (multi-user accounts, per-user DB rows, stored credentials) may proceed per `PLAN.md`.
