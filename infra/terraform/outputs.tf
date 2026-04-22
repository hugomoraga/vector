output "api_url" {
  description = "API Cloud Run service URL"
  value       = google_cloud_run_v2_service.api.uri
}

output "web_url" {
  description = "Web Cloud Run service URL"
  value       = google_cloud_run_v2_service.web.uri
}

output "artifact_registry" {
  description = "Docker registry URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "wif_provider" {
  description = "Workload Identity Federation provider for GitHub Actions"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "github_actions_sa" {
  description = "Service account email for GitHub Actions"
  value       = google_service_account.github_actions.email
}