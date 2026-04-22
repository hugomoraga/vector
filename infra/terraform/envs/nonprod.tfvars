project_id  = "vector-app-nonprod"
region      = "us-central1"
environment = "nonprod"
github_repo = "hugomoraga/vector"

# Overridden automatically by tf.sh from Cloud Run (see --no-sync-images).
api_image = ""
web_image = ""

# Telegram bot handle without @ (optional; required for Settings → Connect Telegram)
telegram_bot_username = "vector_reminder_bot"
