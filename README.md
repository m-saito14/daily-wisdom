# daily-wisdom
個人開発用（教養知識習得アプリ）

## 概要
毎日異なるジャンルから5つの教養知識を学べるアプリケーションです。各トピックには詳細な解説とクイズが含まれており、楽しみながら知識を深めることができます。

## 主な機能
- 📚 **毎日の知識提供**: 履歴、科学、芸術、ビジネス、哲学、テクノロジー、自然、心理学など多彩なジャンルから5つのトピックを毎日生成
- 📖 **詳細な解説**: 初心者にもわかりやすく、知的好奇心を刺激する内容を提供
- 🎯 **理解度確認クイズ**: 各トピックに基づいた4択クイズで学習を定着させる
- 💾 **ローカルキャッシュ**: ブラウザのローカルストレージにデータを保存し、効率的に管理

## プロジェクト構成

### ディレクトリ構造
```
src/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # 知識生成API
│   ├── favicon.ico
│   ├── globals.css               # グローバルスタイル
│   ├── layout.tsx                # ルートレイアウト
│   └── page.tsx                  # メインページ（フロントエンド）
└── mastra/
    ├── agents/
    │   └── wisdomAgent.ts        # AI エージェント定義
    └── tools/                    # ツール定義（拡張予定）
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
- **役割**: API エンドポイント（GET リクエスト対応）
- **機能**:
  - `wisdomAgent` から「モデル」と「指示」を取得
  - AI SDK の `generateObject` を使用して構造化データ生成
  - Zod スキーマで出力を検証

#### `src/mastra/agents/wisdomAgent.ts`
- **役割**: AI エージェントと出力スキーマの定義
- **主要な定義**:
  - `dailyWisdomSchema`: 出力データの型定義（Zod）
  - `wisdomAgent`: 博識なペルソナを持つ AI エージェント
  - `modelDef`: Amazon Bedrock の Claude 3.7 Sonnet モデル設定

## 技術スタック
- **フロントエンド**: Next.js 16, React 19, TypeScript
- **バックエンド**: Next.js API Routes
- **AI/LLM**: Amazon Bedrock (Claude 3.7 Sonnet via Vercel AI SDK)
- **データ検証**: Zod
- **スタイリング**: Tailwind CSS
- **フレームワーク**: Mastra（AI エージェント管理）

## セットアップ

### 必要な環境
- Node.js 18 以上
- AWS 認証情報（Amazon Bedrock アクセス用）

### インストール
```bash
npm install
```

### 環境変数
Amazon Bedrock へのアクセスのため、以下の環境変数を設定してください：
```
AWS_ACCESS_KEY_ID=<your_access_key>
AWS_SECRET_ACCESS_KEY=<your_secret_key>
AWS_REGION=us-east-1
```

### 開発サーバーの起動
```bash
npm run dev
```
http://localhost:3000 でアプリケーションにアクセスできます。

## データフロー
1. **フロントエンド** (`page.tsx`) → `/api/generate` にリクエスト送信
2. **API** (`route.ts`) → `wisdomAgent` の定義を参照
3. **AI エージェント** (`wisdomAgent.ts`) → Claude LLM に「5つのトピック生成」を指示
4. **LLM 出力** → `dailyWisdomSchema` で検証
5. **フロントエンド** → データを取得し表示・クイズ実施

## ビルド＆本番環境
```bash
npm run build
npm start
```

## ライセンス
個人開発プロジェクト
