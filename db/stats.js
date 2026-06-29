'use strict';
// ════════════════════════════════════════════════════════
// GAME STATS DATABASE
// SQLite-backed event logging for game analytics.
// Designed to never block or slow down gameplay:
//  - All writes are synchronous but extremely fast (SQLite + WAL mode)
//  - Every write is wrapped in try/catch so a logging failure
//    can NEVER crash or interrupt an active game
//  - Call sites should treat insertEvent() as fire-and-forget
// ════════════════════════════════════════════════════════

const path     = require('path');
const fs       = require('fs');
const Database = require('better-sqlite3');

// ─── Resolve the correct DB file path per environment ──────────
// RAILWAY_SERVICE_NAME distinguishes staging from production
// (RAILWAY_ENVIRONMENT_NAME is NOT reliable here — both services
// report "production" since staging is a separate service, not a
// separate Railway environment).
const SERVICE_NAME = process.env.RAILWAY_SERVICE_NAME || 'local';

function resolveDbFilename() {
  if (SERVICE_NAME === 'panstwa-miasta') return 'game_stats.db';
  if (SERVICE_NAME === 'magnificent-reverence') return 'game_stats_staging.db';
  // Local dev fallback — keep separate from anything that could
  // ever be mistaken for real data.
  return 'game_stats_local.db';
}

// /data is the mount path of the Railway persistent volume.
// Falls back to a local ./data folder for local development,
// where no volume exists.
const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(__dirname, '..', 'data-local');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) { /* best effort */ }
}

const DB_PATH = path.join(DATA_DIR, resolveDbFilename());

let db = null;

function getDb() {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS whoami_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code   TEXT,
      ts          INTEGER NOT NULL,
      lang        TEXT,
      category    TEXT,
      difficulty  TEXT,
      character   TEXT,
      outcome     TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_whoami_ts        ON whoami_events(ts);
    CREATE INDEX IF NOT EXISTS idx_whoami_outcome    ON whoami_events(outcome);
    CREATE INDEX IF NOT EXISTS idx_whoami_character  ON whoami_events(character);
  `);
  return db;
}

let insertWhoamiStmt = null;

/**
 * Log a Who Am I character outcome. Fire-and-forget — never throws,
 * never blocks. Safe to call from any socket handler without
 * affecting game responsiveness.
 */
function logWhoamiEvent({ roomCode, lang, category, difficulty, character, outcome }) {
  try {
    const conn = getDb();
    if (!insertWhoamiStmt) {
      insertWhoamiStmt = conn.prepare(`
        INSERT INTO whoami_events (room_code, ts, lang, category, difficulty, character, outcome)
        VALUES (@roomCode, @ts, @lang, @category, @difficulty, @character, @outcome)
      `);
    }
    insertWhoamiStmt.run({
      roomCode:   roomCode   || null,
      ts:         Date.now(),
      lang:       lang       || null,
      category:   category   || null,
      difficulty: difficulty || null,
      character:  character  || null,
      outcome
    });
  } catch (err) {
    // Logging must never break the game. Swallow and report only.
    console.error('[stats] whoami event log failed:', err.message);
  }
}

module.exports = {
  getDb,
  logWhoamiEvent,
  DB_PATH, // exposed for debugging/health-check purposes
};
