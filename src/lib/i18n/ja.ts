// UI 文言辞書（data-only）。i18n ライブラリは導入しない。関数・ロジックは書かない。
// TODO: validation.ts 内の日本語メッセージも将来ここへ集約する（今回はロジック変更を避けるため未対応）。
export const ja = {
  app: { title: "drugrep", aboutLink: "出典・算出方法" },
  score: {
    label: "リスクスコア",
    low: "低リスク",
    mid: "中リスク",
    high: "高リスク",
  },
  warnings: { heading: "警告" },
  interactions: { heading: "相互作用" },
  disclaimer: {
    // 評価結果画面に常時表示する短い注意書き。
    short:
      "スコアは登録済みルールに基づく相対的な目安です。低スコアも安全を意味しません。医療上の助言ではありません。緊急時は119へ。",
    detailLink: "限界と注意（詳細）",
  },
  entry: {
    dose: "用量",
    route: "経路",
    remove: "削除",
    addPlaceholder: "物質を追加(和名・商品名で検索)",
  },
  breakdown: {
    heading: "スコア内訳",
    base: "基礎スコア",
    routeFactor: "経路係数",
    doseFactor: "用量係数",
    interactionAdd: "相互作用加算",
  },
  empty: {
    title: "物質を追加してください",
    body: "選択するとリスクスコアが表示されます",
  },
  footer: {
    disclaimer: "本アプリは医療助言ではありません。緊急時は119へ。",
    aboutLink: "免責事項・出典",
  },
} as const;
