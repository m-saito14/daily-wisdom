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

# プロバイダーの作成 (ここがエラーの原因だった箇所)
resource "google_iam_workload_identity_pool_provider" "github_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"
  
  # 最もシンプルなマッピング設定
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_condition = "assertion.repository == \"OWNER/REPO\""
}

# バインディング: 特定のGitHubリポジトリからのアクセスのみ許可
resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.github_actions_sa.name
  role               = "roles/iam.workloadIdentityUser"
  
  # "attribute.repository" を使ってリポジトリを制限します
  member = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/${var.github_repo}"
}