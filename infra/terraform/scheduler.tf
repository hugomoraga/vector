# ── Cloud Scheduler Jobs ────────────────────────
# All times in Chile (America/Santiago) timezone
#
# OIDC authenticates to Cloud Run; the app also expects X-Vector-Job-Secret when
# INTERNAL_JOB_SECRET is set (same value as var.internal_job_secret / Secret Manager).

locals {
  scheduler_internal_headers = var.internal_job_secret != "" ? {
    "X-Vector-Job-Secret" = var.internal_job_secret
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
    }
  }

  depends_on = [google_project_service.apis]
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
    }
  }

  depends_on = [google_project_service.apis]
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
    }
  }

  depends_on = [google_project_service.apis]
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
    }
  }

  depends_on = [google_project_service.apis]
}