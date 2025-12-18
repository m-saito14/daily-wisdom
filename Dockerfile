# ビルドステージ: アプリケーションをビルド
# ベースイメージとしてNode.jsの軽量バージョンを使用
FROM node:20-slim AS builder
# アプリケーションの作業ディレクトリを設定
WORKDIR /app

# 依存関係のファイルをコピーし、依存関係をインストール
COPY package*.json ./
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# Next.jsのビルドを実行
RUN rm -rf .next
RUN npm run build


# 実行ステージ: 軽量な実行環境を作成
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=8080

# ビルドステージから必要なファイルをコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# コンテナポートの公開（ドキュメント用）
EXPOSE 8080

# 実行コマンド: Standaloneモードで起動
CMD ["node", "server.js"]