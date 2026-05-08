from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from app.database import get_db
from app.models.user import User, UserMode, UserRole
from app.utils.auth import verify_password, get_password_hash, create_access_token
from app.config import settings
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    print(f"Login attempt for: {request.email}")
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if user.role else "viewer",
            "mode_preference": user.mode_preference.value if user.mode_preference else "personal"
        }
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    print(f"Registration attempt for: {request.email}")
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        print(f"User already exists: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    new_user = User(
        email=request.email,
        full_name=request.full_name,
        hashed_password=hashed_password,
        role=UserRole.VIEWER,
        mode_preference=UserMode.PERSONAL
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print(f"User created successfully: {request.email}")
    return {
        "message": "User created successfully",
        "user_id": new_user.id
    }

@router.get("/me")
def get_current_user_route(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if current_user.role else "viewer",
        "mode_preference": current_user.mode_preference.value if current_user.mode_preference else "personal",
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }
