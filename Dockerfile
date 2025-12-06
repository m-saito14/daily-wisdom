# ベースイメージとしてNode.jsの軽量バージョンを使用
FROM node:20-slim

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