resource "google_cloud_run_v2_service" "daily_wisdom_app" {
  name     = "daily-wisdom-app"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL" # 外部公開設定

  template {
    # 作成した実行用サービスアカウントを指定
    service_account = "github-actions-deployer@gcp-learning-lab-476308.iam.gserviceaccount.com"
    
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repo.repository_id}/daily-wisdom:latest"
      
      ports {
        container_port = 8080
      }
      
      # 環境変数 (Next.js/Cloud Run用)
      env {
        name  = "PORT"
        value = "8080"
      }
      
      # Secret Manager から値を注入
      secret {
        secret_name   = google_secret_manager_secret.aws_access_key.secret_id
        container_key = "AWS_ACCESS_KEY_ID"
        version       = "latest"
      }
      
      secret {
        secret_name   = google_secret_manager_secret.aws_secret_key.secret_id
        container_key = "AWS_SECRET_ACCESS_KEY"
        version       = "latest"
      }
      
      secret {
        secret_name   = google_secret_manager_secret.aws_region.secret_id
        container_key = "AWS_REGION"
        version       = "latest"
      }

      resources {
        cpu_idle          = true
        startup_cpu_boost = true
        memory            = "512Mi"
      }
    }
    
    timeout = "300s"

  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.enabled_apis,
    google_service_account.cloud_run_sa,
    google_project_iam_member.secret_accessor
  ]
}

# 誰でもアクセスできるようにする設定（一般公開）
resource "google_cloud_run_v2_service_iam_member" "all_users_can_invoke" {
  location = google_cloud_run_v2_service.daily_wisdom_app.location
  name     = google_cloud_run_v2_service.daily_wisdom_app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}