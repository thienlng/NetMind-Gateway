from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app import models
from app.schemas import KeyCreate, KeyResponse, KeyCreateResponse
from app.deps import get_current_user, require_admin
from app.services.litellm_client import create_litellm_key, delete_litellm_key, regenerate_litellm_key

router = APIRouter()


def _check_key_access(db: Session, key: models.Key, user: models.User):
    if user.role == "admin":
        return
    if key.user_id == user.id:
        return
        
    owner_member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == key.project_id,
        models.ProjectMember.user_id == user.id,
        models.ProjectMember.role == "owner"
    ).first()
    if not owner_member:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("", response_model=List[KeyResponse])
def list_keys(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Key)
    if current_user.role != "admin":
        owned_projects = db.query(models.ProjectMember.project_id).filter(
            models.ProjectMember.user_id == current_user.id,
            models.ProjectMember.role == "owner"
        ).all()
        owned_project_ids = [p[0] for p in owned_projects]
        
        q = q.filter(
            or_(
                models.Key.user_id == current_user.id,
                models.Key.project_id.in_(owned_project_ids)
            )
        )
    return q.order_by(models.Key.created_at.desc()).all()


@router.post("", response_model=KeyCreateResponse, status_code=status.HTTP_201_CREATED)
def create_key(
    data: KeyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if data.type == "service":
        member = db.query(models.ProjectMember).filter(
            models.ProjectMember.project_id == data.project_id,
            models.ProjectMember.user_id == current_user.id,
            models.ProjectMember.role == "owner",
        ).first()
        if not member and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only project owners or admins can create service keys")
    member_check = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == data.project_id,
        models.ProjectMember.user_id == current_user.id,
    ).first()
    if not member_check and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not a member of this project")

    target_user_id = data.user_id or current_user.id

    if data.type == "personal":
        if target_user_id != current_user.id:
            # Only project owners or admins can create personal keys for other members
            if current_user.role != "admin":
                owner_check = db.query(models.ProjectMember).filter(
                    models.ProjectMember.project_id == data.project_id,
                    models.ProjectMember.user_id == current_user.id,
                    models.ProjectMember.role == "owner",
                ).first()
                if not owner_check:
                    raise HTTPException(status_code=403, detail="Only project owners or admins can create keys for other members")
            
            # Check if target_user is a member
            target_member = db.query(models.ProjectMember).filter(
                models.ProjectMember.project_id == data.project_id,
                models.ProjectMember.user_id == target_user_id,
            ).first()
            if not target_member:
                raise HTTPException(status_code=400, detail="Target user is not a member of this project")
                
            target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
            if not target_user:
                raise HTTPException(status_code=404, detail="Target user not found")
            suffix = target_user.username
        else:
            suffix = current_user.username
    else:
        suffix = "service"
        target_user_id = None

    key_alias = f"[{project.project_alias}][{suffix}]{data.key_name}"

    raw_key, key_token, key_display, litellm_created_by = create_litellm_key(
        key_alias=key_alias,
        models=data.models,
        max_budget=data.max_budget,
        expires=data.expires,
        tpm_limit=data.tpm_limit,
        rpm_limit=data.rpm_limit,
    )

    key_obj = models.Key(
        id=key_token,
        key_token=raw_key,
        key_alias=key_alias,
        key_display=key_display,
        spend=0,
        max_budget=data.max_budget,
        expires=data.expires,
        models=data.models,
        tpm_limit=data.tpm_limit,
        rpm_limit=data.rpm_limit,
        user_id=target_user_id,
        project_id=data.project_id,
        type=data.type,
        created_by=current_user.id,
        litellm_created_by=litellm_created_by,
    )
    db.add(key_obj)
    db.commit()
    db.refresh(key_obj)

    result = KeyCreateResponse.model_validate(key_obj)
    result.raw_key = raw_key
    return result


@router.get("/{key_id}", response_model=KeyResponse)
def get_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    key = db.query(models.Key).filter(models.Key.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    _check_key_access(db, key, current_user)
    return key


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    key = db.query(models.Key).filter(models.Key.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    _check_key_access(db, key, current_user)
    delete_litellm_key(key.id)
    db.delete(key)
    db.commit()


@router.post("/{key_id}/regenerate", response_model=KeyCreateResponse)
def regenerate_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    key = db.query(models.Key).filter(models.Key.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    _check_key_access(db, key, current_user)

    raw_key, new_token, new_display, litellm_updated_by = regenerate_litellm_key(
        old_token=key.id,
        key_alias=key.key_alias,
        models=key.models,
        max_budget=key.max_budget,
        expires=key.expires,
        tpm_limit=key.tpm_limit,
        rpm_limit=key.rpm_limit,
    )


    key.id = new_token
    key.key_token = raw_key
    key.key_display = new_display
    key.litellm_updated_by = litellm_updated_by
    db.commit()
    db.refresh(key)

    result = KeyCreateResponse.model_validate(key)
    result.raw_key = raw_key
    return result
