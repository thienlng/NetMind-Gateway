import os

DATABASE_URL = os.environ.get("DATABASE_URL", "")
JWT_SECRET = os.environ.get("SESSION_SECRET", "changeme-replace-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

LITELLM_BASE_URL = os.environ.get("LITELLM_BASE_URL", "")
LITELLM_MASTER_KEY = os.environ.get("LITELLM_MASTER_KEY", "")

# Default admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@crm.local")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
ADMIN_FULL_NAME = os.environ.get("ADMIN_FULL_NAME", "System Admin")
