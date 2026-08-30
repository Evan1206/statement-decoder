import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '../../../lib/database';

const allowedEvents = new Set(['page_view', 'sample_selected', 'skill_clicked', 'helpful_yes', 'helpful_no', 'submission_opened', 'analysis_started', 'analysis_failed', 'feedback_reason']);
const feedbackReasons = new Set(['分類不準', '分析太籠統', '過度推測對方', '忽略合理建議', '語氣不舒服', '其他']);
const errorLabels = new Set(['network', 'invalid_response', 'http_400', 'http_500']);

function validVisitorId(value?: string) {
  return value && /^[a-zA-Z0-9-]{8,80}$/.test(value) ? value : null;
}

export async function POST(request: Request) {
  await ensureDatabase();
  const body = await request.json().catch(() => null) as { eventType?: string; category?: string; contextType?: string; visitorId?: string; label?: string } | null;
  if (!body?.eventType || !allowedEvents.has(body.eventType)) {
    return NextResponse.json({ error: '不支援的事件。' }, { status: 400 });
  }
  const label = body.eventType === 'feedback_reason'
    ? (feedbackReasons.has(body.label ?? '') ? body.label : null)
    : body.eventType === 'analysis_failed'
      ? (errorLabels.has(body.label ?? '') ? body.label : 'invalid_response')
      : null;
  if (body.eventType === 'feedback_reason' && !label) {
    return NextResponse.json({ error: '不支援的回饋原因。' }, { status: 400 });
  }
  await env.DB.prepare('INSERT INTO events (event_type, category, context_type, visitor_id, event_label, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(body.eventType, body.category ?? null, body.contextType ?? null, validVisitorId(body.visitorId), label, new Date().toISOString()).run();
  return NextResponse.json({ ok: true });
}
