# 原稿の置き場（コラム・AI瓦版）

このフォルダの Markdown から、`scripts/build-content.mjs` がページを作ります。`_config.yml` でこのフォルダは公開から外しているので、原稿そのものは Web に出ません。

| 種類 | 置き場 | ファイル名 | 出るURL |
|---|---|---|---|
| コラム | `content/column/` | `<slug>.md` | `/column/<slug>/` |
| AI瓦版 | `content/kawaraban/` | `<YYYYMMDD>-<slug>.md` | `/yorozuya/kawaraban/<YYYYMMDD>-<slug>/`（LP 未公開のうちは `/kawaraban/…`） |

`_` で始まるファイルは読みません（書きかけの置き場に使えます）。

## 前付け

```markdown
---
title: 福井の中小企業がAI研修で人材開発支援助成金を使う手順
slug: jinzai-kaihatsu-ai-kenshu-fukui
date: 2026-10-20
updated: 2026-10-20          # 任意。直したら日付を変える（sitemap の lastmod になる）
type: column                 # column | kawaraban（置いたフォルダと同じ）
pillar: subsidy              # 下の表
service: kenshu              # kenshu | sagyou | migiude | migiude-hr | migiude-strategy
description: 120字以内の要約（検索結果とSNSの説明文に出る）
sources:
  - https://www.mhlw.go.jp/…
draft: true                  # 任意。true の間は出ない
---
```

瓦版だけ、次の2つも書きます。

```markdown
embed:
  type: youtube              # youtube | x | none
  url: https://www.youtube.com/watch?v=…
card_id: 20261026-runway-gen5   # ネタカード（I1）の id
```

| type | 使える pillar |
|---|---|
| column | `subsidy`（助成金×AI研修）／`trial`（試してみた）／`fukui-kenshu`（福井×AI研修）／`kawaraban-deep`（AI瓦版の深掘り）／`case`（福井の会社のAX）／`hr`（人事・組織×AI） |
| kawaraban | `kawaraban`（新着）／`trial`（試してみた）／`case`（事例） |

- 日付が今日より後の記事は、その日の朝6時の自動ビルドで出ます。
- 埋め込みは公式の YouTube と X の投稿だけです。他社の動画ファイルは置きません。
- 「実質無料」は前付けに書くとビルドが止まります。

## 社員の吹き出し

```markdown
:::staff sora
福井の工務店なら、施工事例の動画づくりに使えます。
:::
```

- ID：`joh`（ジョウ）／`sakura`（サクラ）／`sora`（ソラ）／`aya`（アヤ）／`hanabi`（ハナビ）／`nami`（ナミ）／`ren`（レン）／`ryu`（リュウ）／`sumi`（スミ）／`yui`（ユイ）
- 1記事に2〜3か所。4か所以上だと警告が出ます。関係の一言は1記事1か所まで（設定書4章）。
- 顔のアイコンは `assets/staff/<ID>/face.webp`。まだ無い社員は、頭文字の丸で出ます。

## 確かめ方

```bash
npm test
node scripts/build-content.mjs --out .preview --drafts
node scripts/preview-server.mjs --port 4173
```

ブラウザで `http://localhost:4173/column/` を開きます。前付けに誤りがあると、ファイル名と行番号を出して止まり、何も書き出しません。

Git Bash で `KAWARABAN_BASE=/kawaraban/` を付けるときは、`MSYS_NO_PATHCONV=1` も付けます（付けないと Git Bash がパスを書き換えます）。
