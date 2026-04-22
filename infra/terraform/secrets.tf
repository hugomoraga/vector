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