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
      SUM(CASE WHEN event_type = 'skill_clicked' THEN 1 ELSE 0 END) AS skill_clicks,
      SUM(CASE WHEN event_type = 'analysis_started' AND visitor_id IS NOT NULL THEN 1 ELSE 0 END) AS tracked_starts,
      SUM(CASE WHEN event_type = 'analysis_completed' AND visitor_id IS NOT NULL THEN 1 ELSE 0 END) AS tracked_completions,
      SUM(CASE WHEN event_type = 'analysis_failed' AND visitor_id IS NOT NULL THEN 1 ELSE 0 END) AS tracked_failures,
      COUNT(DISTINCT CASE WHEN event_type = 'analysis_completed' AND visitor_id IS NOT NULL AND created_at >= datetime('now', '-30 days') THEN visitor_id END) AS active_devices_30d
    FROM events`,
  ).first();
  const categoryRows = await env.DB.prepare(
    `SELECT CASE category
       WHEN '否定勸退型' THEN '否定／貶低'
       WHEN '年齡／時間焦慮型' THEN '急迫／恐嚇'
       WHEN '經驗權威型' THEN '權威施壓'
       WHEN '恐嚇急迫型' THEN '急迫／恐嚇'
       WHEN '過來人合理化型' THEN '善意包裝'
       WHEN '比較型' THEN '比較／群體壓力'
       ELSE category END AS category, COUNT(*) AS count FROM events
     WHERE event_type = 'analysis_completed' AND category IS NOT NULL
     GROUP BY 1 ORDER BY count DESC`,
  ).all();
  const tagRows = await env.DB.prepare(
    `SELECT category AS tag, COUNT(*) AS count FROM events
     WHERE event_type = 'analysis_tag' AND category IS NOT NULL
     GROUP BY category ORDER BY count DESC`,
  ).all();
  const contextRows = await env.DB.prepare(
    `SELECT context_type AS context, COUNT(*) AS count FROM events
     WHERE event_type = 'analysis_completed' AND context_type IS NOT NULL
     GROUP BY context_type ORDER BY count DESC`,
  ).all();
  const crossRows = await env.DB.prepare(
    `SELECT CASE category
       WHEN '否定勸退型' THEN '否定／貶低'
       WHEN '年齡／時間焦慮型' THEN '急迫／恐嚇'
       WHEN '經驗權威型' THEN '權威施壓'
       WHEN '恐嚇急迫型' THEN '急迫／恐嚇'
       WHEN '過來人合理化型' THEN '善意包裝'
       WHEN '比較型' THEN '比較／群體壓力'
       ELSE category END AS category,
       context_type AS context, COUNT(*) AS count
     FROM events
     WHERE event_type = 'analysis_completed' AND category IS NOT NULL AND context_type IS NOT NULL
     GROUP BY 1, context_type ORDER BY count DESC`,
  ).all();
  const trendRows = await env.DB.prepare(
    `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count FROM events
     WHERE event_type = 'analysis_completed' AND created_at >= datetime('now', '-30 days')
     GROUP BY day ORDER BY day ASC`,
  ).all();
  const pending = await env.DB.prepare(`SELECT COUNT(*) AS count FROM submissions WHERE status = 'pending'`).first();
  const feedbackRows = await env.DB.prepare(
    `SELECT event_label AS label, COUNT(*) AS count FROM events
     WHERE event_type = 'feedback_reason' AND event_label IS NOT NULL
     GROUP BY event_label ORDER BY count DESC`,
  ).all();
  const trackedStarts = Number(totals?.tracked_starts ?? 0);
  return NextResponse.json({
    totals: {
      analyses: Number(totals?.analyses ?? 0),
      submissions: Number(totals?.submissions ?? 0),
      helpfulRate: Number(totals?.helpful_total ?? 0) > 0 ? Number(totals?.helpful_yes ?? 0) / Number(totals?.helpful_total) : 0,
      skillClicks: Number(totals?.skill_clicks ?? 0),
      pending: Number(pending?.count ?? 0),
      activeDevices30d: Number(totals?.active_devices_30d ?? 0),
      trackedStarts,
      trackedCompletions: Number(totals?.tracked_completions ?? 0),
      trackedFailures: Number(totals?.tracked_failures ?? 0),
      completionRate: trackedStarts > 0 ? Number(totals?.tracked_completions ?? 0) / trackedStarts : 0,
    },
    categories: categoryRows.results,
    tags: tagRows.results,
    contexts: contextRows.results,
    cross: crossRows.results,
    trend: trendRows.results,
    feedbackReasons: feedbackRows.results,
    freshness: new Date().toISOString(),
  });
}
