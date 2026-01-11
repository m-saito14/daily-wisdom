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

resource "google_secret_manager_secret" "database_url" {
  secret_id = "DATABASE_URL"
  replication {
    auto {}
  }
  depends_on = [google_project_service.enabled_apis]
}

resource "google_secret_manager_secret" "database_auth_token" {
  secret_id = "DATABASE_AUTH_TOKEN"
  replication {
    auto {}
  }
  depends_on = [google_project_service.enabled_apis]
}

resource "google_secret_manager_secret" "basic_auth_password" {
  secret_id = "BASIC-AUTH-PASSWORD"

  replication {
    auto {} # 自動レプリケーション（設定必須）
  }
  depends_on = [google_project_service.enabled_apis]
}