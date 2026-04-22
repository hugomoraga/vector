project_id  = "vector-app-nonprod"
region      = "us-central1"
environment = "nonprod"
github_repo = "hugomoraga/vector"

# Optional billing account id. To create the budget via Terraform, also set terraform_billing_budget = true
# (requires cloudbillingbudgets.googleapis.com to be allowed on the project; otherwise use Console → Budgets).
# billing_account_id = ""

# Overridden automatically by tf.sh from Cloud Run (see --no-sync-images).
api_image = ""
web_image = ""

# Telegram bot handle without @ (optional; required for Settings → Connect Telegram)
telegram_bot_username = "vector_reminder_bot"

# Optional: override Telegram /start copy on the API (empty = use app defaults). Plain text may include {{chatId}}.
telegram_msg_welcome_plain = <<-EOT
Hola. Tu chat es {{chatId}}.

Abre Vector en la web → Ajustes → Telegram → Conectar.
EOT

telegram_msg_welcome_linked = "Vector quedó vinculado. Te avisaré aquí."
telegram_msg_link_invalid   = "Enlace inválido o caducado. Vuelve a Ajustes y genera otro."

billing_account_id       = "01ED7C-75922E-3CBE44"
terraform_billing_budget = false

# IAM: enable/disable APIs (e.g. Cloud Billing Budget API). CI needs the SA grant for terraform apply from GitHub.
service_usage_admin_users                      = ["hg.moraga@gmail.com"]
grant_github_deploy_sa_service_usage_admin     = true
# Opcional: JSON fusionado sobre apps/api/src/config/reminder-template.default.json (recordatorios del día).
# telegram_reminder_template_json = <<-EOT
# {"taskLine":"{slot_emoji} <b>{slot_label}</b>\\n<code>{title}</code>\\n\\n","footer":"<i>Listo.</i>"}
# EOT