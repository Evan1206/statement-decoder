export const categories = [
  '否定勸退型',
  '年齡／時間焦慮型',
  '經驗權威型',
  '恐嚇急迫型',
  '過來人合理化型',
  '比較型',
] as const;

export type Category = (typeof categories)[number];

const rules: Array<{ category: Category; terms: string[] }> = [
  { category: '否定勸退型', terms: ['沒用', '不用學', '別做', '不可能', '浪費時間', '放棄'] },
  { category: '年齡／時間焦慮型', terms: ['不年輕', '幾歲', '年紀', '趕快', '太晚', '時間不多'] },
  { category: '經驗權威型', terms: ['聽我的', '我看多了', '吃過的鹽', '我是過來人', '我比你懂'] },
  { category: '恐嚇急迫型', terms: ['來不及', '現在不', '一定會', '以後就', '最後機會', '淘汰'] },
  { category: '過來人合理化型', terms: ['我當年', '熬過來', '忍一忍', '大家都這樣', '撐一下'] },
  { category: '比較型', terms: ['你看人家', '別人都', '某某都', '同年紀', '比你'] },
];

export function decodeStatement(statement: string) {
  const matches = rules
    .map((rule) => ({ category: rule.category, score: rule.terms.filter((term) => statement.includes(term)).length }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const primary = matches[0]?.category ?? '否定勸退型';
  const secondary = matches.slice(1, 3).map((item) => item.category);

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
