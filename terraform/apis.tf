# 必要なAPIを一括有効化
resource "google_project_service" "enabled_apis" {
  for_each = toset([
    "run.googleapis.com",              # Cloud Run
    "artifactregistry.googleapis.com", # Artifact Registry
    "iam.googleapis.com",              # IAM
    "iamcredentials.googleapis.com",   # Service Account Credentials (WIFで必要)
    "secretmanager.googleapis.com",    # Secret Manager
    "cloudresourcemanager.googleapis.com" # Project API管理
  ])

  project = var.project_id
  service = each.key
  
  # terraform destroy時にAPIを無効化しない設定（安全のため）
  disable_on_destroy = false
}