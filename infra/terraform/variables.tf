variable "project_id" {
  type        = string
  description = "GCP Project ID"
}

# Billing budget (optional). Set billing_account_id and terraform_billing_budget to manage budgets via Terraform.
variable "billing_account_id" {
  type        = string
  description = "GCP billing account id (01xxxx-xxxxxx-xxxxx). Used only when terraform_billing_budget is true; leave empty to skip."
  default     = ""
}

variable "terraform_billing_budget" {
  type        = bool
  description = "If true (and billing_account_id is set), enables cloudbillingbudgets.googleapis.com and creates google_billing_budget. Set false if Service Usage returns 403 for that API; use Cloud Console → Billing → Budgets instead."
  default     = false
}

variable "billing_budget_amount_usd" {
  type        = number
  description = "Monthly budget in whole USD. Alerts use billing_budget_alert_threshold_percent of this amount."
  default     = 10
}

variable "billing_budget_alert_threshold_percent" {
  type        = number
  description = "First alert when actual spend reaches this fraction of the monthly budget (0.5 = 50%, e.g. $5 of $10)."
  default     = 0.5
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

# Lets named users enable/disable GCP APIs (e.g. cloudbillingbudgets) without full Editor/Owner.
# First apply must run as a principal that can set project IAM (Owner or roles/resourcemanager.projectIamAdmin).
variable "service_usage_admin_users" {
  type        = list(string)
  description = "Google account emails granted roles/serviceusage.serviceUsageAdmin on this project (bare email, no user: prefix)."
  default     = []
}

variable "grant_github_deploy_sa_service_usage_admin" {
  type        = bool
  description = "If true, grants roles/serviceusage.serviceUsageAdmin to the GitHub Actions deploy service account (needed for terraform apply in CI to enable new APIs)."
  default     = false
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