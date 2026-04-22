# ── GCP APIs ────────────────────────────────────
locals {
  services_base = [
    "run.googleapis.com",
    "cloudscheduler.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
  ]
  # cloudbillingbudgets often fails with 403 on some projects/orgs; only add when managing budgets in Terraform (billing.tf).
  services = concat(
    local.services_base,
    local.terraform_billing_budget_on ? ["cloudbillingbudgets.googleapis.com"] : [],
  )
}

resource "google_project_service" "apis" {
  for_each           = toset(local.services)
  service            = each.value
  disable_on_destroy = false
}