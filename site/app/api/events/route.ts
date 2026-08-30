import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '../../../lib/database';

const allowedEvents = new Set(['page_view', 'sample_selected', 'skill_clicked', 'helpful_yes', 'helpful_no', 'submission_opened']);

export async function POST(request: Request) {
  await ensureDatabase();
  const body = await request.json().catch(() => null) as { eventType?: string; category?: string; contextType?: string } | null;
  if (!body?.eventType || !allowedEvents.has(body.eventType)) {
    return NextResponse.json({ error: '不支援的事件。' }, { status: 400 });
  }
  await env.DB.prepare('INSERT INTO events (event_type, category, context_type, created_at) VALUES (?, ?, ?, ?)')
    .bind(body.eventType, body.category ?? null, body.contextType ?? null, new Date().toISOString()).run();
  return NextResponse.json({ ok: true });
}
