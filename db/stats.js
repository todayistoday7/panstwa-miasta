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
    CREATE TABLE IF NOT EXISTS game_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      game        TEXT NOT NULL,
      room_code   TEXT,
      ts          INTEGER NOT NULL,
      date        TEXT NOT NULL,
      lang        TEXT,
      outcome     TEXT NOT NULL,
      details     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_game_date    ON game_events(game, date);
    CREATE INDEX IF NOT EXISTS idx_game_outcome ON game_events(game, outcome);

    CREATE TABLE IF NOT EXISTS room_history (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      game         TEXT NOT NULL,
      room_code    TEXT NOT NULL,
      created_ts   INTEGER NOT NULL,
      ended_ts     INTEGER,
      lang         TEXT,
      is_public    INTEGER NOT NULL DEFAULT 0,
      player_count INTEGER NOT NULL DEFAULT 1,
      status       TEXT NOT NULL DEFAULT 'lobby'
    );
    CREATE INDEX IF NOT EXISTS idx_rh_game ON room_history(game, created_ts DESC);
  `);
  return db;
}

let insertStmt = null;

/**
 * Log a game event. Fire-and-forget — never throws, never blocks.
 * Safe to call from any socket handler without affecting game
 * responsiveness.
 *
 * @param {string} game       - short game id, e.g. 'whoami', 'dots', 'charades'
 * @param {string} roomCode
 * @param {string} lang
 * @param {string} outcome    - what happened, meaning is game-specific
 *                               (e.g. 'guessed' / 'skipped' for whoami)
 * @param {object} details    - any other game-specific fields
 *                               (e.g. { character, category, difficulty })
 */
function logGameEvent({ game, roomCode, lang, outcome, details }) {
  try {
    const conn = getDb();
    if (!insertStmt) {
      insertStmt = conn.prepare(`
        INSERT INTO game_events (game, room_code, ts, date, lang, outcome, details)
        VALUES (@game, @roomCode, @ts, @date, @lang, @outcome, @details)
      `);
    }
    const now = new Date();
    insertStmt.run({
      game,
      roomCode: roomCode || null,
      ts:       now.getTime(),
      date:     now.toISOString().slice(0, 10), // YYYY-MM-DD, UTC
      lang:     lang || null,
      outcome,
      details:  details ? JSON.stringify(details) : null,
    });
  } catch (err) {
    // Logging must never break the game. Swallow and report only.
    console.error(`[stats] ${game || 'unknown'} event log failed:`, err.message);
  }
}

/**
 * Back-compat wrapper for the original Who Am I specific call shape,
 * so existing call sites in routes/whoami.js don't need to change.
 */
function logWhoamiEvent({ roomCode, lang, category, difficulty, character, outcome }) {
  logGameEvent({
    game: 'whoami',
    roomCode,
    lang,
    outcome,
    details: { character, category, difficulty },
  });
}

/**
 * Log a room being created. Call once at room creation.
 */
function logRoomCreated({ game, roomCode, lang, isPublic }) {
  try {
    const conn = getDb();
    conn.prepare(`
      INSERT OR IGNORE INTO room_history (game, room_code, created_ts, lang, is_public, player_count, status)
      VALUES (?, ?, ?, ?, ?, 1, 'lobby')
    `).run(game, roomCode, Date.now(), lang || null, isPublic ? 1 : 0);
  } catch (err) {
    console.error(`[stats] logRoomCreated failed:`, err.message);
  }
}

/**
 * Update room status when game ends or room is deleted.
 * status: 'playing' | 'ended'
 */
function logRoomEnded({ roomCode, playerCount, status }) {
  try {
    const conn = getDb();
    conn.prepare(`
      UPDATE room_history
      SET ended_ts = ?, player_count = ?, status = ?
      WHERE room_code = ?
    `).run(Date.now(), playerCount || 1, status || 'ended', roomCode);
  } catch (err) {
    console.error(`[stats] logRoomEnded failed:`, err.message);
  }
}

module.exports = {
  getDb,
  logGameEvent,
  logWhoamiEvent,
  logRoomCreated,
  logRoomEnded,
  DB_PATH,
};
