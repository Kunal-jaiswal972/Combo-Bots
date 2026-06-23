import type Database from "better-sqlite3";

import { getTodayRunDate } from "@/utils";

import {
  CodeStatus,
  type GameIdValue,
  RedeemStatus,
  type RedeemStatusValue,
} from "../../../config/constants";
import type {
  CodeRedeemResult,
  CodesStore,
  CodeStoreMergeResult,
  MergeScrapedCodesOptions,
  PersistRedeemResultOptions,
} from "../../../types";
import { openGameDatabase } from "../db";

const skipRedeemStatuses: RedeemStatusValue[] = [
  RedeemStatus.REDEEMED,
  RedeemStatus.EXPIRED,
  RedeemStatus.UNAVAILABLE,
];

function normalizeCodeValue(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeRedeemStatus(entry: {
  redeemStatus: RedeemStatusValue;
  message?: string;
}): RedeemStatusValue {
  if (entry.redeemStatus !== RedeemStatus.FAILED) {
    return entry.redeemStatus;
  }

  const lower = (entry.message ?? "").toLowerCase();

  if (lower.includes("already") || lower.includes("in use")) {
    return RedeemStatus.REDEEMED;
  }

  if (lower.includes("expired") || lower.includes("expire")) {
    return RedeemStatus.EXPIRED;
  }

  return RedeemStatus.PENDING;
}

interface CodeRow {
  code: string;
  game_id: string;
  wiki_status: string;
  redeem_status: string;
  message: string | null;
  scraped_at: string;
  attempted_at: string | null;
  source: string | null;
}

interface ScrapeMetaRow {
  game_id: string;
  last_scrape_date: string | null;
  last_scraped_at: string | null;
}

interface CodesStoreContext {
  readonly db: Database.Database;
  readonly selectCodesStmt: Database.Statement;
  readonly upsertCodeStmt: Database.Statement;
  readonly upsertMetaStmt: Database.Statement;
  readonly selectMetaStmt: Database.Statement;
  readonly updateRedeemStmt: Database.Statement;
}

function getRedeemableFromRows(rows: CodeRow[]): string[] {
  return rows
    .filter(
      (row) =>
        row.wiki_status === CodeStatus.ACTIVE &&
        !skipRedeemStatuses.includes(row.redeem_status as RedeemStatusValue),
    )
    .map((row) => row.code);
}

function createCodesStoreContext(db: Database.Database): CodesStoreContext {
  return {
    db,
    selectCodesStmt: db.prepare(`
      SELECT code, game_id, wiki_status, redeem_status, message,
             scraped_at, attempted_at, source
      FROM codes
      WHERE game_id = ?
      ORDER BY code ASC
    `),
    upsertCodeStmt: db.prepare(`
      INSERT INTO codes (
        code, game_id, wiki_status, redeem_status, message,
        scraped_at, attempted_at, source
      ) VALUES (
        @code, @game_id, @wiki_status, @redeem_status, @message,
        @scraped_at, @attempted_at, @source
      )
      ON CONFLICT(game_id, code) DO UPDATE SET
        wiki_status = excluded.wiki_status,
        redeem_status = excluded.redeem_status,
        message = excluded.message,
        scraped_at = excluded.scraped_at,
        attempted_at = excluded.attempted_at,
        source = excluded.source
    `),
    upsertMetaStmt: db.prepare(`
      INSERT INTO scrape_info (game_id, last_scrape_date, last_scraped_at)
      VALUES (@game_id, @last_scrape_date, @last_scraped_at)
      ON CONFLICT(game_id) DO UPDATE SET
        last_scrape_date = excluded.last_scrape_date,
        last_scraped_at = excluded.last_scraped_at
    `),
    selectMetaStmt: db.prepare(`
      SELECT game_id, last_scrape_date, last_scraped_at
      FROM scrape_info
      WHERE game_id = ?
    `),
    updateRedeemStmt: db.prepare(`
      UPDATE codes
      SET redeem_status = @redeem_status,
          message = @message,
          attempted_at = @attempted_at
      WHERE game_id = @game_id AND code = @code
    `),
  };
}

export function createCodesStore(): CodesStore {
  const contexts = new Map<GameIdValue, CodesStoreContext>();

  function getContext(gameId: GameIdValue): CodesStoreContext {
    const existing = contexts.get(gameId);

    if (existing) {
      return existing;
    }

    const created = createCodesStoreContext(openGameDatabase(gameId));
    contexts.set(gameId, created);
    return created;
  }

  return {
    async hasScrapedToday(gameId: GameIdValue): Promise<boolean> {
      const { selectMetaStmt } = getContext(gameId);
      const row = selectMetaStmt.get(gameId) as ScrapeMetaRow | undefined;
      return row?.last_scrape_date === getTodayRunDate();
    },

    async mergeScrapedCodes(
      options: MergeScrapedCodesOptions,
    ): Promise<CodeStoreMergeResult> {
      const { db, selectCodesStmt, upsertCodeStmt, upsertMetaStmt } =
        getContext(options.gameId);
      const existingRows = selectCodesStmt.all(options.gameId) as CodeRow[];
      const byCode = new Map<string, CodeRow>();

      for (const row of existingRows) {
        byCode.set(normalizeCodeValue(row.code), row);
      }

      const now = new Date().toISOString();
      const newCodes: string[] = [];
      let activeCodes = 0;
      let expiredCodes = 0;

      const mergeAll = db.transaction(() => {
        for (const scrapedEntry of options.scraped) {
          const code = normalizeCodeValue(scrapedEntry.code);
          const existing = byCode.get(code);
          const isNew = existing === undefined;

          if (scrapedEntry.status === CodeStatus.ACTIVE) {
            activeCodes += 1;
          } else {
            expiredCodes += 1;
          }

          if (isNew) {
            newCodes.push(code);
          }

          const redeemStatus = existing
            ? normalizeRedeemStatus({
                redeemStatus: existing.redeem_status as RedeemStatusValue,
                message: existing.message ?? undefined,
              })
            : RedeemStatus.PENDING;

          upsertCodeStmt.run({
            code,
            game_id: options.gameId,
            wiki_status: scrapedEntry.status,
            redeem_status: redeemStatus,
            message: existing?.message ?? null,
            scraped_at: now,
            attempted_at: existing?.attempted_at ?? null,
            source: options.source,
          });
        }

        upsertMetaStmt.run({
          game_id: options.gameId,
          last_scrape_date: getTodayRunDate(),
          last_scraped_at: now,
        });
      });

      mergeAll();

      return { newCodes, activeCodes, expiredCodes };
    },

    async getRedeemResumeStats(gameId: GameIdValue) {
      const { selectCodesStmt } = getContext(gameId);
      const rows = selectCodesStmt.all(gameId) as CodeRow[];
      const toRedeem = getRedeemableFromRows(rows);
      const activeCount = rows.filter(
        (row) => row.wiki_status === CodeStatus.ACTIVE,
      ).length;

      return {
        toRedeem,
        skipped: activeCount - toRedeem.length,
      };
    },

    async hasRedeemableCodes(gameId: GameIdValue): Promise<boolean> {
      const { selectCodesStmt } = getContext(gameId);
      const rows = selectCodesStmt.all(gameId) as CodeRow[];
      return getRedeemableFromRows(rows).length > 0;
    },

    async persistRedeemResult(
      options: PersistRedeemResultOptions,
    ): Promise<void> {
      const { updateRedeemStmt } = getContext(options.gameId);
      const result: CodeRedeemResult = options.result;

      if (
        result.status !== RedeemStatus.REDEEMED &&
        result.status !== RedeemStatus.EXPIRED
      ) {
        return;
      }

      const code = normalizeCodeValue(result.code);
      updateRedeemStmt.run({
        game_id: options.gameId,
        code,
        redeem_status: result.status,
        message: result.message,
        attempted_at: new Date().toISOString(),
      });
    },
  };
}
