---
name: deploy
description: daily-wisdom のデプロイ手順を案内する。develop への push で GitHub Actions が Cloud Run へ自動デプロイする標準フローと、terraform を使った手動インフラ変更手順を扱う。ユーザーが「デプロイ」「deploy」「リリース」「本番反映」「Cloud Run に反映」について尋ねたときに使用する。
---

daily-wisdom のデプロイ手順を案内します。
デプロイは **GitHub Actions による自動デプロイ** が基本で、手動オペレーションは通常不要です。

## 自動デプロイ（標準フロー）

1. `feature/*` または `fix/*` ブランチで実装 → `commit` スキル
2. `create-pr` スキルで **develop** に向けた PR を作成
3. CI（`.github/workflows/ci.yml`）を通過させ、PR をマージ
4. **develop への push（マージ）をトリガーに `deploy.yml` が実行される**：
   Docker ビルド → Artifact Registry へ push → `terraform apply` で Cloud Run を更新

対象: Cloud Run サービス `daily-wisdom-app`（region: `asia-northeast1` / project: `gcp-learning-lab-476308`）

> `main` / `develop` への直接 push は禁止。必ず PR 経由でマージすること。

## デプロイ状況の確認

```bash
gh run list --workflow=deploy.yml --limit 5    # 直近のデプロイ実行を確認
gh run view <run-id>                            # 個別実行のログ
```

- GitHub Actions の `Deploy to Cloud Run via Terraform` ワークフローが成功しているか
- Cloud Run のリビジョンが更新され、アプリ（Basic 認証）にアクセスできるか
- `/api/generate` が生成・DB 保存まで通るか（Langfuse のトレースで確認）

## 手動でインフラを変更する場合（`terraform/` で実行）

```bash
terraform init
terraform validate
terraform fmt -check
terraform plan    # 差分を必ず確認してから
terraform apply
```

> インフラ変更（`terraform/*.tf`）を含む PR では、CI の `terraform-check`（validate / fmt）が通ることを必ず確認する。
> Cloud Run・IAM・Secret の公開範囲や権限を広げる変更は `security-reviewer` エージェントのレビュー対象。

## ロールバック

問題が発生した場合は、直前の正常な状態に戻す：
- 原因コミットを revert した PR を develop に出して再デプロイする、または
- Cloud Run コンソール / `gcloud run services update-traffic` で以前のリビジョンにトラフィックを戻す
