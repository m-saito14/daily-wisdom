# daily-wisdom
個人開発用（ディズニーリゾート知識習得アプリ）

## 概要
毎日異なるジャンルから5つのディズニーリゾートの知識を学べるアプリケーションです。RAG（Retrieval-Augmented Generation）パターンを採用し、過去の知識を参照しながら重複のない新しいコンテンツを生成します。各トピックには詳細な解説とクイズが含まれており、パーク体験を120%楽しむための知識を深めることができます。

## 主な機能
- 🎢 **毎日のディズニー知識提供**: Park Secret、Movie Trivia、Attraction、Food & Merch、History、Characterの6つのジャンルから5つのトピックを毎日生成
- 📖 **パーク体験に紐づく解説**: 初心者にもわかりやすく、実際のパーク訪問時に役立つ知識を提供
- 🎯 **理解度確認クイズ**: 各トピックに基づいた4択クイズで学習を定着させる
- 💾 **ローカルキャッシュ**: ブラウザのローカルストレージにデータを保存し、効率的に管理
- 🔄 **RAGパターン**: 過去30件のトピックを参照し、重複を避けた新しいコンテンツを生成
- 🗄️ **ベクトルデータベース**: 生成したコンテンツをベクトル化して保存し、将来の類似検索に対応

## プロジェクト構成

### ディレクトリ構造
```
src/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # 知識生成API（RAGパイプライン）
│   ├── favicon.ico
│   ├── globals.css               # グローバルスタイル
│   ├── layout.tsx                # ルートレイアウト
│   └── page.tsx                  # メインページ（フロントエンド）
├── lib/
│   └── db.ts                     # LibSQLデータベースクライアント
└── mastra/
    ├── agents/
    │   └── wisdomAgent.ts        # AI エージェント定義
    └── tools/                    # ツール定義（拡張予定）

terraform/                        # Google Cloud インフラ定義
├── cloud_run.tf                  # Cloud Run設定
├── artifact_registry.tf          # Artifact Registry設定
├── secrets.tf                    # Secret Manager設定
└── ...

Dockerfile                        # コンテナイメージ定義
```

### 主要ファイル解説

#### `src/app/page.tsx`
- **役割**: メインのフロントエンドコンポーネント
- **機能**:
  - ローカルストレージからのデータ管理
  - Reading モード（解説表示）と Quiz モード（クイズ出題）の切り替え
  - API から知識データを取得
  - ユーザーの選択肢入力と採点

#### `src/app/api/generate/route.ts`
- **役割**: API エンドポイント（GET リクエスト対応）、RAGパイプラインの実行
- **機能**:
  - **Retrieval**: 過去30件のトピックを取得し、禁止リストを作成
  - **Generation**: `wisdomAgent` から「モデル」と「指示」を取得し、禁止リストをシステムプロンプトに注入
  - AI SDK の `generateObject` を使用して構造化データ生成
  - Zod スキーマで出力を検証
  - **Indexing**: 生成結果をベクトル化（text-embedding-004）してデータベースに保存

#### `src/mastra/agents/wisdomAgent.ts`
- **役割**: AI エージェントと出力スキーマの定義
- **主要な定義**:
  - `dailyWisdomSchema`: 出力データの型定義（Zod）
  - `wisdomAgent`: ディズニーコンシェルジュとしてのペルソナを持つ AI エージェント
  - `modelDef`: Google Vertex AI の Gemini 2.5 Flash モデル設定

#### `src/lib/db.ts`
- **役割**: LibSQL/Turso データベースクライアントの初期化
- **機能**:
  - ベクトルデータの保存・検索
  - 過去のトピック取得による重複排除

## 技術スタック
- **フロントエンド**: Next.js 16, React 19, TypeScript
- **バックエンド**: Next.js API Routes
- **AI/LLM**: Google Vertex AI (Gemini 2.5 Flash via Vercel AI SDK)
- **Embedding**: Google Vertex AI (text-embedding-004)
- **データベース**: LibSQL/Turso（ベクトル検索対応SQLite）
- **データ検証**: Zod
- **スタイリング**: Tailwind CSS
- **フレームワーク**: Mastra（AI エージェント管理）
- **インフラ**: Google Cloud Run, Terraform
- **コンテナ**: Docker

