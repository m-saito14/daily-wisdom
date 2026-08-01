// CSS を副作用インポート（`import "./globals.css"`）した際の型宣言。
// TypeScript 6 以降、型宣言のない副作用インポートは TS2882 エラーになるため、
// Next.js がビルド時に処理する CSS 用のアンビエント宣言をここで補う。
declare module "*.css";
