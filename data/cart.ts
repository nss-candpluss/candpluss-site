/*
  カートの購入ボタンの下に出す注釈。

  買う前に知っておかないと困ることから順に並べる。
  取り消せないこと → いつ届くか → どこへ送れるか。
*/
export const cartDomesticShippingNotes = [
  "※ご注文確定後のキャンセルは原則としてお受けしておりません。あらかじめご了承ください。",
  "※お支払いの確認後、通常3営業日以内（予約商品等を除く）に発送いたします。土・日・祝日の発送は行っておりません。",
  "※国内配送のみ対応しております。海外への発送は承っておりませんので、あらかじめご了承ください。",
  "*We only ship within Japan. We are unable to ship internationally, so please note this before placing your order.",
] as const;
