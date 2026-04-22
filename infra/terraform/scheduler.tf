# ── Cloud Scheduler Jobs ────────────────────────
# All times in Chile (America/Santiago) timezone
#
# Cloud Run allows unauthenticated invoke (allUsers run.invoker). Job auth is app-level, same value
# as INTERNAL_JOB_SECRET (from Secret Manager). Auth is sent only in the JSON body (internalJobSecret):
# if we also put the secret in http_target.headers, the Scheduler API often omits it on read → Terraform
# would plan the same header update forever. Content-Type stays in headers; the API accepts the body.

data "google_secret_manager_secret_version" "internal_job_scheduler" {
  count  = var.internal_job_secret != "" ? 1 : 0
  secret = google_secret_manager_secret.internal_job_secret[0].id
}

locals {
  scheduler_job_secret = length(data.google_secret_manager_secret_version.internal_job_scheduler) > 0 ? data.google_secret_manager_secret_version.internal_job_scheduler[0].secret_data : null

  scheduler_internal_headers = local.scheduler_job_secret != null ? {
    "Content-Type" = "application/json"
  } : {}

  # Cloud Scheduler http_target.body must be base64-encoded (JSON with internalJobSecret).
  scheduler_internal_body_b64 = local.scheduler_job_secret != null ? base64encode(jsonencode({
    internalJobSecret = local.scheduler_job_secret
  })) : ""
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
    body        = local.scheduler_internal_body_b64
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
    body        = local.scheduler_internal_body_b64
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
    body        = local.scheduler_internal_body_b64
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
    body        = local.scheduler_internal_body_b64
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.internal_job_secret,
  ]
}

resource "google_cloud_scheduler_job" "daily_summary" {
  name        = "vector-send-daily-summary"
  description = "Every 5 minutes UTC: Telegram digest at 22:30 local (per-user timeZone)"
  region      = var.region
  schedule    = "*/5 * * * *"
  time_zone   = "UTC"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.api.uri}/send-daily-summary"
    headers     = local.scheduler_internal_headers
    body        = local.scheduler_internal_body_b64
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.internal_job_secret,
  ]
}