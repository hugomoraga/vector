project_id  = "vector-app-prod"
region      = "us-central1"
environment = "prod"
github_repo = "hugomoraga/vector"

# Overridden automatically by tf.sh from Cloud Run (see --no-sync-images).
api_image = ""
web_image = ""

# telegram_bot_username = "YourVectorBot"

# Optional Telegram copy for the API (same as nonprod.tfvars). Leave unset to use code defaults.
telegram_msg_welcome_plain = <<-EOT
Hola. Tu chat es {{chatId}}.

Abre Vector en la web → Ajustes → Telegram → Conectar.
EOT

telegram_msg_welcome_linked = "Vector quedó vinculado. Te avisaré aquí."
telegram_msg_link_invalid   = "Enlace inválido o caducado. Vuelve a Ajustes y genera otro."