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

# SSO (Viettel auth.viettel.vn)
SSO_AUTH_URL = os.environ.get("SSO_AUTH_URL", "https://auth.viettel.vn/auth/login")
SSO_LOGOUT_URL = os.environ.get("SSO_LOGOUT_URL", "https://auth.viettel.vn/auth/logout")
SSO_APP_CODE = os.environ.get("SSO_APP_CODE", "netmind")
SSO_SERVICE_URL = os.environ.get("SSO_SERVICE_URL", "https://netmind.viettel.vn/gateway/login")
SSO_TICKET_API_URL = os.environ.get(
    "SSO_TICKET_API_URL",
    "https://netmind.viettel.vn/vtnet-assistant/v1/api/ai/getUserInfoFromSsoTicket",
)
SSO_TICKET_API_BEARER = os.environ.get("SSO_TICKET_API_BEARER", "")
