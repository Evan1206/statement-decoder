import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '../../../../lib/database';

export const dynamic = 'force-dynamic';

type Row = Record<string, string | number | null>;

function csv(rows: Array<Array<string | number | null>>) {
  const escaped = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
  return `\uFEFF${escaped}`;
}

function response(rows: Array<Array<string | number | null>>) {
  return new Response(csv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const configuredKey = (env as unknown as { SHEETS_EXPORT_KEY?: string }).SHEETS_EXPORT_KEY;
  if (!configuredKey || url.searchParams.get('key') !== configuredKey) {
    return NextResponse.json({ error: '未授權。' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  await ensureDatabase();
  const view = url.searchParams.get('view');

  if (view === 'summary') {
    const totals = await env.DB.prepare(`SELECT
      SUM(CASE WHEN event_type='analysis_completed' THEN 1 ELSE 0 END) analyses,
      SUM(CASE WHEN event_type='submission_completed' THEN 1 ELSE 0 END) submissions,
      SUM(CASE WHEN event_type='analysis_started' AND visitor_id IS NOT NULL THEN 1 ELSE 0 END) starts,
      SUM(CASE WHEN event_type='analysis_completed' AND visitor_id IS NOT NULL THEN 1 ELSE 0 END) completions,
      SUM(CASE WHEN event_type='analysis_failed' AND visitor_id IS NOT NULL THEN 1 ELSE 0 END) failures,
      SUM(CASE WHEN event_type='helpful_yes' THEN 1 ELSE 0 END) helpful_yes,
      SUM(CASE WHEN event_type IN ('helpful_yes','helpful_no') THEN 1 ELSE 0 END) helpful_total,
      SUM(CASE WHEN event_type='skill_clicked' THEN 1 ELSE 0 END) skill_clicks,
      COUNT(DISTINCT CASE WHEN event_type='analysis_completed' AND visitor_id IS NOT NULL AND created_at >= datetime('now','-30 days') THEN visitor_id END) active_devices_30d
      FROM events`).first<Row>();
    const pending = await env.DB.prepare(`SELECT COUNT(*) count FROM submissions WHERE status='pending'`).first<Row>();
    const starts = Number(totals?.starts ?? 0);
    const completions = Number(totals?.completions ?? 0);
    const helpfulTotal = Number(totals?.helpful_total ?? 0);
    return response([
      ['指標', '數值', '定義'],
      ['累計完成解碼', Number(totals?.analyses ?? 0), '每次成功完成解碼計一次'],
      ['近 30 天匿名裝置', Number(totals?.active_devices_30d ?? 0), '30 天隨機裝置代碼去重，不等於人數'],
      ['新埋點解碼開始', starts, '帶匿名代碼的開始事件'],
      ['新埋點解碼完成', completions, '帶匿名代碼的完成事件'],
      ['解碼完成率', starts ? completions / starts : 0, '新埋點完成 ÷ 開始'],
      ['解碼失敗', Number(totals?.failures ?? 0), '網路或服務回應失敗'],
      ['有幫助率', helpfulTotal ? Number(totals?.helpful_yes ?? 0) / helpfulTotal : 0, '有幫助 ÷ 全部正負回饋'],
      ['匿名投稿', Number(totals?.submissions ?? 0), '成功寫入待審核資料表'],
      ['待審核投稿', Number(pending?.count ?? 0), '目前狀態為 pending'],
      ['Skill 導流', Number(totals?.skill_clicks ?? 0), '前往 GitHub 的點擊'],
      ['更新時間', new Date().toISOString(), 'UTC ISO 8601'],
    ]);
  }

  if (view === 'classifications') {
    const rows = await env.DB.prepare(`SELECT '主要機制' dimension, category label, COUNT(*) count FROM events WHERE event_type='analysis_completed' AND category IS NOT NULL GROUP BY category
      UNION ALL SELECT '次要標籤', category, COUNT(*) FROM events WHERE event_type='analysis_tag' AND category IS NOT NULL GROUP BY category
      UNION ALL SELECT '情境', context_type, COUNT(*) FROM events WHERE event_type='analysis_completed' AND context_type IS NOT NULL GROUP BY context_type
      ORDER BY dimension, count DESC`).all<Row>();
    return response([['維度', '名稱', '次數'], ...rows.results.map((row) => [row.dimension, row.label, row.count])]);
  }

  if (view === 'feedback') {
    const rows = await env.DB.prepare(`SELECT created_at, category, context_type, event_label FROM events WHERE event_type='feedback_reason' ORDER BY created_at DESC LIMIT 2000`).all<Row>();
    return response([['時間', '主要機制', '情境', '改善原因'], ...rows.results.map((row) => [row.created_at, row.category, row.context_type, row.event_label])]);
  }

  if (view === 'submissions') {
    const rows = await env.DB.prepare(`SELECT created_at, statement, context, primary_category, interpretation, status FROM submissions ORDER BY created_at DESC LIMIT 2000`).all<Row>();
    return response([['投稿時間', '匿名話術原文', '情境', '主要分類', '投稿者解讀', '審核狀態'], ...rows.results.map((row) => [row.created_at, row.statement, row.context, row.primary_category, row.interpretation, row.status])]);
  }

  return NextResponse.json({ error: '不支援的資料檢視。' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
}
