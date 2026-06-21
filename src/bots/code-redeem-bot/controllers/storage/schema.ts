import type Database from "better-sqlite3";

/** Full bot DB schema (test mode: wipe *.db when this changes). */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id TEXT PRIMARY KEY NOT NULL,
    game_id TEXT NOT NULL,
    credentials_json TEXT NOT NULL,
    scrape_policy_json TEXT NOT NULL,
    metadata_json TEXT,
    schedule_json TEXT NOT NULL,
    enabled INTEGER NOT NULL,
    last_run_at TEXT,
    next_run_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS run_history (
    id TEXT PRIMARY KEY NOT NULL,
    scheduled_task_id TEXT,
    redeem_task_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    scraped INTEGER NOT NULL,
    scrape_stats_json TEXT,
    redeem_summary_json TEXT,
    error TEXT,
    FOREIGN KEY (scheduled_task_id) REFERENCES scheduled_tasks(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_run_history_started_at
  ON run_history(started_at DESC);

  CREATE TABLE IF NOT EXISTS scrape_info (
    game_id TEXT PRIMARY KEY NOT NULL,
    last_scrape_date TEXT,
    last_scraped_at TEXT
  );

  CREATE TABLE IF NOT EXISTS codes (
    code TEXT NOT NULL,
    game_id TEXT NOT NULL,
    wiki_status TEXT NOT NULL,
    redeem_status TEXT NOT NULL,
    message TEXT,
    scraped_at TEXT NOT NULL,
    attempted_at TEXT,
    source TEXT,
    PRIMARY KEY (game_id, code)
  );

  CREATE INDEX IF NOT EXISTS idx_codes_game_redeem
  ON codes(game_id, redeem_status);
`;

export function initSchema(db: Database.Database): void {
  db.exec(SCHEMA);
}
