project_id  = "vector-app-prod"
region      = "us-central1"
environment = "prod"
github_repo = "hugomoraga/vector"

# Leave empty until Telegram bot is created
telegram_bot_token_secret = ""

# These are set by CI/CD pipeline -- leave empty for initial apply
api_image = ""
web_image = ""
