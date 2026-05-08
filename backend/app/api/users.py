from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User, UserMode
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

class ModeUpdateRequest(BaseModel):
    mode: str

@router.patch("/mode")
def update_user_mode(
    request: ModeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        mode_enum = UserMode(request.mode)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mode")
    
    current_user.mode_preference = mode_enum
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Mode updated successfully",
        "mode": current_user.mode_preference
    }

@router.get("/profile")
def get_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "mode_preference": current_user.mode_preference
    }
