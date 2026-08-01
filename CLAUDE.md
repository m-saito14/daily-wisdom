# Claude Code 運用ガイド — daily-wisdom

## プロジェクト概要

ディズニーの教養を「解説 + 理解度クイズ」形式で毎日届ける Web アプリ。
LLM が生成したトピックをベクトル化して DB に蓄積し、**RAG（過去トピックの重複排除）** で
毎日新しい 5 トピックを生成する。生成は Vercel AI SDK 経由で Google Vertex AI（Gemini 2.5 Flash）を利用し、
LLMOps として Langfuse でトレース・プロンプト管理を行う。

---

## ディレクトリ構成

```
daily-wisdom/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # フロント（LocalStorage で当日分をキャッシュ）
│   │   ├── layout.tsx
│   │   └── api/generate/route.ts       # RAG パイプライン本体（Retrieval → Generation → Indexing）
│   ├── mastra/agents/wisdomAgent.ts    # Agent 定義・モデル・Zod スキーマ・システムプロンプト
│   ├── lib/
│   │   ├── db.ts                       # LibSQL / Turso クライアント
│   │   └── langfuse.ts                 # Langfuse SDK クライアント（プロンプト取得用）
│   ├── middleware.ts                   # Basic 認証ミドルウェア（全パス対象）
│   └── instrumentation.ts             # Langfuse OTel Exporter 登録
├── terraform/                          # Cloud Run / Artifact Registry / WIF / Secrets の IaC
├── docs/architecture.md                # アーキテクチャ解説
└── .github/workflows/                  # CI（ci.yml）/ 自動デプロイ（deploy.yml）
```

---

## 開発コマンド

```bash
npm run dev              # 開発サーバー起動（port 3000）
npm run build            # 本番ビルド確認
npm run lint             # ESLint
npx tsc --noEmit         # TypeScript 型チェック
```

> **テスト**: 現時点で自動テストのフレームワークは未導入（`tsx` のみ）。
> テストを追加する場合は Vitest の導入から行う（`test-reviewer` エージェント参照）。

---

## 技術スタック

| 層 | 技術 |
|---|---|
| フロントエンド | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| API | Next.js Route Handler（`src/app/api/generate/route.ts`） |
| LLM | Vercel AI SDK v4（`ai@4.0.12`）+ Google Vertex AI（`gemini-2.5-flash`） |
| Agent 定義 | Mastra（`@mastra/core`）+ Zod スキーマ |
| Embedding | Vertex `text-embedding-004`（768 次元） |
| DB | LibSQL / Turso（`@libsql/client`、`vector32()` でベクトル格納） |
| LLMOps | Langfuse（`langfuse` + `langfuse-vercel` + `@vercel/otel`） |
| 認証 | Basic 認証（`src/middleware.ts`） |
| インフラ | Google Cloud Run（Terraform / Artifact Registry / WIF） |

---

## RAG パイプライン（`src/app/api/generate/route.ts`）

1. **Retrieval**: `wisdom_items` から直近 30 件（title, category）を取得し「禁止リスト」を作成
2. **Prompt**: Langfuse から `disney-wisdom-system` プロンプトを取得（未登録時はローカルフォールバック）し、`{{avoid_list}}` をコンパイル
3. **Generation**: `generateObject`（`dailyWisdomSchema`）で異なるジャンルの 5 トピックを生成
4. **Indexing**: 各 item を `embed` でベクトル化（`Promise.all` で並列）し、`vector32(?)` で DB に保存

いずれの LLM 呼び出しも `experimental_telemetry` を有効化して Langfuse にトレースされる。

---

## ブランチ・PR・デプロイ戦略

```
main       ← リリース済みコード
develop    ← 統合ブランチ（PR はここに向ける／push で本番デプロイ）
feature/*  ← 機能開発
fix/*      ← バグ修正
```

- **PR → develop / main** で `ci.yml` が自動実行される：
  1. `lint-and-check` — `npx tsc --noEmit` / `npm run lint` / `npm run build`
  2. `terraform-check` — `terraform validate` / `terraform fmt -check`
- **develop への push（PR マージ含む）** で `deploy.yml` が実行され、Docker ビルド → Artifact Registry → `terraform apply` で **Cloud Run に自動デプロイ**される。
- `main` / `develop` への直接 push は禁止。必ず `feature/*` か `fix/*` から PR を出す。

---

## 環境変数（`.env.local`）

| 分類 | 変数 |
|---|---|
| Vertex AI | `GOOGLE_VERTEX_PROJECT`, `GOOGLE_VERTEX_LOCATION` |
| DB (Turso) | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` |
| Basic 認証 | `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` |
| Langfuse | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` / `LANGFUSE_BASEURL` |

> 本番の機密値は Terraform（`terraform/secrets.tf`）経由で Secret Manager に管理され、Cloud Run に注入される。
> **いかなる鍵・トークンもコードにハードコードしないこと。**

---

## アーキテクチャ上の注意

- 生成スキーマ（`dailyWisdomSchema`）は「異なるジャンルから必ず 5 件」「クイズは選択肢 4 つ」を型で強制している。変更時はフロント（`page.tsx` の型定義）と DB カラム（`quiz_json` 等）への影響を必ず横展開する。
- DB クエリは `@libsql/client` の `db.execute({ sql, args })` を使い、**必ずプレースホルダ（`?`）でバインド**する（文字列連結は禁止）。
- Langfuse プロンプト（`disney-wisdom-system`）を変更する場合、ローカルフォールバック（`FALLBACK_SYSTEM_PROMPT`）と `{{avoid_list}}` プレースホルダの整合を保つ。
- フロントは当日分を LocalStorage（`daily-wisdom-data`）にキャッシュし、日付が変わるまで API を叩かない。

---

## スキル・エージェント

標準形式（`.claude/skills/<name>/SKILL.md`）のスキルを用意している：

- `commit` — コミット前チェック → コミット作成
- `create-pr` — develop への GitHub PR 作成（`pr-creator` エージェントで本文生成）
- `new-feature` — 新機能追加の標準手順
- `review-pr` — 3 エージェント並行レビュー → 統合レポート
- `deploy` — Cloud Run へのデプロイ手順（自動デプロイ / 手動 terraform）

各スキルは `description` に沿ってタスク文脈で自動的に発動する。
レビュー用エージェントは `.claude/agents/`（code-reviewer / security-reviewer / test-reviewer / pr-creator）。
