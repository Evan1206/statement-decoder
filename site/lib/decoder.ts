export const categories = [
  '否定／貶低',
  '權威施壓',
  '急迫／恐嚇',
  '比較／群體壓力',
  '內疚／責任綁架',
  '標準操控',
  '善意包裝',
] as const;

export type Category = (typeof categories)[number];

export type ReflectionAnswers = {
  evidence: 'yes' | 'no' | 'unknown';
  nature: 'event' | 'judgment' | 'unknown';
  frequency: 'first' | 'sometimes' | 'often';
};

const rules: Array<{ category: Category; terms: string[] }> = [
  { category: '否定／貶低', terms: ['沒用', '不可能', '浪費時間', '做不好', '沒效率', '粗心', '太敏感', '想太多'] },
  { category: '權威施壓', terms: ['聽我的', '我看多了', '吃過的鹽', '我是過來人', '我比你懂', '照我說的'] },
  { category: '急迫／恐嚇', terms: ['來不及', '現在不', '一定會', '以後就', '最後機會', '淘汰', '後悔'] },
  { category: '比較／群體壓力', terms: ['你看人家', '別人都', '某某都', '同年紀', '比你', '大家都覺得', '只有你'] },
  { category: '內疚／責任綁架', terms: ['不能沒有你', '讓我失望', '辜負', '都是因為你', '養你', '不知感恩', '沒良心'] },
  { category: '標準操控', terms: ['標準', '考核', '績效', '怎麼又', '早就說過', '這也不會', '自己決定'] },
  { category: '善意包裝', terms: ['為你好', '栽培你', '給你機會', '期待比較高', '看重你', '磨練'] },
];

const tagRules = [
  { tag: '可能含自我投射', terms: ['沒用', '不適合', '我當年', '我覺得'] },
  { tag: '焦慮或控制', terms: ['趕快', '來不及', '現在不', '一定要', '照我說的'] },
  { tag: '苦難合理化', terms: ['我當年', '熬過來', '忍一忍', '撐一下'] },
  { tag: '模糊共識', terms: ['大家都', '所有人', '別人都', '只有你'] },
  { tag: '標準漂移', terms: ['標準', '考核', '不是說', '怎麼又', '早就說過'] },
  { tag: '稱讚綁架', terms: ['看重你', '期待比較高', '最有能力', '不能沒有你'] },
] as const;

type InsightPattern = {
  category: Category;
  tags: string[];
  matches: (statement: string) => boolean;
  observation: string;
  verification: string;
  residual: string;
  question: string;
  summary: string;
};

const hasAny = (statement: string, terms: string[]) => terms.some((term) => statement.includes(term));

