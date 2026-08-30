import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { decodeStatement } from '../../../lib/decoder';
import { ensureDatabase } from '../../../lib/database';

export async function POST(request: Request) {
  await ensureDatabase();
  const body = await request.json().catch(() => null) as { statement?: string; contextType?: string; visitorId?: string } | null;
  const statement = body?.statement?.trim() ?? '';
  if (statement.length < 2 || statement.length > 500) {
    return NextResponse.json({ error: '請輸入 2–500 字的話語。' }, { status: 400 });
  }
  const result = decodeStatement(statement);
  const createdAt = new Date().toISOString();
  const contextType = body?.contextType ?? null;
  const visitorId = body?.visitorId && /^[a-zA-Z0-9-]{8,80}$/.test(body.visitorId) ? body.visitorId : null;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO events (event_type, category, context_type, visitor_id, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind('analysis_completed', result.primary, contextType, visitorId, createdAt),
    ...result.secondary.map((tag) => env.DB.prepare('INSERT INTO events (event_type, category, context_type, visitor_id, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind('analysis_tag', tag, contextType, visitorId, createdAt)),
  ]);
  return NextResponse.json(result);
}
