# Monthly billing budget for this project only. GCP emails billing admins / users with Budgets
# notifications by default. This does not hard-stop spend; it raises alerts.
#
# The identity running Terraform needs a role on the billing account (e.g. Billing Account
# Administrator or Billing Account Costs Manager). If you use user ADCs, the provider may
# need billing_project + user_project_override per provider docs.

locals {
  billing_budget_enabled      = trimspace(var.billing_account_id) != ""
  terraform_billing_budget_on = local.billing_budget_enabled && var.terraform_billing_budget
}

data "google_billing_account" "budget" {
  count           = local.terraform_billing_budget_on ? 1 : 0
  billing_account = var.billing_account_id
}

data "google_project" "budget_scope" {
  count      = local.terraform_billing_budget_on ? 1 : 0
  project_id = var.project_id
}

resource "google_billing_budget" "project_monthly" {
  count           = local.terraform_billing_budget_on ? 1 : 0
  billing_account = data.google_billing_account.budget[0].id
  display_name    = "${var.project_id} monthly (${floor(var.billing_budget_amount_usd)} USD)"

  budget_filter {
    projects = ["projects/${data.google_project.budget_scope[0].number}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(floor(var.billing_budget_amount_usd))
    }
  }

  threshold_rules {
    threshold_percent = var.billing_budget_alert_threshold_percent
  }

  threshold_rules {
    threshold_percent = 1.0
  }

  depends_on = [google_project_service.apis]
}
