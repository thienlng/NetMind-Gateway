import re
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectModelAdd, ProjectModelResponse,
    MemberAdd, MemberUpdate, MemberResponse,
    ModelResponse, UserResponse,
)
from app.deps import get_current_user, require_admin

router = APIRouter()

ALIAS_RE = re.compile(r'^[a-z][a-z0-9_]*$')


def _project_response(project: models.Project, db: Session, user_id: UUID = None) -> dict:
    member_count = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project.id
    ).count()
    model_count = db.query(models.ProjectModel).filter(
        models.ProjectModel.project_id == project.id
    ).count()
    d = {c.key: getattr(project, c.key) for c in project.__table__.columns}
    d["member_count"] = member_count
    d["model_count"] = model_count
    
    if user_id:
        member = db.query(models.ProjectMember).filter(
            models.ProjectMember.project_id == project.id,
            models.ProjectMember.user_id == user_id
        ).first()
        d["my_role"] = member.role if member else None
    else:
        d["my_role"] = None
        
    return d


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == "admin":
        projects = db.query(models.Project).order_by(models.Project.created_at.desc()).all()
    else:
        member_project_ids = db.query(models.ProjectMember.project_id).filter(
            models.ProjectMember.user_id == current_user.id
        ).subquery()
        projects = db.query(models.Project).filter(
            models.Project.id.in_(member_project_ids)
        ).order_by(models.Project.created_at.desc()).all()
    return [_project_response(p, db, current_user.id) for p in projects]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    if not ALIAS_RE.match(data.project_alias):
        raise HTTPException(status_code=400, detail="project_alias must be lowercase letters, digits, underscores, starting with a letter")
    if db.query(models.Project).filter(models.Project.project_alias == data.project_alias).first():
        raise HTTPException(status_code=400, detail="project_alias already exists")
    project = models.Project(
        project_name=data.project_name,
        project_alias=data.project_alias,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(project)
    db.flush()
    owner = models.ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role="owner",
        added_by=current_user.id,
    )
    db.add(owner)
    db.commit()
    db.refresh(project)
    return _project_response(project, db, current_user.id)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != "admin":
        member = db.query(models.ProjectMember).filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.user_id == current_user.id,
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Forbidden")
    return _project_response(project, db, current_user.id)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_owner_or_admin(project_id, current_user, db)
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if data.project_name is not None:
        project.project_name = data.project_name
    if data.project_alias is not None:
        if not ALIAS_RE.match(data.project_alias):
            raise HTTPException(status_code=400, detail="Invalid project_alias format")
        existing = db.query(models.Project).filter(
            models.Project.project_alias == data.project_alias,
            models.Project.id != project_id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="project_alias already exists")
        project.project_alias = data.project_alias
    project.updated_by = current_user.id
    db.commit()
    db.refresh(project)
    return _project_response(project, db, current_user.id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()


@router.get("/{project_id}/models", response_model=List[ProjectModelResponse])
def list_project_models(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_project_access(project_id, current_user, db)
    pms = db.query(models.ProjectModel).filter(models.ProjectModel.project_id == project_id).all()
    result = []
    for pm in pms:
        m = db.query(models.Model).filter(models.Model.id == pm.model_id).first()
        d = {c.key: getattr(pm, c.key) for c in pm.__table__.columns}
        d["model"] = ModelResponse.model_validate(m) if m else None
        result.append(d)
    return result


@router.post("/{project_id}/models", response_model=ProjectModelResponse, status_code=status.HTTP_201_CREATED)
def add_project_model(
    project_id: UUID,
    data: ProjectModelAdd,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_owner_or_admin(project_id, current_user, db)
    model = db.query(models.Model).filter(models.Model.id == data.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    existing = db.query(models.ProjectModel).filter(
        models.ProjectModel.project_id == project_id,
        models.ProjectModel.model_id == data.model_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Model already in project")
    pm = models.ProjectModel(
        project_id=project_id,
        model_id=data.model_id,
        added_by=current_user.id,
    )
    db.add(pm)
    db.commit()
    db.refresh(pm)
    d = {c.key: getattr(pm, c.key) for c in pm.__table__.columns}
    d["model"] = ModelResponse.model_validate(model)
    return d


@router.delete("/{project_id}/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_model(
    project_id: UUID,
    model_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_owner_or_admin(project_id, current_user, db)
    pm = db.query(models.ProjectModel).filter(
        models.ProjectModel.project_id == project_id,
        models.ProjectModel.model_id == model_id,
    ).first()
    if not pm:
        raise HTTPException(status_code=404, detail="Model not in project")
    db.delete(pm)
    db.commit()


@router.get("/{project_id}/members", response_model=List[MemberResponse])
def list_members(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_project_access(project_id, current_user, db)
    members = db.query(models.ProjectMember).filter(models.ProjectMember.project_id == project_id).all()
    result = []
    for mem in members:
        user = db.query(models.User).filter(models.User.id == mem.user_id).first()
        d = {c.key: getattr(mem, c.key) for c in mem.__table__.columns}
        d["user"] = UserResponse.model_validate(user) if user else None
        result.append(d)
    return result


@router.post("/{project_id}/members", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def add_member(
    project_id: UUID,
    data: MemberAdd,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_owner_or_admin(project_id, current_user, db)
    if not db.query(models.Project).filter(models.Project.id == project_id).first():
        raise HTTPException(status_code=404, detail="Project not found")
    if not db.query(models.User).filter(models.User.id == data.user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == data.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already in project")
    mem = models.ProjectMember(
        project_id=project_id,
        user_id=data.user_id,
        role=data.role,
        added_by=current_user.id,
    )
    db.add(mem)
    db.commit()
    db.refresh(mem)
    user = db.query(models.User).filter(models.User.id == mem.user_id).first()
    d = {c.key: getattr(mem, c.key) for c in mem.__table__.columns}
    d["user"] = UserResponse.model_validate(user) if user else None
    return d


@router.patch("/{project_id}/members/{user_id}", response_model=MemberResponse)
def update_member_role(
    project_id: UUID,
    user_id: UUID,
    data: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_owner_or_admin(project_id, current_user, db)
    mem = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user_id,
    ).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Member not found")
    mem.role = data.role
    db.commit()
    db.refresh(mem)
    user = db.query(models.User).filter(models.User.id == mem.user_id).first()
    d = {c.key: getattr(mem, c.key) for c in mem.__table__.columns}
    d["user"] = UserResponse.model_validate(user) if user else None
    return d


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_owner_or_admin(project_id, current_user, db)
    mem = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user_id,
    ).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(mem)
    db.commit()


def _check_project_access(project_id: UUID, user: models.User, db: Session):
    if user.role == "admin":
        return
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden")


def _check_owner_or_admin(project_id: UUID, user: models.User, db: Session):
    if user.role == "admin":
        return
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user.id,
        models.ProjectMember.role == "owner",
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Owner or admin access required")
