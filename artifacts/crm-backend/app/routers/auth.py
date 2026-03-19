import uuid
import httpx
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas import (
    LoginRequest,
    SSOLoginRequest,
    SSOConfigResponse,
    TokenResponse,
    UserResponse,
)
from app.auth import verify_password, create_access_token
from app.deps import get_current_user
from app.config import (
    SSO_AUTH_URL,
    SSO_LOGOUT_URL,
    SSO_APP_CODE,
    SSO_SERVICE_URL,
    SSO_TICKET_API_URL,
    SSO_TICKET_API_BEARER,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(str(user.id), user.username, user.role)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ── SSO endpoints ─────────────────────────────────────────────────────────────

@router.get("/sso/config", response_model=SSOConfigResponse)
def sso_config():
    """Return the SSO login URL for the frontend (public endpoint)."""
    login_url = f"{SSO_AUTH_URL}?appCode={SSO_APP_CODE}&service={SSO_SERVICE_URL}"
    return SSOConfigResponse(
        sso_login_url=login_url,
        enabled=bool(SSO_TICKET_API_BEARER),
    )


@router.get("/sso/logout-url")
def sso_logout_url():
    """Return the SSO logout URL so the frontend can redirect after local logout."""
    logout_url = f"{SSO_LOGOUT_URL}?appCode={SSO_APP_CODE}&service={SSO_SERVICE_URL}"
    return {"logout_url": logout_url}


@router.post("/sso/login", response_model=TokenResponse)
def sso_login(data: SSOLoginRequest, db: Session = Depends(get_db)):
    """
    Validate a Viettel SSO ticket, then find or create the local user.

    ⚠️  Tickets are single-use – calling getUserInfoFromSsoTicket a second time
    with the same ticket will return userInfo: null.  We must never retry.
    """
    if not SSO_TICKET_API_BEARER:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SSO is not configured on this server",
        )

    # --- 1. Validate the ticket against the Viettel API -----------------------
    try:
        response = httpx.post(
            SSO_TICKET_API_URL,
            json={"service": SSO_SERVICE_URL, "requestFromPrivate": True},
            headers={
                "Authorization": f"Bearer {SSO_TICKET_API_BEARER}",
                "Content-Type": "application/json",
                "User-Ticket": data.ticket,
            },
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("SSO ticket API returned %s: %s", exc.response.status_code, exc.response.text)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to validate SSO ticket (upstream error)",
        )
    except httpx.RequestError as exc:
        logger.error("SSO ticket API request failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach SSO validation service",
        )

    user_info = payload.get("userInfo")
    if not user_info:
        # Ticket already used or invalid
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired SSO ticket",
        )

    # --- 2. Extract fields from userInfo --------------------------------------
    sso_username: str = user_info.get("username", "").strip()
    sso_fullname: str = user_info.get("fullname", sso_username)
    sso_email: str = user_info.get("email", "").strip()
    sso_dept_name: str | None = user_info.get("departments_name")
    sso_dept_fullname: str | None = user_info.get("departments_fullname")
    sso_dept_id: int | None = user_info.get("departments_id")
    sso_staff_code: str | None = user_info.get("staff_code")
    sso_company_title: str | None = user_info.get("company_title")
    sso_phone: str | None = user_info.get("phone")

    if not sso_username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SSO response did not include a username",
        )

    # Normalise email – API may return UPPERCASE
    if sso_email:
        sso_email = sso_email.lower()

    # --- 3. Find or create local user ----------------------------------------
    user = db.query(models.User).filter(models.User.username == sso_username).first()

    if not user:
        # First SSO login – auto-create account
        # Use email as-is or fabricate one if blank
        email_to_use = sso_email or f"{sso_username}@viettel.com.vn"

        # If another account holds this email, generate a unique one
        if db.query(models.User).filter(models.User.email == email_to_use).first():
            email_to_use = f"{sso_username}+sso@viettel.com.vn"

        user = models.User(
            id=uuid.uuid4(),
            username=sso_username,
            email=email_to_use,
            full_name=sso_fullname,
            password_hash=None,  # SSO-only user has no local password
            role="user",
            auth_provider="sso",
            department_name=sso_dept_name,
            department_fullname=sso_dept_fullname,
            department_id=sso_dept_id,
            staff_code=sso_staff_code,
            company_title=sso_company_title,
            phone=sso_phone,
        )
        db.add(user)
        logger.info("Created new SSO user: %s", sso_username)
    else:
        # Existing user – refresh SSO profile fields
        user.full_name = sso_fullname or user.full_name
        user.department_name = sso_dept_name
        user.department_fullname = sso_dept_fullname
        user.department_id = sso_dept_id
        user.staff_code = sso_staff_code
        user.company_title = sso_company_title
        user.phone = sso_phone
        user.auth_provider = "sso"
        logger.info("SSO login for existing user: %s", sso_username)

    db.commit()
    db.refresh(user)

    # --- 4. Issue JWT ---------------------------------------------------------
    token = create_access_token(str(user.id), user.username, user.role)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )
