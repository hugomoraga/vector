# ── Artifact Registry ───────────────────────────
resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = "vector"
  format        = "DOCKER"
  description   = "Docker images for Vector"

  depends_on = [google_project_service.apis]
}