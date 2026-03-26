import re

files = [
    {
        'path': '/home/ubuntu/bwh-website/knowledge-detail-strategy.html',
        'issue_text': '戦略が形骸化している・経営計画が現場に届いていない',
        'issue_label': '対象の課題',
        'accent': '#1e3a8a',
        'accent_light': '#dbeafe',
    },
    {
        'path': '/home/ubuntu/bwh-website/knowledge-detail-hr.html',
        'issue_text': '評価制度が機能していない・評価への不満が高い',
        'issue_label': '対象の課題',
        'accent': '#065f46',
        'accent_light': '#d1fae5',
    },
    {
        'path': '/home/ubuntu/bwh-website/knowledge-detail-ai.html',
        'issue_text': 'AIを導入したが現場で使われていない・AI活用が進まない',
        'issue_label': '対象の課題',
        'accent': '#4c1d95',
        'accent_light': '#ede9fe',
    },
]

# CSS to add for issue banner and grayout
extra_css = '''
    /* ===== Issue Banner (上部課題UI) ===== */
    .art-issue-banner {
      background: var(--article-accent);
      padding: 28px 0;
    }
    .art-issue-inner {
      max-width: 860px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: flex-start;
      gap: 20px;
    }
    .art-issue-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .art-issue-icon svg { width: 24px; height: 24px; color: #fff; }
    .art-issue-content {}
    .art-issue-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: rgba(255,255,255,0.65);
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .art-issue-text {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      line-height: 1.6;
    }
    @media (max-width: 600px) {
      .art-issue-inner { gap: 14px; }
      .art-issue-text { font-size: 14px; }
    }

    /* ===== Grayed-out accordion (素材なし) ===== */
    .accordion-item.no-content {
      opacity: 0.45;
      pointer-events: none;
      filter: grayscale(1);
    }
    .accordion-item.no-content .accordion-trigger {
      cursor: not-allowed;
    }
    .accordion-item.no-content .accordion-trigger-desc::after {
      content: ' ／ 準備中';
      color: #9ca3af;
      font-style: italic;
    }
'''

for f in files:
    with open(f['path'], 'r') as fh:
        html = fh.read()

    # 1. Add extra CSS before </style>
    html = html.replace('  </style>\n</head>', extra_css + '  </style>\n</head>', 1)

    # 2. Insert issue banner between art-header and art-info-section
    issue_banner = f'''
  <!-- Issue Banner -->
  <div class="art-issue-banner">
    <div class="art-issue-inner">
      <div class="art-issue-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      </div>
      <div class="art-issue-content">
        <div class="art-issue-label">対象の課題</div>
        <div class="art-issue-text">{f['issue_text']}</div>
      </div>
    </div>
  </div>

'''
    html = html.replace('  <!-- Info Card -->', issue_banner + '  <!-- Info Card -->', 1)

    # 3. Remove "対象の課題" from the info-grid (it's now in the banner)
    # Remove the entire art-info-item block for 対象の課題
    html = re.sub(
        r'\s*<div class="art-info-item">\s*<div class="art-info-label">対象の課題</div>\s*<div class="art-info-value">[^<]*</div>\s*</div>',
        '',
        html
    )

    # 4. Add no-content class to accordion items that have no real content (video and slide)
    # Mark video accordion as no-content (素材なし)
    html = html.replace(
        '<div class="accordion-item" id="acc-video">',
        '<div class="accordion-item no-content" id="acc-video">'
    )
    # Mark slide accordion as no-content (素材なし)
    html = html.replace(
        '<div class="accordion-item" id="acc-slide">',
        '<div class="accordion-item no-content" id="acc-slide">'
    )

    with open(f['path'], 'w') as fh:
        fh.write(html)

    print(f"Done: {f['path']}")

print("All done!")
