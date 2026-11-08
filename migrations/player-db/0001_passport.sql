-- Squatch Passport v1. Apply to a dedicated PLAYER_DB D1 binding before enabling identity routes.
-- No browser-submitted score becomes verified merely because a player signs in.
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
  leaderboard_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (leaderboard_opt_in IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS player_identities (
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider, provider_subject),
  UNIQUE (provider, player_id)
);
CREATE TABLE IF NOT EXISTS player_sessions (
  token_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS player_sessions_by_player ON player_sessions(player_id, expires_at);
CREATE TABLE IF NOT EXISTS player_favorites (
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, game_id)
);
CREATE INDEX IF NOT EXISTS player_favorites_by_game ON player_favorites(game_id);
