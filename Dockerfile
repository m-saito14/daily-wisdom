# ビルドステージ: アプリケーションをビルド
# ベースイメージとしてNode.jsの軽量バージョンを使用
FROM node:20-slim AS builder
# アプリケーションの作業ディレクトリを設定
WORKDIR /app

# 依存関係のファイルをコピーし、依存関係をインストール
COPY package*.json ./
RUN npm install --only=production

# アプリケーションのソースコードをコピー
COPY . .

# コンテナがリッスンするポートを指定（Cloud Runは通常 8080 を使用）
EXPOSE 8080

# コンテナ起動時に実行されるコマンドを設定
CMD ["npm", "start"]


# 実行ステージ: 軽量な実行環境を作成
FROM node:20-slim AS runner
WORKDIR /app

# 環境変数はランタイムで注入されるため、ここでは設定しません

# ビルドステージから必要なファイルをコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# ★追加: これがないとCloud Runからアクセスできません
ENV HOSTNAME="0.0.0.0"
ENV PORT=8080

# 実行コマンド
CMD ["node", "server.js"]