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

export function decodeStatement(statement: string, answers: ReflectionAnswers) {
  const matches = rules
    .map((rule) => ({ category: rule.category, score: rule.terms.filter((term) => statement.includes(term)).length }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const primary = matches[0]?.category ?? '脈絡不足';
  const secondary = tagRules
    .filter((rule) => rule.terms.some((term) => statement.includes(term)))
    .slice(0, 3)
    .map((rule) => rule.tag);

  const excerpt = `「${statement.length > 42 ? `${statement.slice(0, 42)}…` : statement}」`;
  const certainty = answers.nature === 'event'
    ? answers.evidence === 'yes'
      ? `${excerpt}包含你認為已發生、且有具體依據的內容；這部分可以核對來源、日期與適用條件，不必只憑語氣相信。`
      : `${excerpt}看起來在描述已發生的事，但你目前${answers.evidence === 'no' ? '沒有看到具體依據' : '不確定依據是否存在'}；現階段只能確認「對方這樣說過」，不能連同結論一起視為事實。`
    : answers.nature === 'judgment'
      ? `${excerpt}的核心較接近預測或個人評價，不是已經發生的客觀結果；它可以是意見，但仍需要條件與證據支持。`
      : `${excerpt}目前難以只靠字面分清事件與評價；可以先把「發生了什麼」和「對方怎麼解讀」分開。`;

  const verification = answers.evidence === 'yes'
    ? '對方有提出依據是有用訊號，但仍要確認來源是否可信、是否適用於你的情況，以及有沒有被省略的例外。'
    : answers.evidence === 'no'
      ? '你沒有收到具體資料、規定或案例，因此其中的結論仍待查證。可以請對方說明來源、實際風險和成立條件。'
      : '你目前不確定對方是否有依據。先追問「這個判斷根據什麼？」會比直接接受或反駁更可靠。';

  const pressureSignal = matches[0]?.category;
  const residual = pressureSignal
    ? `語氣較接近「${pressureSignal}」，但分類不代表對方一定在操控你。值得保留的是：對方可能在提醒某個風險；請把風險改寫成可查證的具體問題。`
    : '目前沒有足夠語言訊號判定特定話術。仍可保留對方想提醒你的主題，但不必連同未證實的結論一起接受。';

  const action = answers.frequency === 'often'
    ? '你表示類似說法經常出現。先記錄原句、時間、情境與實際結果，再找可信任的第三方比較觀點；若它長期影響安全感或自我判斷，可考慮尋求專業支持。'
    : answers.frequency === 'sometimes'
      ? '你表示這類說法偶爾出現。可以比較幾次事件是否都有相同的壓力方式，並先問：「你可以說明具體依據和最壞情況嗎？」'
      : '這是第一次出現時，先不用急著替它定性。可以問：「你是根據哪些具體情況這樣判斷？」再依回答決定是否採納。';

  const summary = answers.nature === 'judgment' || answers.evidence !== 'yes'
    ? '目前不宜把整句話直接當成事實；先查證依據，保留具體風險，再由你決定要不要採納。'
    : '這句話可能包含可查證內容；核對來源與適用條件後，再把事實和對方的解讀分開。';

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
