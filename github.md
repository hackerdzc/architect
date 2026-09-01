repo: hackerdzc/architect
branch: main

## Last sync
date: 2026-08-31T07:36:43Z

### Updated in this project
- 現行UI（PC サイドバー／iPhone Safari 393px）を忠実に再現し、指摘3点を画面上に明示
- 記述部のリデザイン3案（濃いリスト／3段カード／1問送り）
- 「2回タップ」を1回以下に詰めた3案（常時ヒント／3語から選ぶ／自動開き）
- 表示切替（リスト／カード／1問送り）を最上段に置いた統合案。1問送りも明るい配色に統一

## Screen map
| 画面 | 元になったリポジトリのファイル |
|---|---|
| 記述練習 リデザイン.dc.html → 1a / 1a′（現行再現） | index.html, style.css, app.js, questions.json |
| 同 → 1b / 1c / 1d（レイアウト3案） | style.css（色・寸法の起点）, questions.json（本文データ） |
| 同 → 2a / 2b / 2c（タップ回数の案） | app.js（目的3段階の挙動） |
| 同 → 3a（表示切替つき統合案） | index.html, style.css, app.js |
