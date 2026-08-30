import { env } from 'cloudflare:workers';

let initialized: Promise<void> | null = null;

export function ensureDatabase() {
  if (!initialized) initialized = initialize();
  return initialized;
}

async function initialize() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      category TEXT,
      context_type TEXT,
      created_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      statement TEXT NOT NULL,
      context TEXT NOT NULL,
      primary_category TEXT NOT NULL,
      secondary_categories TEXT NOT NULL DEFAULT '[]',
      interpretation TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      privacy_confirmed INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_events_type_created ON events(event_type, created_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_events_category ON events(category)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON submissions(status, created_at)'),
  ]);
}
