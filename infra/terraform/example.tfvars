provider "google" {
  project = var.project_id
}

terraform {
  required_version = ">= 1.5.0"

  backend "gcs" {
    bucket = "vector-terraform-state"
    prefix = "terraform/state"
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

output "api_service_account_email" {
  value = google_service_account.api.email
}

output "web_service_account_email" {
  value = google_service_account.web.email
}