## セットアップ

### 必要な環境
- Node.js 18 以上
- Google Cloud Platform アカウント（Vertex AI アクセス用）
- LibSQL/Turso データベース（またはローカルSQLite）

### インストール
```bash
npm install
```

### 環境変数
Google Vertex AI とデータベースへのアクセスのため、以下の環境変数を設定してください：

**必須環境変数:**
```
GOOGLE_VERTEX_PROJECT=<your_gcp_project_id>
GOOGLE_VERTEX_LOCATION=asia-northeast1
DATABASE_URL=<your_libsql_database_url>
DATABASE_AUTH_TOKEN=<your_turso_auth_token>  # Turso使用時のみ
```

**オプション（将来のBedrock移行用）:**
```
AWS_ACCESS_KEY_ID=<your_access_key>
AWS_SECRET_ACCESS_KEY=<your_secret_key>
AWS_REGION=us-east-1
```

**ローカル開発時:**
- `DATABASE_URL` が未設定の場合、`file:local.db` が使用されます（ローカルSQLiteファイル）

### 開発サーバーの起動
```bash
npm run dev
```
http://localhost:3000 でアプリケーションにアクセスできます。

## データフロー

### RAGパイプライン（コンテンツ生成）
1. **フロントエンド** (`page.tsx`) → ローカルストレージを確認、キャッシュがない場合のみ `/api/generate` にリクエスト送信
2. **API** (`route.ts`) → **Retrieval Phase**: データベースから過去30件のトピックを取得し、禁止リストを作成
3. **API** → **Generation Phase**: `wisdomAgent` の定義を参照し、禁止リストをシステムプロンプトに注入
4. **AI エージェント** (`wisdomAgent.ts`) → Vertex AI (Gemini 2.5 Flash) に「5つのトピック生成」を指示
5. **LLM 出力** → `dailyWisdomSchema` で検証
6. **API** → **Indexing Phase**: 各トピックをベクトル化（text-embedding-004）してデータベースに保存
7. **フロントエンド** → データを取得し、ローカルストレージに保存して表示・クイズ実施

### ユーザー体験フロー
1. ページアクセス時にローカルストレージを確認
2. 今日の日付のデータがあれば、それを表示（API呼び出しなし）
3. データがない、または日付が異なる場合のみAPIを呼び出し
4. Readingモードで解説を読む → Quizモードでクイズに回答
5. 5つのトピック完了後、スコアを表示

## ビルド＆本番環境

### ローカルビルド
```bash
npm run build
npm start
```

### Dockerビルド
```bash
docker build -t daily-wisdom-app .
docker run -p 8080:8080 daily-wisdom-app
```

### Google Cloud Run へのデプロイ

Terraformを使用してインフラを構築・デプロイします：

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

**デプロイ構成:**
- **コンテナレジストリ**: Google Artifact Registry
- **実行環境**: Google Cloud Run
- **シークレット管理**: Google Secret Manager
- **認証**: IAM Service Account

詳細は `docs/architecture.md` を参照してください。

## RAG（Retrieval-Augmented Generation）パターン

このアプリケーションはRAGパターンを採用しており、以下の3つのフェーズで動作します：

1. **Retrieval（検索）**: データベースから過去30件のトピックを取得し、重複を避けるための禁止リストを作成
2. **Generation（生成）**: 禁止リストをシステムプロンプトに注入し、新しいコンテンツを生成
3. **Indexing（索引付け）**: 生成したコンテンツをベクトル化してデータベースに保存し、次回の検索対象とする

これにより、毎日異なるトピックを提供し、ユーザーに新鮮なコンテンツを届けることができます。

## データベーススキーマ

```sql
CREATE TABLE wisdom_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  quiz_json TEXT NOT NULL,
  embedding BLOB,  -- ベクトルデータ（768次元）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## ライセンス
個人開発プロジェクト
