project_id  = "vector-app-nonprod"
region      = "us-central1"
environment = "nonprod"
github_repo = "hugomoraga/vector"

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