const insightPatterns: InsightPattern[] = [
  {
    category: '善意包裝', tags: ['成長交換', '年齡概括'],
    matches: (statement) => hasAny(statement, ['薪水', '薪資', '待遇', '錢']) && hasAny(statement, ['學東西', '學點東西', '多學', '學習', '成長', '經驗', '歷練']),
    observation: '這句話把「重視薪資」和「累積學習」放在對立位置，但兩者其實可以同時成立；年輕也不會自動讓合理待遇變得不重要。',
    verification: '需要確認的是：能學到哪些具體技能、由誰指導、學習成果如何衡量、低薪會持續多久，以及何時重新檢視薪資。',
    residual: '值得保留的是職涯初期確實可以把成長性納入選擇；但「有東西可學」不能單獨證明任何薪資都合理。',
    question: '這份工作具體能學到什麼、由誰帶領，以及多久後會重新檢視薪資？',
    summary: '學習機會和合理待遇不是二選一；先把成長內容、期限與薪資條件問具體，再判斷交換是否值得。',
  },
  {
    category: '善意包裝', tags: ['苦難合理化'],
    matches: (statement) => hasAny(statement, ['我當年', '熬過來', '忍一忍', '撐一下', '吃苦', '磨練']),
    observation: '這句話用過去的受苦經驗支持現在也應該忍耐，但相似經歷不代表條件、代價與可用資源完全相同。',
    verification: '需要確認目前的困難是否有明確期限、改善計畫與合理回報，以及繼續忍耐會付出哪些健康或職涯代價。',
    residual: '過來人的經驗可以提供可能的風險與方法，但不必把「他忍過」推論成「你也必須忍」。',
    question: '這個狀況預計何時改善？改善前有哪些具體支持與界線？',
    summary: '經驗可以參考，受苦不必複製；比較條件與代價後，再決定是否值得繼續。',
  },
  {
    category: '比較／群體壓力', tags: ['模糊共識'],
    matches: (statement) => hasAny(statement, ['你看人家', '別人都', '大家都', '同年紀', '只有你', '某某都']),
    observation: '這句話用別人的進度或模糊的多數標準評價你，但沒有交代資源、目標與起點是否相同。',
    verification: '需要確認比較對象是否真的相似、資料是否完整，以及那個結果是不是你本人也想追求的目標。',
    residual: '比較可以提醒你看見一種可能性，但不能直接決定你的時程或價值。',
    question: '這個比較和我的條件、目標有什麼直接關係？',
    summary: '別人的進度可以參考，不能代替你的目標；先比較條件，再決定是否需要調整。',
  },
  {
    category: '急迫／恐嚇', tags: ['焦慮或控制'],
    matches: (statement) => hasAny(statement, ['趕快', '來不及', '現在不', '最後機會', '一定會後悔', '以後就']),
    observation: '這句話把未來風險說得很確定，並可能要求你縮短思考時間；急迫感本身不是期限存在的證據。',
    verification: '需要查明真正的截止日期、錯過後的具體後果、資訊來源，以及是否仍有替代方案。',
    residual: '值得保留的是事情可能確實有時間成本；但是否緊急，應由可查證的期限和後果判斷。',
    question: '真正的截止日期與錯過後果是什麼？有沒有其他選項？',
    summary: '先查期限，再感受急迫；沒有具體截止日期時，不必只因語氣倉促決定。',
  },
  {
    category: '權威施壓', tags: ['經驗套用'],
    matches: (statement) => hasAny(statement, ['聽我的', '吃過的鹽', '我是過來人', '我比你懂', '照我說的']),
    observation: '這句話主要用身分或資歷要求採納結論，而不是直接提供與你情況相關的證據。',
    verification: '需要確認對方的經驗是否屬於同一領域、發生年代與條件是否相近，以及他能否說出具體案例。',
    residual: '資深經驗可能有價值，但應拆成可驗證的風險與做法，而不是整句照單全收。',
    question: '你的經驗中，哪個具體案例和我現在的情況最接近？',
    summary: '資歷提高參考價值，不取代證據；請對方把經驗說具體，再判斷是否適用。',
  },
  {
    category: '內疚／責任綁架', tags: ['關係壓力'],
    matches: (statement) => hasAny(statement, ['讓我失望', '辜負', '都是因為你', '不知感恩', '沒良心', '養你', '不能沒有你']),
    observation: '這句話把你的決定和對方的失望、付出或處境綁在一起，但情緒責任不必全部由你承擔。',
    verification: '需要分清你實際承諾過的責任、對方自行期待的部分，以及不同選擇各自會造成的具體影響。',
    residual: '值得保留的是你的決定可能真的影響關係；但影響關係不等於你必須放棄自己的界線。',
    question: '我實際承諾過什麼？哪些是你的期待，而不是我的責任？',
    summary: '關係影響值得討論，內疚不能代替同意；先分清承諾與期待，再決定界線。',
  },
  {
    category: '否定／貶低', tags: ['可能含自我投射'],
    matches: (statement) => hasAny(statement, ['沒用', '不可能', '做不好', '太敏感', '想太多', '不適合']),
    observation: '這句話直接給出負面結論，但沒有先說明評估標準、適用範圍或例外，因此不能只靠肯定語氣當成事實。',
    verification: '需要確認「沒用／不適合／做不好」是以什麼目標衡量、有哪些實際例子，以及是否存在不同做法。',
    residual: '對方可能觀察到某個困難，但應把籠統否定改寫成具體問題，才有參考價值。',
    question: '你指的是哪個具體情況？判斷標準和例子是什麼？',
    summary: '先把籠統否定改成具體標準；能查證的留下，無法說明的結論先保留。',
  },
];

