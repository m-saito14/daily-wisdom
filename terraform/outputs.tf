output "wif_provider_name" {
  description = "Workload Identity Provider Resource Name"
  value       = google_iam_workload_identity_pool_provider.github_provider.name
}

output "github_actions_service_account" {
  description = "Service Account email for GitHub Actions"
  value       = google_service_account.github_actions_sa.email
}

output "cloud_run_service_account" {
  description = "Service Account email for Cloud Run Runtime"
  value       = google_service_account.cloud_run_sa.email
}

output "artifact_registry_repo" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repo.repository_id}"
}