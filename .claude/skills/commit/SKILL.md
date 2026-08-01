---
name: commit
description: daily-wisdom でコミット前チェック（横展開・セキュリティ・型/Lint/ビルド・ドキュメント）を実施し、問題がなければコミットを作成する。ユーザーが「コミットして」「commit」「変更をコミット」と依頼したときに使用する。
---

以下の手順でコミット前チェックを実施し、問題がなければコミットを作成してください。

## ステップ 1: 変更内容の把握

```bash
git status
git diff --cached   # ステージ済み
git diff            # 未ステージ
```

変更ファイルと差分の内容を確認し、コミットの目的を明確にする。

## ステップ 2: 横展開チェック

変更したパターン（関数名・型・Zod スキーマ・環境変数名・DB カラムなど）を Grep で検索し、
同じ修正が必要な箇所が他のファイルに残っていないか確認する。

- `dailyWisdomSchema`（`wisdomAgent.ts`）を変更した場合 → フロントの型定義（`page.tsx` の `WisdomItem` / `Quiz`）、DB 保存（`route.ts` の INSERT カラム）を確認
- 環境変数を追加・変更した場合 → `.env.local`・`terraform/secrets.tf`・CI（`ci.yml` のビルド env）・`instrumentation.ts` / `langfuse.ts` を確認
- DB スキーマ（カラム）を変更した場合 → `route.ts` の SELECT / INSERT すべてを確認

## ステップ 3: セキュリティチェック

- [ ] API キー・パスワード・トークン（Vertex / Turso / Langfuse / Basic 認証）のハードコードがないか
- [ ] `.env.local` や鍵ファイルをコミットに含めていないか
- [ ] `db.execute` の値がすべて `?` プレースホルダでバインドされているか（文字列連結がないか）
- [ ] LLM 生成テキストを `dangerouslySetInnerHTML` 等で直接 DOM 挿入していないか
- [ ] `console.log` / エラーレスポンスに機密情報を出力していないか

## ステップ 4: 型チェック・Lint・ビルド

```bash
npx tsc --noEmit
npm run lint
npm run build        # 生成・ビルド系の変更がある場合は特に確認
```

エラーがあれば修正してから次のステップへ。
（インフラ変更を含む場合は `terraform/` で `terraform validate` / `terraform fmt -check` も実行する）

## ステップ 5: README / ドキュメント更新確認

変更内容が以下に該当する場合は `README.md` / `docs/architecture.md` を更新する：

- RAG パイプラインやスキーマの変更
- 新しい環境変数の追加
- 起動・デプロイ手順の変更

## ステップ 6: コミット作成

上記チェックが完了したら、以下の形式でコミットを作成する：

```
<変更種別>: <変更内容の要約（日本語 50 字以内）>

<必要に応じて詳細説明>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

変更種別の例：`feat`, `fix`, `refactor`, `test`, `docs`, `chore`

> `main` / `develop` ブランチには直接コミット・push しないこと。必ず `feature/*` か `fix/*` で作業する。
