resource "google_artifact_registry_repository" "app_repo" {
  location      = var.region
  repository_id = "daily-wisdom" # リポジトリ名
  description   = "Docker repository for Daily Wisdom App"
  format        = "DOCKER"

  depends_on = [google_project_service.enabled_apis]
}