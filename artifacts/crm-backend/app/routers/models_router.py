from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas import ModelResponse, ModelUpdate
from app.deps import get_current_user, require_admin
from app.services.litellm_client import sync_models_from_litellm

router = APIRouter()


@router.get("", response_model=List[ModelResponse])
def list_models(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return db.query(models.Model).order_by(models.Model.model_name).all()


@router.post("/sync", response_model=dict)
def sync_models(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    synced, errors = sync_models_from_litellm(db)
    return {"synced": synced, "errors": errors}


@router.patch("/{model_id}", response_model=ModelResponse)
def update_model(
    model_id: UUID,
    data: ModelUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    model = db.query(models.Model).filter(models.Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if data.general_model_name is not None:
        model.general_model_name = data.general_model_name
    if data.release_date is not None:
        model.release_date = data.release_date
    if data.context_length is not None:
        model.context_length = data.context_length
    db.commit()
    db.refresh(model)
    return model
