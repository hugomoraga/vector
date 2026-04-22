variable "project_id" {
  type        = string
  description = "GCP Project ID"
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "GCP Region for resources"
}

variable "environment" {
  type        = string
  default     = "nonprod"
  description = "Deployment environment"
}

variable "github_repo" {
  type        = string
  default     = "hugomoraga/vector"
  description = "GitHub repository in owner/repo format for WIF"
}

variable "telegram_bot_token_secret" {
  type        = string
  description = "Telegram bot token value for Secret Manager"
  sensitive   = true
  default     = ""
}

variable "telegram_bot_username" {
  type        = string
  description = "Telegram bot @handle without @ (for t.me deep links)"
  default     = ""
}

variable "telegram_msg_welcome_plain" {
  type        = string
  description = "Optional API env TELEGRAM_MSG_WELCOME_PLAIN (/start without deep link); use {{chatId}} for chat id"
  default     = ""
}

variable "telegram_msg_welcome_linked" {
  type        = string
  description = "Optional API env TELEGRAM_MSG_WELCOME_LINKED (after successful Telegram link)"
  default     = ""
}

variable "telegram_msg_link_invalid" {
  type        = string
  description = "Optional API env TELEGRAM_MSG_LINK_INVALID (invalid/expired link token)"
  default     = ""
}

variable "telegram_reminder_template_json" {
  type        = string
  description = "Optional JSON merged over built-in reminder template (TELEGRAM_REMINDER_TEMPLATE_JSON); use Terraform heredoc for multiline"
  default     = ""
}

variable "telegram_webhook_secret" {
  type        = string
  description = "Secret token for Telegram setWebhook (X-Telegram-Bot-Api-Secret-Token)"
  sensitive   = true
  default     = ""
}

variable "internal_job_secret" {
  type        = string
  description = "Shared secret for POST /generate-daily and /send-reminders (X-Vector-Job-Secret or Bearer)"
  sensitive   = true
  default     = ""
}

# ── Image tags (set by CI/CD) ──────────────────
variable "api_image" {
  type        = string
  description = "Full image URI for API container"
  default     = ""
}

variable "web_image" {
  type        = string
  description = "Full image URI for Web container"
  default     = ""
}