import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user
from app.db.mongo import get_db
from app.schemas.auth import (
    UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest, db=Depends(get_db)):
    email_clean = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email_clean})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "email_exists", "message": "An account with this email already exists.", "details": None}
        )

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    hashed_pw = hash_password(payload.password)

    user_doc = {
        "_id": user_id,
        "email": email_clean,
        "full_name": payload.full_name.strip(),
        "hashed_password": hashed_pw,
        "is_active": True,
        "is_demo_account": False,
        "created_at": now
    }
    await db.users.insert_one(user_doc)

    # Initialize default preferences
    pref_doc = {
        "user_id": user_id,
        "diet_type": "Balanced",
        "allergies": [],
        "cuisine_preferences": ["Mediterranean", "Asian"],
        "daily_calorie_target": 2000,
        "macro_targets": {"protein": 120, "carbs": 220, "fats": 65},
        "health_goals": ["Healthy lifestyle"],
        "updated_at": now
    }
    await db.preferences.insert_one(pref_doc)

    token = create_access_token(subject=user_id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={"id": user_id, "email": email_clean, "full_name": payload.full_name.strip()}
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLoginRequest, db=Depends(get_db)):
    email_clean = payload.email.lower().strip()
    user = await db.users.find_one({"email": email_clean})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "invalid_credentials", "message": "Incorrect email or password.", "details": None}
        )

    if not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "invalid_credentials", "message": "Incorrect email or password.", "details": None}
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "inactive_account", "message": "Account has been deactivated.", "details": None}
        )

    token = create_access_token(subject=str(user["_id"]))
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", "User")
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        full_name=current_user.get("full_name", ""),
        created_at=current_user.get("created_at", ""),
        is_demo_account=current_user.get("is_demo_account", False)
    )
