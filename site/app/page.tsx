'use client';

import { FormEvent, useEffect, useState } from 'react';
import { categories } from '../lib/decoder';

type Result = {
  primary: string; secondary: string[];
  steps: Array<{ title: string; body: string }>; summary: string;
};

type ReflectionAnswers = {
  evidence: '' | 'yes' | 'no' | 'unknown';
  nature: '' | 'event' | 'judgment' | 'unknown';
  frequency: '' | 'first' | 'sometimes' | 'often';
};

const samples = ['學 AI 沒用啦！', '你不年輕了，要趕快找工作了。', '我當年也是這樣熬過來的，你忍一忍就好。'];
const cases = [
  ['否定勸退型', '「學 AI 沒用啦！」', '檢查「沒用」的判準與實際證據；這也可能反映說話者自己的興趣、經驗或能力邊界。', '可能含自我投射', '是 AI 沒用，還是目前沒有用對地方？🤖'],
  ['年齡／時間焦慮型', '「你不年輕了，要趕快找工作了」', '把模糊焦慮換成真實期限；其中也可能投射說話者對人生時程或安全感的焦慮。', '可能含自我投射', '人生不是限時搶購，倒數計時先關掉 ⏳'],
  ['經驗權威型', '「我吃過的鹽比你吃過的飯多」', '確認經驗是否與問題直接相關；說話者也可能把自己的過往經驗套用成人人適用的規則。', '可能含經驗投射', '那你的腎臟還好嗎？🧂'],
  ['恐嚇急迫型', '「現在不做，以後就來不及了」', '查證是否真的有不可逆期限；這種急迫感也可能來自說話者自身的焦慮或掌控需求。', '可能含焦慮／控制', '請先出示真正的截止日期 📅'],
  ['過來人合理化型', '「我當年也是這樣熬過來的」', '比較過去與現在的條件及代價；說話者也可能藉此維持自己當年的受苦是必要且值得的解讀。', '可能含苦難合理化', '熬過來，不代表還要繼續熬下一鍋 🍲'],
  ['比較型', '「你看人家某某都已經買房了」', '比較基準不等於你的生活目標。', null, '人家的進度條，不是你的待辦清單 🏠'],
];

const anonymousIdKey = 'statement-decoder-anonymous-id-v1';
const feedbackReasons = ['分類不準', '分析太籠統', '過度推測對方', '忽略合理建議', '語氣不舒服', '其他'];

function getAnonymousId() {
  const now = Date.now();
  try {
    const stored = JSON.parse(localStorage.getItem(anonymousIdKey) ?? 'null') as { id?: string; expiresAt?: number } | null;
    if (stored?.id && stored.expiresAt && stored.expiresAt > now) return stored.id;
    const value = { id: crypto.randomUUID(), expiresAt: now + 30 * 24 * 60 * 60 * 1000 };
    localStorage.setItem(anonymousIdKey, JSON.stringify(value));
    return value.id;
  } catch {
    return undefined;
  }
}

function track(eventType: string, category?: string, contextType?: string, label?: string) {
  void fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType, category, contextType, label, visitorId: getAnonymousId() }) });
}

