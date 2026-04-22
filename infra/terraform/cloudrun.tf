# ── API Cloud Run ───────────────────────────────
resource "google_cloud_run_v2_service" "api" {
  name     = "vector-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.api.email

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = var.api_image != "" ? var.api_image : "us-docker.pkg.dev/cloudrun/container/hello"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "CORS_ORIGIN"
        value = var.web_image != "" ? google_cloud_run_v2_service.web.uri : "*"
      }

      # Firebase project config
      env {
        name  = "FIREBASE_PROJECT_ID"
        value = var.project_id
      }

      # Telegram token from Secret Manager (conditional)
      dynamic "env" {
        for_each = var.telegram_bot_token_secret != "" ? [1] : []
        content {
          name = "TELEGRAM_BOT_TOKEN"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.telegram_bot_token[0].secret_id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.telegram_webhook_secret != "" ? [1] : []
        content {
          name = "TELEGRAM_WEBHOOK_SECRET"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.telegram_webhook_secret[0].secret_id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.internal_job_secret != "" ? [1] : []
        content {
          name = "INTERNAL_JOB_SECRET"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.internal_job_secret[0].secret_id
              version = "latest"
            }
          }
        }
      }

      # After secret-backed env blocks so Terraform plans show stable ordering (not "TOKEN -> USERNAME").
      env {
        name  = "TELEGRAM_BOT_USERNAME"
        value = var.telegram_bot_username
      }

      dynamic "env" {
        for_each = {
          for k, v in {
            TELEGRAM_MSG_WELCOME_PLAIN  = var.telegram_msg_welcome_plain
            TELEGRAM_MSG_WELCOME_LINKED = var.telegram_msg_welcome_linked
            TELEGRAM_MSG_LINK_INVALID   = var.telegram_msg_link_invalid
          } : k => v if v != ""
        }
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.telegram_reminder_template_json != "" ? [var.telegram_reminder_template_json] : []
        content {
          name  = "TELEGRAM_REMINDER_TEMPLATE_JSON"
          value = env.value
        }
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 5
      }
    }
  }

  depends_on = [google_project_service.apis]
}

# Allow unauthenticated access (public API)
resource "google_cloud_run_v2_service_iam_member" "api_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Web Cloud Run ──────────────────────────────
resource "google_cloud_run_v2_service" "web" {
  name     = "vector-web"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.web.email

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = var.web_image != "" ? var.web_image : "us-docker.pkg.dev/cloudrun/container/hello"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }

  depends_on = [google_project_service.apis]
}

# Allow unauthenticated access (public web)
resource "google_cloud_run_v2_service_iam_member" "web_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}