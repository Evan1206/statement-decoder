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
    const categoryCase = `CASE category WHEN '否定勸退型' THEN '否定／貶低' WHEN '年齡／時間焦慮型' THEN '急迫／恐嚇' WHEN '經驗權威型' THEN '權威施壓' WHEN '恐嚇急迫型' THEN '急迫／恐嚇' WHEN '過來人合理化型' THEN '善意包裝' WHEN '比較型' THEN '比較／群體壓力' ELSE category END`;
    const categories = await env.DB.prepare(`SELECT ${categoryCase} category, COUNT(*) count FROM events WHERE event_type='analysis_completed' AND category IS NOT NULL GROUP BY 1 ORDER BY count DESC`).all<Row>();
    const tags = await env.DB.prepare(`SELECT category tag, COUNT(*) count FROM events WHERE event_type='analysis_tag' AND category IS NOT NULL GROUP BY category ORDER BY count DESC`).all<Row>();
    const contexts = await env.DB.prepare(`SELECT context_type context, COUNT(*) count FROM events WHERE event_type='analysis_completed' AND context_type IS NOT NULL GROUP BY context_type ORDER BY count DESC`).all<Row>();
    const cross = await env.DB.prepare(`SELECT ${categoryCase} category, context_type context, COUNT(*) count FROM events WHERE event_type='analysis_completed' AND category IS NOT NULL AND context_type IS NOT NULL GROUP BY 1, context_type ORDER BY count DESC`).all<Row>();
    const trend = await env.DB.prepare(`SELECT substr(created_at,1,10) day, COUNT(*) count FROM events WHERE event_type='analysis_completed' AND created_at >= datetime('now','-30 days') GROUP BY day ORDER BY day`).all<Row>();
    return { totals, pending: Number(pending?.count ?? 0), categories: categories.results, tags: tags.results, contexts: contexts.results, cross: cross.results, trend: trend.results, ready: true };
  } catch {
    return { totals: {}, pending: 0, categories: [], tags: [], contexts: [], cross: [], trend: [], ready: false };
  }
}

export default async function Dashboard() {
  const data = await loadMetrics();
  const analyses = Number(data.totals?.analyses ?? 0);
  const helpfulTotal = Number(data.totals?.helpful_total ?? 0);
  const helpfulRate = helpfulTotal ? Number(data.totals?.helpful_yes ?? 0) / helpfulTotal : 0;
  const maxCategory = Math.max(1, ...data.categories.map((row) => Number(row.count)));
  const maxTag = Math.max(1, ...data.tags.map((row) => Number(row.count)));
  const maxContext = Math.max(1, ...data.contexts.map((row) => Number(row.count)));
  const maxCross = Math.max(1, ...data.cross.map((row) => Number(row.count)));
  const maxTrend = Math.max(1, ...data.trend.map((row) => Number(row.count)));
  const crossCategories = [...new Set(data.cross.map((row) => String(row.category)))];
  const crossContexts = [...new Set(data.cross.map((row) => String(row.context)))];
  const crossCount = (category: string, context: string) => Number(data.cross.find((row) => row.category === category && row.context === context)?.count ?? 0);

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
        <div><h2>最常遇到的話術機制</h2><p>每次完成解碼計一次；舊版分類已對應至新機制</p></div>
        <div className="bar-chart">{data.categories.length ? data.categories.map((row) => <div className="bar-row" key={String(row.category)}><span>{row.category}</span><div><i style={{ width: `${Number(row.count) / maxCategory * 100}%` }} /></div><strong>{row.count}</strong></div>) : <p className="empty">完成第一筆解碼後，這裡會顯示分類分布。</p>}</div>
      </article>
      <article className="chart-card">
        <div><h2>最常出現的次要標籤</h2><p>每次解碼可同時包含多個標籤，因此總數可能高於解碼數</p></div>
        <div className="bar-chart tag-chart">{data.tags.length ? data.tags.map((row) => <div className="bar-row" key={String(row.tag)}><span>{row.tag}</span><div><i style={{ width: `${Number(row.count) / maxTag * 100}%` }} /></div><strong>{row.count}</strong></div>) : <p className="empty">新版解碼累積標籤後，這裡會顯示分布。</p>}</div>
      </article>
      <article className="chart-card">
        <div><h2>最常遇到的情境</h2><p>使用者在解碼前主動選擇的情境標籤</p></div>
        <div className="bar-chart context-chart">{data.contexts.length ? data.contexts.map((row) => <div className="bar-row" key={String(row.context)}><span>{row.context}</span><div><i style={{ width: `${Number(row.count) / maxContext * 100}%` }} /></div><strong>{row.count}</strong></div>) : <p className="empty">完成第一筆帶情境的解碼後，這裡會顯示情境分布。</p>}</div>
      </article>
      <article className="chart-card">
        <div><h2>近 30 日解碼量</h2><p>依事件建立日期彙總，每日一筆</p></div>
        <div className="trend-chart">{data.trend.length ? data.trend.map((row) => <div key={String(row.day)} title={`${row.day}: ${row.count}`}><i style={{ height: `${Math.max(8, Number(row.count) / maxTrend * 100)}%` }} /><span>{String(row.day).slice(5)}</span></div>) : <p className="empty">目前尚無趨勢資料。</p>}</div>
      </article>
    </section>
    <section className="heatmap-card">
      <div><h2>情境 × 話術機制</h2><p>顏色越深，代表該情境下完成解碼的次數越多；只呈現彙總數，不顯示原句。</p></div>
      {crossCategories.length && crossContexts.length ? <div className="heatmap-wrap"><table className="heatmap"><thead><tr><th>話術機制</th>{crossContexts.map((context) => <th key={context}>{context}</th>)}</tr></thead><tbody>{crossCategories.map((category) => <tr key={category}><th>{category}</th>{crossContexts.map((context) => { const count = crossCount(category, context); return <td key={context} title={`${category} × ${context}：${count}`} style={{ backgroundColor: count ? `rgba(243,111,67,${0.14 + count / maxCross * 0.76})` : undefined }}>{count || '—'}</td>; })}</tr>)}</tbody></table></div> : <p className="empty">累積帶有情境與分類的解碼後，這裡會出現交叉分析。</p>}
    </section>
    <section className="metric-notes"><h2>指標定義</h2><dl><div><dt>話術機制</dt><dd>每次成功解碼的主要分類；一筆解碼只計一個主要機制。</dd></div><div><dt>次要標籤</dt><dd>同一筆解碼可有零至三個標籤，因此不可與解碼總數直接相加比較。</dd></div><div><dt>情境交叉</dt><dd>以完成解碼事件為統計單位，依主要機制與使用者選擇的情境分組；未選或舊資料缺值不納入。</dd></div><div><dt>有幫助率</dt><dd>點選「有幫助」次數除以所有正負回饋；沒有回饋時顯示 0%。</dd></div><div><dt>匿名投稿</dt><dd>通過必填與匿名化確認、成功寫入待審核資料表的投稿。</dd></div></dl><p>資料來源：D1 events／submissions 彙總；更新時間：{new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p></section>
  </main>;
}
