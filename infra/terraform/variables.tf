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