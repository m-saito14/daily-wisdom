---
name: new-feature
description: daily-wisdom に新機能を追加するための標準手順（影響範囲特定 → 設計確認 → スキーマ/DB/API/フロント実装 → 型/Lint/ビルド → コミット）。ユーザーが「新機能を追加」「機能を実装」「new feature」と依頼したときに使用する。機能の内容は指示または直前の会話から読み取る。
---

本プロジェクトに新機能を追加するための標準手順を実行してください。
機能の内容はユーザーの指示または直前の会話から読み取ってください。

## ステップ 1: 影響範囲の特定

追加する機能がどの層に関わるか確認する：

| 層 | ファイル | 判断基準 |
|---|---|---|
| 生成スキーマ | `src/mastra/agents/wisdomAgent.ts` | 生成する項目・ジャンル・クイズ形式が変わるか |
| RAG / API | `src/app/api/generate/route.ts` | 取得・生成・保存のパイプラインに影響するか |
| プロンプト | Langfuse（`disney-wisdom-system`）+ `route.ts` のフォールバック | LLM への指示を変えるか |
| DB | `src/lib/db.ts` / `route.ts` の SQL | 新しいカラム・クエリが必要か |
| UI | `src/app/page.tsx` | 画面・操作フローが変わるか |
| 認証 / ミドルウェア | `src/middleware.ts` | 保護対象や認証方式が変わるか |
| インフラ | `terraform/*.tf` | Cloud Run 設定・シークレット・権限が変わるか |
| 観測 | `src/instrumentation.ts` / `src/lib/langfuse.ts` | トレース・メトリクスを追加するか |

## ステップ 2: 設計の確認

実装前にユーザーに確認する：
- スキーマ（`dailyWisdomSchema`）を変更する場合、フロントの型（`page.tsx`）と DB カラムへの波及
- 新しい環境変数が必要か（`.env.local` / `terraform/secrets.tf` / CI ビルド env）
- LLM プロンプトの変更を Langfuse 側で行うか、ローカルフォールバックで行うか

## ステップ 3: スキーマ / DB 変更（必要な場合）

- Zod スキーマ（`wisdomAgent.ts`）を更新したら、`generateObject` の呼び出し・保存クエリ・フロント型を必ず横展開する
- DB カラムを追加する場合、`route.ts` の `INSERT` のカラムと `?` プレースホルダ・`args` の個数を一致させる
- ベクトルは `vector32(?)` + `new Float32Array(embedding).buffer` のパターンを踏襲する

## ステップ 4: バックエンド実装（`src/app/api/generate/route.ts`）

既存の RAG パイプラインのパターンを踏襲する：
- Retrieval（禁止リスト）→ Prompt（Langfuse / フォールバック）→ Generation（`generateObject`）→ Indexing（`embed` + DB 保存）
- LLM 呼び出しには `experimental_telemetry`（`functionId` / `metadata`）を付与
- 全体を `try/catch` で囲み、失敗時は `NextResponse.json({ error, details }, { status: 500 })`
- 値は必ず `?` プレースホルダでバインドする

## ステップ 5: フロントエンド実装（`src/app/page.tsx`）

既存パターンを踏襲する：
- `'use client'` + `useState` / `useEffect`
- 型定義（`WisdomItem` / `Quiz`）をスキーマと一致させる
- 当日分の LocalStorage キャッシュ（`daily-wisdom-data`）の日付分岐を壊さない

## ステップ 6: 動作確認

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev          # ローカルで /api/generate の生成・保存・画面表示を確認
```

- 生成が Zod スキーマ制約（5 件・ジャンル・選択肢 4 つ）を満たすか
- Langfuse にトレースが記録されるか
- インフラ変更を含む場合は `terraform/` で `terraform validate` / `terraform fmt -check`

## ステップ 7: テスト（該当する場合）

現状テストフレームワークは未導入。ロジック（スキーマ検証・RAG 整形・採点）を追加・変更した場合は、
`test-reviewer` エージェントの提案に沿って Vitest の導入・テスト追加を検討する。

## ステップ 8: ドキュメント更新

変更に応じて `README.md` / `docs/architecture.md` / ルート `CLAUDE.md` を更新する：
- 新しい環境変数・スキーマ・パイプラインの変更点

## ステップ 9: コミット

`commit` スキルを使ってコミット前チェックを実施してからコミットする。
その後 `create-pr` スキルで develop への PR を作成する。
