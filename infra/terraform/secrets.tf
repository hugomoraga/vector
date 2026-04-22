# ── Telegram Secret ─────────────────────────────
resource "google_secret_manager_secret" "telegram_bot_token" {
  count     = var.telegram_bot_token_secret != "" ? 1 : 0
  secret_id = "telegram-bot-token"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "telegram_bot_token" {
  count       = var.telegram_bot_token_secret != "" ? 1 : 0
  secret      = google_secret_manager_secret.telegram_bot_token[0].id
  secret_data = var.telegram_bot_token_secret
}

# ── Telegram webhook secret ─────────────────────
resource "google_secret_manager_secret" "telegram_webhook_secret" {
  count     = var.telegram_webhook_secret != "" ? 1 : 0
  secret_id = "telegram-webhook-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "telegram_webhook_secret" {
  count       = var.telegram_webhook_secret != "" ? 1 : 0
  secret      = google_secret_manager_secret.telegram_webhook_secret[0].id
  secret_data = var.telegram_webhook_secret
}

# ── Internal job secret (generate-daily, send-reminders) ──
resource "google_secret_manager_secret" "internal_job_secret" {
  count     = var.internal_job_secret != "" ? 1 : 0
  secret_id = "internal-job-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "internal_job_secret" {
  count       = var.internal_job_secret != "" ? 1 : 0
  secret      = google_secret_manager_secret.internal_job_secret[0].id
  secret_data = var.internal_job_secret
}