"""
LiteLLM API client.
All functions handle the case where LITELLM_BASE_URL or LITELLM_MASTER_KEY is not set:
they return stub data so the CRM can operate without LiteLLM for now.
"""
import hashlib
import secrets
from typing import Optional, List, Tuple
from datetime import datetime
import httpx
from sqlalchemy.orm import Session
from app.config import LITELLM_BASE_URL, LITELLM_MASTER_KEY
from app import models


def _headers() -> dict:
    return {"Authorization": f"Bearer {LITELLM_MASTER_KEY}"}


def _is_configured() -> bool:
    return bool(LITELLM_BASE_URL and LITELLM_MASTER_KEY)


def sync_models_from_litellm(db: Session) -> Tuple[int, List[str]]:
    """Sync models from LiteLLM /model/info endpoint."""
    if not _is_configured():
        return 0, ["LiteLLM not configured (LITELLM_BASE_URL / LITELLM_MASTER_KEY not set)"]

    try:
        resp = httpx.get(f"{LITELLM_BASE_URL}/model/info", headers=_headers(), timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return 0, [str(e)]

    synced = 0
    errors = []
    raw_models = data.get("data", [])

    for item in raw_models:
        try:
            model_info = item.get("model_info", {})
            litellm_params = item.get("litellm_params", {})
            model_id = model_info.get("id")
            if not model_id:
                continue

            existing = db.query(models.Model).filter(models.Model.id == model_id).first()
            if existing:
                existing.model_name = item.get("model_name", existing.model_name)
                existing.input_cost_per_token = litellm_params.get("input_cost_per_token")
                existing.output_cost_per_token = litellm_params.get("output_cost_per_token")
                existing.tpm = litellm_params.get("tpm")
                existing.rpm = litellm_params.get("rpm")
                if model_info.get("updated_at"):
                    existing.litellm_updated_at = datetime.fromisoformat(model_info["updated_at"])
                existing.litellm_updated_by = model_info.get("updated_by")
            else:
                new_model = models.Model(
                    id=model_id,
                    model_name=item.get("model_name", ""),
                    input_cost_per_token=litellm_params.get("input_cost_per_token"),
                    output_cost_per_token=litellm_params.get("output_cost_per_token"),
                    tpm=litellm_params.get("tpm"),
                    rpm=litellm_params.get("rpm"),
                    litellm_updated_by=model_info.get("updated_by"),
                    litellm_created_by=model_info.get("created_by"),
                )
                if model_info.get("updated_at"):
                    new_model.litellm_updated_at = datetime.fromisoformat(model_info["updated_at"])
                if model_info.get("created_at"):
                    new_model.litellm_created_at = datetime.fromisoformat(model_info["created_at"])
                db.add(new_model)
            synced += 1
        except Exception as e:
            errors.append(f"Error syncing model: {e}")

    db.commit()
    return synced, errors


def create_litellm_key(
    key_alias: str,
    models: List[str],
    max_budget: Optional[float],
    expires: Optional[datetime],
    tpm_limit: Optional[int],
    rpm_limit: Optional[int],
) -> Tuple[Optional[str], str, str, str]:
    """
    Returns: (raw_key, key_token, key_display, created_by)
    If LiteLLM not configured, generates a stub key.
    """
    if not _is_configured():
        raw = "sk-" + secrets.token_hex(20)
        token = hashlib.sha256(raw.encode()).hexdigest()
        display = raw[:8] + "..." + raw[-4:]
        return raw, token, display, "crm"

    payload: dict = {"key_alias": key_alias, "models": models}
    if max_budget is not None:
        payload["max_budget"] = max_budget
    if expires is not None:
        payload["expires"] = expires.isoformat()
    if tpm_limit is not None:
        payload["tpm_limit"] = tpm_limit
    if rpm_limit is not None:
        payload["rpm_limit"] = rpm_limit

    try:
        resp = httpx.post(f"{LITELLM_BASE_URL}/key/generate", json=payload, headers=_headers(), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        raw = data.get("key")
        token = data.get("token") or hashlib.sha256(raw.encode()).hexdigest()
        display = data.get("key_name") or (raw[:8] + "..." + raw[-4:])
        created_by = data.get("created_by", "litellm")
        return raw, token, display, created_by
    except Exception as e:
        raw = "sk-" + secrets.token_hex(20)
        token = hashlib.sha256(raw.encode()).hexdigest()
        display = raw[:8] + "..." + raw[-4:]
        return raw, token, display, "crm-fallback"


def delete_litellm_key(key_token: str) -> bool:
    if not _is_configured():
        return True
    try:
        resp = httpx.post(
            f"{LITELLM_BASE_URL}/key/delete",
            json={"keys": [key_token]},
            headers=_headers(),
            timeout=30,
        )
        return resp.status_code == 200
    except Exception:
        return False


def regenerate_litellm_key(
    old_token: str,
    key_alias: str,
    models: List[str],
    max_budget: Optional[float],
    expires: Optional[datetime],
    tpm_limit: Optional[int],
    rpm_limit: Optional[int],
) -> Tuple[Optional[str], str, str, str]:
    """Delete old key and create a new one. Returns (raw_key, token, display, updated_by)."""
    delete_litellm_key(old_token)
    return create_litellm_key(
        key_alias=key_alias,
        models=models,
        max_budget=max_budget,
        expires=expires,
        tpm_limit=tpm_limit,
        rpm_limit=rpm_limit,
    )
