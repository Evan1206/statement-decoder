import { env } from 'cloudflare:workers';
import Link from 'next/link';
import { ensureDatabase } from '../../lib/database';

export const dynamic = 'force-dynamic';

type Row = Record<string, string | number | null>;

async function loadMetrics() {
  try {
    await ensureDatabase();
    const totals = await env.DB.prepare(`SELECT
      SUM(CASE WHEN event_type='analysis_completed' THEN 1 ELSE 0 END) analyses,
      SUM(CASE WHEN event_type='submission_completed' THEN 1 ELSE 0 END) submissions,
      SUM(CASE WHEN event_type='helpful_yes' THEN 1 ELSE 0 END) helpful_yes,
      SUM(CASE WHEN event_type IN ('helpful_yes','helpful_no') THEN 1 ELSE 0 END) helpful_total,
      SUM(CASE WHEN event_type='skill_clicked' THEN 1 ELSE 0 END) skill_clicks
      FROM events`).first<Row>();
    const pending = await env.DB.prepare(`SELECT COUNT(*) count FROM submissions WHERE status='pending'`).first<Row>();
    const categories = await env.DB.prepare(`SELECT category, COUNT(*) count FROM events WHERE event_type='analysis_completed' AND category IS NOT NULL GROUP BY category ORDER BY count DESC`).all<Row>();
    const trend = await env.DB.prepare(`SELECT substr(created_at,1,10) day, COUNT(*) count FROM events WHERE event_type='analysis_completed' AND created_at >= datetime('now','-30 days') GROUP BY day ORDER BY day`).all<Row>();
    return { totals, pending: Number(pending?.count ?? 0), categories: categories.results, trend: trend.results, ready: true };
  } catch {
    return { totals: {}, pending: 0, categories: [], trend: [], ready: false };
  }
}

export default async function Dashboard() {
  const data = await loadMetrics();
  const analyses = Number(data.totals?.analyses ?? 0);
  const helpfulTotal = Number(data.totals?.helpful_total ?? 0);
  const helpfulRate = helpfulTotal ? Number(data.totals?.helpful_yes ?? 0) / helpfulTotal : 0;
  const maxCategory = Math.max(1, ...data.categories.map((row) => Number(row.count)));
  const maxTrend = Math.max(1, ...data.trend.map((row) => Number(row.count)));

  return <main className="dashboard">
    <header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">慢</span><span>修但幾咧～真的是這樣嗎？ 🤔💛</span></Link><Link href="/">← 回到解碼器</Link></header>
    <section className="dashboard-heading">
      <div><span className="section-kicker">LIVE PRODUCT METRICS</span><h1>使用與投稿概況</h1><p>只呈現彙總事件，不顯示使用者輸入的原始話語。</p></div>
      <span className={data.ready ? 'status-ready' : 'status-empty'}>{data.ready ? '資料庫已連線' : '等待第一筆資料'}</span>
    </section>
    <section className="metric-strip">
      <article><span>完成解碼</span><strong>{analyses}</strong><small>累計 analysis_completed 事件</small></article>
      <article><span>匿名投稿</span><strong>{Number(data.totals?.submissions ?? 0)}</strong><small>成功送出的投稿</small></article>
      <article><span>有幫助率</span><strong>{(helpfulRate * 100).toFixed(0)}%</strong><small>有幫助 ÷ 全部回饋</small></article>
      <article><span>Skill 導流</span><strong>{Number(data.totals?.skill_clicks ?? 0)}</strong><small>前往 GitHub 的點擊</small></article>
      <article><span>待審核</span><strong>{data.pending}</strong><small>尚未公開的投稿</small></article>
    </section>
    <section className="dashboard-grid">
      <article className="chart-card">
        <div><h2>解碼類型分布</h2><p>來源：events；篩選 analysis_completed</p></div>
        <div className="bar-chart">{data.categories.length ? data.categories.map((row) => <div className="bar-row" key={String(row.category)}><span>{row.category}</span><div><i style={{ width: `${Number(row.count) / maxCategory * 100}%` }} /></div><strong>{row.count}</strong></div>) : <p className="empty">完成第一筆解碼後，這裡會顯示分類分布。</p>}</div>
      </article>
      <article className="chart-card">
        <div><h2>近 30 日解碼量</h2><p>依事件建立日期彙總，每日一筆</p></div>
        <div className="trend-chart">{data.trend.length ? data.trend.map((row) => <div key={String(row.day)} title={`${row.day}: ${row.count}`}><i style={{ height: `${Math.max(8, Number(row.count) / maxTrend * 100)}%` }} /><span>{String(row.day).slice(5)}</span></div>) : <p className="empty">目前尚無趨勢資料。</p>}</div>
      </article>
    </section>
    <section className="metric-notes"><h2>指標定義</h2><dl><div><dt>完成解碼</dt><dd>每次後端成功回傳五步驟結果計一次，不以訪客或裝置去重。</dd></div><div><dt>有幫助率</dt><dd>點選「有幫助」次數除以所有正負回饋；沒有回饋時顯示 0%。</dd></div><div><dt>匿名投稿</dt><dd>通過必填與匿名化確認、成功寫入待審核資料表的投稿。</dd></div></dl><p>更新時間：{new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p></section>
  </main>;
}