export function decodeStatement(statement: string, answers: ReflectionAnswers) {
  const insight = insightPatterns.find((pattern) => pattern.matches(statement));
  const matches = rules
    .map((rule) => ({ category: rule.category, score: rule.terms.filter((term) => statement.includes(term)).length }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const primary = insight?.category ?? matches[0]?.category ?? '脈絡不足';
  const secondary = [...(insight?.tags ?? []), ...tagRules
    .filter((rule) => rule.terms.some((term) => statement.includes(term)))
    .map((rule) => rule.tag)]
    .filter((tag, index, all) => all.indexOf(tag) === index)
    .slice(0, 3);

  const excerpt = `「${statement.length > 42 ? `${statement.slice(0, 42)}…` : statement}」`;
  const answerQualifier = answers.nature === 'event'
    ? answers.evidence === 'yes'
      ? `${excerpt}包含你認為已發生、且有具體依據的內容；這部分可以核對來源、日期與適用條件，不必只憑語氣相信。`
      : `${excerpt}看起來在描述已發生的事，但你目前${answers.evidence === 'no' ? '沒有看到具體依據' : '不確定依據是否存在'}；現階段只能確認「對方這樣說過」，不能連同結論一起視為事實。`
    : answers.nature === 'judgment'
      ? `${excerpt}的核心較接近預測或個人評價，不是已經發生的客觀結果；它可以是意見，但仍需要條件與證據支持。`
      : `${excerpt}目前難以只靠字面分清事件與評價；可以先把「發生了什麼」和「對方怎麼解讀」分開。`;
  const certainty = insight ? `${insight.observation} ${answerQualifier}` : answerQualifier;

  const evidenceQualifier = answers.evidence === 'yes'
    ? '對方有提出依據是有用訊號，但仍要確認來源是否可信、是否適用於你的情況，以及有沒有被省略的例外。'
    : answers.evidence === 'no'
      ? '你沒有收到具體資料、規定或案例，因此其中的結論仍待查證。可以請對方說明來源、實際風險和成立條件。'
      : '你目前不確定對方是否有依據。先追問「這個判斷根據什麼？」會比直接接受或反駁更可靠。';
  const verification = insight ? `${insight.verification} ${evidenceQualifier}` : evidenceQualifier;

  const pressureSignal = matches[0]?.category;
  const residual = insight ? insight.residual : pressureSignal
    ? `語氣較接近「${pressureSignal}」，但分類不代表對方一定在操控你。值得保留的是：對方可能在提醒某個風險；請把風險改寫成可查證的具體問題。`
    : '目前沒有足夠語言訊號判定特定話術。仍可保留對方想提醒你的主題，但不必連同未證實的結論一起接受。';

  const frequencyAction = answers.frequency === 'often'
    ? '你表示類似說法經常出現；建議記錄原句、時間、情境與實際結果，必要時找可信任的第三方或專業支持。'
    : answers.frequency === 'sometimes'
      ? '你表示這類說法偶爾出現，可以比較幾次事件是否都有相同的壓力方式。'
      : '這是第一次出現時，先不用急著替它定性。';
  const action = insight
    ? `${frequencyAction} 可以問：「${insight.question}」`
    : `${frequencyAction} 可以問：「你是根據哪些具體情況這樣判斷？」`;

  const summary = insight?.summary ?? (answers.nature === 'judgment' || answers.evidence !== 'yes'
    ? '目前不宜把整句話直接當成事實；先查證依據，保留具體風險，再由你決定要不要採納。'
    : '這句話可能包含可查證內容；核對來源與適用條件後，再把事實和對方的解讀分開。');

  return {
    primary,
    secondary,
    steps: [
      { title: '目前能確定什麼', body: certainty },
      { title: '哪些部分需要查證', body: verification },
      { title: '值得保留的提醒', body: residual },
      { title: '現在可以做的一件事', body: action },
    ],
    summary,
  };
}
