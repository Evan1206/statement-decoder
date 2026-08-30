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

export function decodeStatement(statement: string) {
  const matches = rules
    .map((rule) => ({ category: rule.category, score: rule.terms.filter((term) => statement.includes(term)).length }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const primary = matches[0]?.category ?? '脈絡不足';
  const secondary = tagRules
    .filter((rule) => rule.terms.some((term) => statement.includes(term)))
    .slice(0, 3)
    .map((rule) => rule.tag);

  return {
    primary,
    secondary,
    steps: [
      { title: '事實 vs 觀點分離', body: '先找出可由資料、事件或明確條件驗證的部分；句中的絕對判斷、預測與價值選擇，仍需要證據支持。' },
      { title: '說話者經驗檢核', body: '目前不知道對方是否親自經歷過相同情境，也不知道是試過後得出結論，還是從未接觸；兩者的參考價值不同。' },
      { title: '投射偵測', body: '一種解讀是，這句話可能也反映說話者自己的焦慮、限制或過往經驗；但僅憑一句話不能確定他的動機。' },
      { title: '權威折扣', body: '說話者的資歷只有在與這個問題直接相關時才增加可信度；職位、年齡或輩分本身不能取代具體依據。' },
      { title: '可採納殘餘', body: '把語氣和未證實的結論濾掉後，仍值得確認對方是否指出了具體風險、期限或失敗案例，再決定要採取什麼行動。' },
    ],
    summary: '先不要把這句話當成定論；把它改寫成可以查證的問題，再保留其中具體而善意的提醒。',
  };
}