export default function Home() {
  const [statement, setStatement] = useState('');
  const [contextType, setContextType] = useState('職場');
  const [answers, setAnswers] = useState<ReflectionAnswers>({ evidence: '', nature: '', frequency: '' });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'done'>('idle');

  useEffect(() => { track('page_view'); }, []);

  async function analyze() {
    if (!statement.trim()) return;
    setLoading(true); setError(''); setResult(null); setHelpful(null); setFeedbackReason('');
    track('analysis_started', undefined, contextType);
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statement, contextType, answers, visitorId: getAnonymousId() }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const label = response.status === 400 ? 'http_400' : 'http_500';
        track('analysis_failed', undefined, contextType, label);
        setError(data?.error ?? '暫時無法分析，請稍後再試。');
      } else setResult(data);
    } catch {
      track('analysis_failed', undefined, contextType, 'network');
      setError('網路連線不穩定，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }

  async function submitCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState('sending');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/submissions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statement: form.get('statement'), context: form.get('context'),
        primaryCategory: form.get('category'), interpretation: form.get('interpretation'),
        privacyConfirmed: form.get('privacy') === 'on',
        visitorId: getAnonymousId(),
      }),
    });
    setSubmitState(response.ok ? 'done' : 'idle');
    if (!response.ok) setError((await response.json()).error ?? '投稿失敗，請稍後再試。');
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="修但幾咧～真的是這樣嗎？首頁"><span className="brand-mark">慢</span><span>修但幾咧～真的是這樣嗎？ <b aria-hidden="true">🤔💛</b></span></a>
        <nav aria-label="主要導覽"><a href="#cases">案例庫</a><a href="#skill">AI Skill</a><a href="/dashboard">數據</a><a className="nav-cta" href="#submit" onClick={() => track('submission_opened')}>投稿話術</a></nav>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">STATEMENT DECODER · 免費公共工具</div>
        <div className="hero-banner"><img src="/hero-banner.png" alt="修但幾咧～真的是這樣嗎？別急著相信，先把這句話拆開。" /></div>
        <h1>修但幾咧～<br /><span>真的是這樣嗎？🤔💛</span></h1>
        <p className="hero-copy">當一句話讓你焦慮、自我懷疑，或不知道該不該聽，用五個步驟分清事實、觀點，以及真正值得參考的部分。</p>
        <div className="decoder-card" aria-labelledby="decoder-title">
          <div className="card-heading"><div><span className="step-label">第一步</span><h2 id="decoder-title">貼上讓你困擾的一句話</h2></div><span className="privacy-note">分析原句不會被公開保存</span></div>
          <textarea value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="例如：主管跟我說「你現在離職，履歷就毀了。」" maxLength={500} aria-label="要分析的話語" />
          <div className="reflection-questions">
            <div><span>1</span><label>對方有提供具體資料、規定或案例嗎？<select value={answers.evidence} onChange={(event) => setAnswers({ ...answers, evidence: event.target.value as ReflectionAnswers['evidence'] })}><option value="">請選擇</option><option value="yes">有</option><option value="no">沒有</option><option value="unknown">不確定</option></select></label></div>
            <div><span>2</span><label>這句話比較像哪一種？<select value={answers.nature} onChange={(event) => setAnswers({ ...answers, nature: event.target.value as ReflectionAnswers['nature'] })}><option value="">請選擇</option><option value="event">描述已發生的事</option><option value="judgment">預測或個人評價</option><option value="unknown">不確定</option></select></label></div>
            <div><span>3</span><label>類似說法出現的頻率？<select value={answers.frequency} onChange={(event) => setAnswers({ ...answers, frequency: event.target.value as ReflectionAnswers['frequency'] })}><option value="">請選擇</option><option value="first">第一次</option><option value="sometimes">偶爾</option><option value="often">經常</option></select></label></div>
          </div>
          <div className="input-footer">
            <label>情境 <select value={contextType} onChange={(event) => setContextType(event.target.value)}><option>職場</option><option>家庭</option><option>感情</option><option>朋友</option><option>金錢</option><option>其他</option></select></label>
            <span>{statement.length}/500</span>
            <button type="button" disabled={!statement.trim() || !answers.evidence || !answers.nature || !answers.frequency || loading} onClick={analyze}>{loading ? '整理中…' : '查看檢核結果 →'}</button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
        </div>
        <div className="sample-row" aria-label="範例話語"><span>試試看：</span>{samples.map((sample) => <button key={sample} type="button" onClick={() => { setStatement(sample); track('sample_selected'); }}>{sample}</button>)}</div>
      </section>

      {result && <section className="result-section" aria-live="polite">
        <div className="result-header"><div><span className="section-kicker">分析結果</span><h2>這句話較接近「{result.primary}」</h2></div><div className="tag-row"><span>{result.primary}</span>{result.secondary.map((item) => <span key={item}>{item}</span>)}</div></div>
        <div className="result-steps">{result.steps.map((step, index) => <article key={step.title}><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></article>)}</div>
        <blockquote>{result.summary}</blockquote>
        <div className="helpful"><span>這個分析有幫助嗎？</span><button disabled={helpful !== null} onClick={() => { setHelpful(true); track('helpful_yes', result.primary, contextType); }}>有幫助</button><button disabled={helpful !== null} onClick={() => { setHelpful(false); track('helpful_no', result.primary, contextType); }}>還可以更好</button>{helpful === true && <strong>謝謝你的回饋</strong>}</div>
        {helpful === false && <div className="feedback-reasons"><span>哪裡還可以更好？</span><div>{feedbackReasons.map((reason) => <button type="button" className={feedbackReason === reason ? 'selected' : ''} disabled={Boolean(feedbackReason)} key={reason} onClick={() => { setFeedbackReason(reason); track('feedback_reason', result.primary, contextType, reason); }}>{reason}</button>)}</div>{feedbackReason && <strong>收到，謝謝你幫我們調整方向 💛</strong>}</div>}
        <p className="disclaimer">這是依固定框架產生的初步判讀，不是心理診斷或專業治療建議。若涉及暴力、自傷或持續困擾，請尋求合格專業協助。</p>
      </section>}

      <section className="audience-section" aria-labelledby="audience-title">
        <div><span className="section-kicker">兩種使用方式</span><h2 id="audience-title">不論你會不會用 AI，<br />都能開始。</h2></div>
        <div className="audience-grid">
          <article><span className="audience-number">01</span><h3>直接使用網站</h3><p>不用設定 Prompt，也不用理解模型。貼上一句話，就能跟著框架一步步想清楚。</p><a href="#top">立即解碼 ↗</a></article>
          <article id="skill"><span className="audience-number">02</span><h3>安裝 AI Skill</h3><p>給熟悉 Claude、ChatGPT 或 Gemini 的使用者，把同一套判讀框架帶進自己的工作流程。</p><a href="https://github.com/Evan1206/statement-decoder" target="_blank" rel="noreferrer" onClick={() => track('skill_clicked')}>前往 GitHub ↗</a></article>
        </div>
      </section>

      <section className="cases-section" id="cases">
        <span className="section-kicker">六類常見話術</span><h2>先辨識模式，再回到具體情境。</h2>
        <div className="case-grid">{cases.map(([type, quote, note, projection, aside], index) => <article key={type}><span>0{index + 1}</span><div className="case-title"><h3>{type}</h3>{projection && <em>{projection}</em>}</div><blockquote>{quote}</blockquote><div className="gentle-roast"><strong>小聲吐槽</strong><span>{aside}</span></div><p>{note}</p></article>)}</div>
      </section>

      <section className="submit-section" id="submit">
        <div className="submit-copy"><span className="section-kicker">共同改善解碼框架</span><h2>你遇過一句讓人卡住的話嗎？</h2><p>你的匿名回饋能幫助我們改善話術分類、分析框架與安全防護，讓工具更貼近真實處境。</p>
          <div className="data-use-note"><strong>投稿與匿名統計用途說明</strong><p>投稿內容僅用於改善分類規則，以及未來去識別化的模型訓練與評測。原始投稿不會公開、不會販售，也不會用於廣告；若未來希望改寫為公開案例，我們會另行取得你的同意。本站事件資料不儲存 IP、不建立瀏覽器指紋，也不記錄你貼入分析的原句；僅以 30 天到期的本站隨機代碼計算匿名使用裝置數。請勿在投稿填寫姓名、公司、地點或其他可識別資訊。</p></div>
        </div>
        {submitState === 'done' ? <div className="submit-success"><strong>投稿已收到</strong><p>謝謝你讓下一個遇到類似情境的人，多一份可以參考的經驗。</p><p className="gratitude">懷著感恩的心，謝謝你的分享 💛🙏</p></div> :
        <form onSubmit={submitCase}>
          <label>話術原文<textarea name="statement" required maxLength={500} placeholder="請移除姓名、公司與可辨識資訊" /></label>
          <label>情境（一句話）<input name="context" required maxLength={300} placeholder="例如：主管在我提出離職時說的" /></label>
          <label>你覺得比較接近哪種話術機制？<select name="category" defaultValue="待分類"><option value="待分類">不確定，請協助分類</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><small className="field-hint">先選最主要的一種即可；同一句話仍可能包含多個次要標籤。</small></label>
          <label>你的解讀（選填）<textarea name="interpretation" maxLength={500} placeholder="你當時怎麼理解這句話？" /></label>
          <label className="check"><input name="privacy" type="checkbox" required /> 我已移除姓名、公司、地點及其他可識別個人的資訊，並同意這份匿名投稿用於改善分類規則，以及未來去識別化的模型訓練與評測；原始內容不會公開。</label>
          <button type="submit" disabled={submitState === 'sending'}>{submitState === 'sending' ? '送出中…' : '送出匿名投稿 →'}</button>
        </form>}
      </section>

      <section className="origin-section" aria-labelledby="origin-title">
        <div className="origin-mark">起</div>
        <div>
          <span className="section-kicker">為什麼做這個工具</span>
          <h2 id="origin-title">一句聽起來肯定、關心、為你好的話，<br />不一定是客觀事實。</h2>
        </div>
        <div className="origin-copy">
          <p>這個專案的起點，是一個常見卻很少被拆開看的習慣：人們很容易把主管、長輩、同儕、伴侶或其他權威者的個人觀點，直接當成對世界的客觀結論。當有人斷言某件事，那句話也可能只是在反映他自己的興趣、接觸範圍、經驗、環境限制，甚至是他個人的信念，不是你的。</p>
          <p>先客觀看發言者的狀態、處境與所處環境，就能有一個最基本的判斷依據。</p>
          <p>這個工具想提供的，是一個停頓點：先把事實與觀點分開；再觀察這類話語是否反覆干擾你的自我判斷；最後只留下真正值得參考的部分。目標不是把每一句建議都當成操控，而是幫助人重新看清自己真正想要什麼，從較健康的情緒出發，做出決定——也意識到，有些時候，自己可能需要求助。</p>
        </div>
      </section>
      <footer><div><strong>修但幾咧～真的是這樣嗎？🤔💛</strong><small>Statement Decoder · 清晰思考，不提供反擊彈藥。</small></div><a href="https://github.com/Evan1206/statement-decoder" target="_blank" rel="noreferrer">開源專案 →</a></footer>
    </main>
  );
}
