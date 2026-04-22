# ── Cloud Scheduler Jobs ────────────────────────
# All times in Chile (America/Santiago) timezone
#
# OIDC goes on Authorization: Bearer <jwt>. The app must receive the job shared secret on
# X-Vector-Job-Secret only (see internalJobAuth). Header value is read from Secret Manager so it
# matches what Cloud Run mounts as INTERNAL_JOB_SECRET (avoids tfvars / SM drift).

data "google_secret_manager_secret_version" "internal_job_scheduler" {
  count  = var.internal_job_secret != "" ? 1 : 0
  secret = google_secret_manager_secret.internal_job_secret[0].id
}

locals {
  scheduler_internal_headers = length(data.google_secret_manager_secret_version.internal_job_scheduler) > 0 ? {
    "X-Vector-Job-Secret" = data.google_secret_manager_secret_version.internal_job_scheduler[0].secret_data
  } : {}
}

resource "google_cloud_scheduler_job" "generate_daily" {
  name        = "vector-generate-daily"
  description = "Generate daily items for all users at 5 AM"
  region      = var.region
  schedule    = "0 5 * * *"
  time_zone   = "America/Santiago"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.api.uri}/generate-daily"
    headers     = local.scheduler_internal_headers
    oidc_token {
      service_account_email = google_service_account.api.email
      audience              = google_cloud_run_v2_service.api.uri
    }
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.internal_job_secret,
  ]
}

resource "google_cloud_scheduler_job" "reminder_morning" {
  name        = "vector-reminder-morning"
  description = "Send Telegram reminders at 9 AM"
  region      = var.region
  schedule    = "0 9 * * *"
  time_zone   = "America/Santiago"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.api.uri}/send-reminders"
    headers     = local.scheduler_internal_headers
    oidc_token {
      service_account_email = google_service_account.api.email
      audience              = google_cloud_run_v2_service.api.uri
    }
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.internal_job_secret,
  ]
}

resource "google_cloud_scheduler_job" "reminder_afternoon" {
  name        = "vector-reminder-afternoon"
  description = "Send Telegram reminders at 2 PM"
  region      = var.region
  schedule    = "0 14 * * *"
  time_zone   = "America/Santiago"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.api.uri}/send-reminders"
    headers     = local.scheduler_internal_headers
    oidc_token {
      service_account_email = google_service_account.api.email
      audience              = google_cloud_run_v2_service.api.uri
    }
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.internal_job_secret,
  ]
}

resource "google_cloud_scheduler_job" "reminder_evening" {
  name        = "vector-reminder-evening"
  description = "Send Telegram reminders at 7 PM"
  region      = var.region
  schedule    = "0 19 * * *"
  time_zone   = "America/Santiago"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.api.uri}/send-reminders"
    headers     = local.scheduler_internal_headers
    oidc_token {
      service_account_email = google_service_account.api.email
      audience              = google_cloud_run_v2_service.api.uri
    }
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.internal_job_secret,
  ]
}