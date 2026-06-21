import type Database from "better-sqlite3";

/** Full bot DB schema (wipe mal-friend-request-sender.db when this changes). */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS bot_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_logged_in INTEGER NOT NULL DEFAULT 0,
    last_username TEXT
  );
`;

export function initSchema(db: Database.Database): void {
  db.exec(SCHEMA);
}
