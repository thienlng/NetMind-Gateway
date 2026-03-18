import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models  # noqa: F401 - needed for Base.metadata
from app.routers import auth, users, models_router, projects, keys
from app.auth import hash_password
from app.database import SessionLocal
from app.config import ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME

API_PREFIX = os.getenv("API_PREFIX", "/crm-api")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CRM API",
    version="1.0.0",
    docs_url=f"{API_PREFIX}/docs",
    openapi_url=f"{API_PREFIX}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{API_PREFIX}/users", tags=["users"])
app.include_router(models_router.router, prefix=f"{API_PREFIX}/models", tags=["models"])
app.include_router(projects.router, prefix=f"{API_PREFIX}/projects", tags=["projects"])
app.include_router(keys.router, prefix=f"{API_PREFIX}/keys", tags=["keys"])


@app.on_event("startup")
def create_default_admin():
    if not ADMIN_PASSWORD:
        print("Warning: ADMIN_PASSWORD not set, skipping default admin creation")
        return

    db = SessionLocal()
    try:
        from app.models import User
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            default_admin = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                full_name=ADMIN_FULL_NAME,
                role="admin",
            )
            db.add(default_admin)
            db.commit()
            print(f"Created default admin user: {ADMIN_USERNAME}")
    except Exception as e:
        print(f"Error creating default admin: {e}")
    finally:
        db.close()


@app.get(f"{API_PREFIX}/healthz")
def health():
    return {"status": "ok"}
