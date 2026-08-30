import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '../../../lib/database';

export async function GET() {
  await ensureDatabase();
  const totals = await env.DB.prepare(
    `SELECT
      SUM(CASE WHEN event_type = 'analysis_completed' THEN 1 ELSE 0 END) AS analyses,
      SUM(CASE WHEN event_type = 'submission_completed' THEN 1 ELSE 0 END) AS submissions,
      SUM(CASE WHEN event_type = 'helpful_yes' THEN 1 ELSE 0 END) AS helpful_yes,
      SUM(CASE WHEN event_type IN ('helpful_yes','helpful_no') THEN 1 ELSE 0 END) AS helpful_total,
      SUM(CASE WHEN event_type = 'skill_clicked' THEN 1 ELSE 0 END) AS skill_clicks
    FROM events`,
  ).first();
  const categoryRows = await env.DB.prepare(
    `SELECT category, COUNT(*) AS count FROM events
     WHERE event_type = 'analysis_completed' AND category IS NOT NULL
     GROUP BY category ORDER BY count DESC`,
  ).all();
  const trendRows = await env.DB.prepare(
    `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count FROM events
     WHERE event_type = 'analysis_completed' AND created_at >= datetime('now', '-30 days')
     GROUP BY day ORDER BY day ASC`,
  ).all();
  const pending = await env.DB.prepare(`SELECT COUNT(*) AS count FROM submissions WHERE status = 'pending'`).first();
  return NextResponse.json({
    totals: {
      analyses: Number(totals?.analyses ?? 0),
      submissions: Number(totals?.submissions ?? 0),
      helpfulRate: Number(totals?.helpful_total ?? 0) > 0 ? Number(totals?.helpful_yes ?? 0) / Number(totals?.helpful_total) : 0,
      skillClicks: Number(totals?.skill_clicks ?? 0),
      pending: Number(pending?.count ?? 0),
    },
    categories: categoryRows.results,
    trend: trendRows.results,
    freshness: new Date().toISOString(),
  });
}
