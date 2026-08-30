import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { categories } from '../../../lib/decoder';
import { ensureDatabase } from '../../../lib/database';

export async function POST(request: Request) {
  await ensureDatabase();
  const body = await request.json().catch(() => null) as {
    statement?: string; context?: string; primaryCategory?: string;
    secondaryCategories?: string[]; interpretation?: string; privacyConfirmed?: boolean;
  } | null;
  const statement = body?.statement?.trim() ?? '';
  const context = body?.context?.trim() ?? '';
  if (statement.length < 2 || statement.length > 500 || context.length < 2 || context.length > 300) {
    return NextResponse.json({ error: '請完整填寫話術與一句話情境。' }, { status: 400 });
  }
  if (!body?.privacyConfirmed) {
    return NextResponse.json({ error: '請確認內容已匿名化。' }, { status: 400 });
  }
  const primaryCategory = categories.includes(body.primaryCategory as never) ? body.primaryCategory! : '待分類';
  const secondary = (body.secondaryCategories ?? []).filter((item) => categories.includes(item as never)).slice(0, 3);
  await env.DB.prepare(
    'INSERT INTO submissions (statement, context, primary_category, secondary_categories, interpretation, status, privacy_confirmed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).bind(statement, context, primaryCategory, JSON.stringify(secondary), body.interpretation?.trim() || null, 'pending', 1, new Date().toISOString()).run();
  await env.DB.prepare('INSERT INTO events (event_type, category, context_type, created_at) VALUES (?, ?, ?, ?)')
    .bind('submission_completed', primaryCategory, null, new Date().toISOString()).run();
  return NextResponse.json({ ok: true });
}
