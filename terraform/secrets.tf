resource "google_secret_manager_secret" "aws_access_key" {
  secret_id = "AWS_ACCESS_KEY_ID"
  replication {
    auto {}
  }
  depends_on = [google_project_service.enabled_apis]
}

resource "google_secret_manager_secret" "aws_secret_key" {
  secret_id = "AWS_SECRET_ACCESS_KEY"
  replication {
    auto {}
  }
  depends_on = [google_project_service.enabled_apis]
}

resource "google_secret_manager_secret" "aws_region" {
  secret_id = "AWS_REGION"
  replication {
    auto {}
  }
  depends_on = [google_project_service.enabled_apis]
}