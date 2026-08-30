import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { decodeStatement } from '../../../lib/decoder';
import { ensureDatabase } from '../../../lib/database';

export async function POST(request: Request) {
  await ensureDatabase();
  const body = await request.json().catch(() => null) as { statement?: string; contextType?: string } | null;
  const statement = body?.statement?.trim() ?? '';
  if (statement.length < 2 || statement.length > 500) {
    return NextResponse.json({ error: '請輸入 2–500 字的話語。' }, { status: 400 });
  }
  const result = decodeStatement(statement);
  const createdAt = new Date().toISOString();
  const contextType = body?.contextType ?? null;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO events (event_type, category, context_type, created_at) VALUES (?, ?, ?, ?)')
      .bind('analysis_completed', result.primary, contextType, createdAt),
    ...result.secondary.map((tag) => env.DB.prepare('INSERT INTO events (event_type, category, context_type, created_at) VALUES (?, ?, ?, ?)')
      .bind('analysis_tag', tag, contextType, createdAt)),
  ]);
  return NextResponse.json(result);
}
