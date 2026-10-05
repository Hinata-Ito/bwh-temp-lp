/* 計測の設定。analytics.js が読み込む（各ページに書くのは analytics.js のタグ1行だけ）。
   - BWH_GA4_ID が空のあいだは、GA4 には何も送らない（gtag.js も読み込まない）。
   - 外部送信のページ（/external-transmission/）を公開する前に、本番の ID を入れない。
   - 差し方：01_BWH/00_strategy/20261004_広報とSEO/S1_計測/02_静木さんへの依頼_フォームとID.md */
window.BWH_GA4_ID = '';
window.BWH_GA4_DRYRUN = false; // true にすると、送らずに dataLayer に積むだけ（プレビューでの確かめ用）
window.BWH_FORM = {
  entries: {
    service: '523560967', // ご相談したいこと（チェックボックス）
    source: '1182345841'   // 流入元（自動で入ります）
  },
  choices: {               // フォームの選択肢と1字でも違うと事前入力されない
    kenshu: '現場AI研修',
    sagyou: 'AIおまかせ制作',
    migiude: 'AXのみぎうで（AIの右腕）',
    'migiude-hr': '組織の右腕',
    'migiude-strategy': '戦略の右腕'
  }
};
