# terraform/iam_wif.tf

# --- 1. Cloud Run実行用 サービスアカウント ---
resource "google_service_account" "cloud_run_sa" {
  account_id   = "daily-wisdom-runner"
  display_name = "Cloud Run Runtime Service Account"
}

# Secret Manager 閲覧権限 (Cloud Run用)
resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# --- 2. GitHub Actions用 サービスアカウント ---
resource "google_service_account" "github_actions_sa" {
  account_id   = "github-actions-deployer"
  display_name = "GitHub Actions Deployer"
}

# Artifact Registry 書き込み権限 (GitHub Actions用)
resource "google_project_iam_member" "artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions_sa.email}"
}

# Cloud Run 管理者権限 (GitHub Actions用)
resource "google_project_iam_member" "run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_actions_sa.email}"
}

# サービスアカウントユーザー (GitHub Actions用)
resource "google_project_iam_member" "sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.github_actions_sa.email}"
}

# --- 3. Workload Identity Federation (WIF) ---

# プールの作成
resource "google_iam_workload_identity_pool" "github_pool" {
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
}

# プロバイダーの作成
resource "google_iam_workload_identity_pool_provider" "github_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"
  
  # GitHubの情報をGCPの属性にマッピング
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    # assertion.ref は下の attribute_condition で直接使うのでマッピング必須ではないが、
    # 将来的にログ等で確認できるようマッピングしておくと便利
    "attribute.git_ref"    = "assertion.ref"
  }

  # ここでセキュリティチェックを行う（門番の役割）
  # GitHubからの生のデータ (assertion) を使って判定。
  # 指定のリポジトリ かつ 指定のブランチ(main or develop) のみ通過させる。
  attribute_condition = <<EOF
    assertion.repository == "m-saito14/daily-wisdom" && 
    (assertion.ref == "refs/heads/main" || assertion.ref == "refs/heads/develop")
  EOF

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# バインディング
# プロバイダー(門番)を通過できたアクセスに対して権限を付与
resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.github_actions_sa.name
  role               = "roles/iam.workloadIdentityUser"
  
  # プロバイダー側で厳密に絞っているため、ここでは「このプールからのアクセスは許可」とするだけで安全。
  # これにより、複雑な condition 式によるエラーを回避できる。
  member = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/*"
}