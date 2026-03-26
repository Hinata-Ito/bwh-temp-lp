#!/usr/bin/env python3
# 3LPの共通修正スクリプト

import re

# ──────────────────────────────────────────────
# 各LPの設定
# ──────────────────────────────────────────────
lps = [
    {
        'file': 'lp-strategy.html',
        'keyword': '戦略',
        'hero_sub': '新規事業立ち上げや経営戦略の立案・推進など、事業を前に進める仕組みづくりを支援します。',
        'problem_title': '御社は、こんな「戦略の課題」を抱えていませんか。',
        'problem_desc': '多くの福井企業が、戦略を「考えたい」と思いながらも、前に進められずにいます。',
        'solution_title': '戦略番頭が、<br>御社の推進力になる。',
        'model_icons': [
            # 整理する: 虫眼鏡/分析
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="17" cy="17" r="9"/><path d="M24 24l8 8"/><path d="M13 17h8M17 13v8"/></svg>',
            # 計画に落とす: カレンダー/タスク
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="28" height="26" rx="3"/><path d="M6 16h28M14 6v4M26 6v4M12 24l4 4 8-8"/></svg>',
            # 実行を前に進める: ロケット/矢印
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6c0 0 10 4 10 16l-10 12L10 22C10 10 20 6 20 6z"/><circle cx="20" cy="18" r="3"/><path d="M12 28l-6 6M28 28l6 6"/></svg>',
            # 社内に残す: 本/知識
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 34V8a2 2 0 012-2h20a2 2 0 012 2v26"/><path d="M8 34h24"/><path d="M16 10h8M16 16h8M16 22h4"/></svg>',
        ],
    },
    {
        'file': 'lp-hr.html',
        'keyword': '組織',
        'hero_sub': '人事評価制度・教育制度・採用制度など、人と組織を育てる仕組みづくりを支援します。',
        'problem_title': '御社は、こんな「組織の課題」を抱えていませんか。',
        'problem_desc': '多くの福井企業が、組織・人事の整備の必要性を感じながらも、手が回らずにいます。',
        'solution_title': '人事番頭が、<br>御社の組織基盤をつくる。',
        'model_icons': [
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(30,58,138,0.8)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="17" cy="17" r="9"/><path d="M24 24l8 8"/><path d="M13 17h8M17 13v8"/></svg>',
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(30,58,138,0.8)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="28" height="26" rx="3"/><path d="M6 16h28M14 6v4M26 6v4M12 24l4 4 8-8"/></svg>',
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(30,58,138,0.8)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6c0 0 10 4 10 16l-10 12L10 22C10 10 20 6 20 6z"/><circle cx="20" cy="18" r="3"/><path d="M12 28l-6 6M28 28l6 6"/></svg>',
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(30,58,138,0.8)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 34V8a2 2 0 012-2h20a2 2 0 012 2v26"/><path d="M8 34h24"/><path d="M16 10h8M16 16h8M16 22h4"/></svg>',
        ],
    },
    {
        'file': 'lp-ai.html',
        'keyword': 'AI',
        'hero_sub': '生成AIの導入や業務改善・活用定着など、業務を変えるAIの仕組みづくりを支援します。',
        'problem_title': '御社は、こんな「AIの課題」を抱えていませんか。',
        'problem_desc': '多くの企業がAI活用の必要性を感じながら、最初の一歩を踏み出せずにいます。',
        'solution_title': 'AI番頭が、<br>現場で使えるAIをつくる。',
        'model_icons': [
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(99,179,237,0.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="17" cy="17" r="9"/><path d="M24 24l8 8"/><path d="M13 17h8M17 13v8"/></svg>',
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(99,179,237,0.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="28" height="26" rx="3"/><path d="M6 16h28M14 6v4M26 6v4M12 24l4 4 8-8"/></svg>',
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(99,179,237,0.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6c0 0 10 4 10 16l-10 12L10 22C10 10 20 6 20 6z"/><circle cx="20" cy="18" r="3"/><path d="M12 28l-6 6M28 28l6 6"/></svg>',
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(99,179,237,0.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 34V8a2 2 0 012-2h20a2 2 0 012 2v26"/><path d="M8 34h24"/><path d="M16 10h8M16 16h8M16 22h4"/></svg>',
        ],
    },
]

# モデルステップのラベルと説明
model_steps = [
    ('整理する', '課題・論点・優先順位を構造化し、何に集中すべきかを明確にします'),
    ('計画に落とす', '戦略をアクション・担当・期限の形に変換し、動ける計画をつくります'),
    ('実行を前に進める', '会議設計・進捗管理・壁打ちを通じて、実行が止まらない状態をつくります'),
    ('社内に残す', '判断軸・プロセス・ノウハウを社内に定着させ、自走できる組織をつくります'),
]

for lp in lps:
    path = f'/home/ubuntu/bwh-website/{lp["file"]}'
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # ① CTA名称変更（ヒーロー・最終CTA両方）
    html = html.replace('無料相談を申し込む', '問い合わせをする')
    html = html.replace('資料を受け取る', '資料をダウンロード')

    # ② 課題コピー変更
    html = html.replace(
        'こんな課題、<br>抱えていませんか。',
        lp['problem_title']
    )

    # ③ ヒーローsub を1行（PCではwhite-space:nowrap）に変更
    # <br>タグを削除して1行テキストにし、CSSで制御
    old_sub = f'<p class="lp-hero-sub">{lp["hero_sub"].replace("、", "、<br>")}</p>'
    new_sub = f'<p class="lp-hero-sub lp-hero-sub-nowrap">{lp["hero_sub"]}</p>'
    # まずbrタグなしのものも対象に
    html = re.sub(
        r'<p class="lp-hero-sub">.*?</p>',
        new_sub,
        html,
        flags=re.DOTALL
    )

    # ④ Modelの説明テキストを白字に（dark背景なので既にwhite系のはずだが明示的に）
    # lp-model-step p の color を white に（CSS追加）
    # → style属性で直接指定する方式に変更
    # モデルフロー全体を置換
    icons = lp['model_icons']
    new_model_flow = f'''<div class="lp-model-flow lp-fade">
        <div class="lp-model-step">
          <div class="lp-model-step-icon">{icons[0]}</div>
          <div class="lp-model-step-num">01</div>
          <h3>{model_steps[0][0]}</h3>
          <p style="color:#fff;">{model_steps[0][1]}</p>
        </div>
        <div class="lp-model-step">
          <div class="lp-model-step-icon">{icons[1]}</div>
          <div class="lp-model-step-num">02</div>
          <h3>{model_steps[1][0]}</h3>
          <p style="color:#fff;">{model_steps[1][1]}</p>
        </div>
        <div class="lp-model-step">
          <div class="lp-model-step-icon">{icons[2]}</div>
          <div class="lp-model-step-num">03</div>
          <h3>{model_steps[2][0]}</h3>
          <p style="color:#fff;">{model_steps[2][1]}</p>
        </div>
        <div class="lp-model-step">
          <div class="lp-model-step-icon">{icons[3]}</div>
          <div class="lp-model-step-num">04</div>
          <h3>{model_steps[3][0]}</h3>
          <p style="color:#fff;">{model_steps[3][1]}</p>
        </div>
      </div>'''

    html = re.sub(
        r'<div class="lp-model-flow lp-fade">.*?</div>\s*</div>\s*</section>',
        new_model_flow + '\n    </div>\n  </section>',
        html,
        flags=re.DOTALL,
        count=1
    )

    # ⑤ Solutionセクションに注意書きを追加（lp-section-desc の直後）
    notice_text = '<p class="lp-solution-notice lp-fade">※ 下記の提供内容はあくまで一例です。御社の課題やニーズに沿って最適な支援内容を設計いたします。</p>'
    # lp-solution-grid の直前に挿入
    html = html.replace(
        '\n      <div class="lp-solution-grid">',
        f'\n      {notice_text}\n      <div class="lp-solution-grid">'
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f'✓ {lp["file"]} 修正完了')

print('\n全LP修正完了')
