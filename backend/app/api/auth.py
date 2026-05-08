"""인증 API — Google ID 토큰 검증 → 쿠키 JWT 발급."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel

from app.core.auth import (
    AuthError,
    create_access_token,
    get_current_user,
    is_admin_email,
    verify_google_id_token,
)
from app.core.config import Settings, get_settings

router = APIRouter()


class GoogleVerifyBody(BaseModel):
    credential: str


class UserMe(BaseModel):
    email: str
    name: str
    picture: str
    is_admin: bool


def _set_auth_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.JWT_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
        path="/",
    )


@router.post("/google/verify", response_model=UserMe)
def google_verify(
    body: GoogleVerifyBody,
    response: Response,
    settings: Settings = Depends(get_settings),
) -> UserMe:
    try:
        info = verify_google_id_token(body.credential, settings)
    except AuthError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    email = info["email"]
    if not is_admin_email(email, settings):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="This email is not authorized for InfraWatcher admin access",
        )

    token = create_access_token(
        {"email": email, "sub": info["sub"], "name": info["name"]},
        settings,
    )
    _set_auth_cookie(response, token, settings)

    return UserMe(
        email=email,
        name=info["name"],
        picture=info["picture"],
        is_admin=True,
    )


@router.get("/me", response_model=UserMe)
def me(
    user: dict | None = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> UserMe:
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    email = user.get("email", "")
    return UserMe(
        email=email,
        name=user.get("name", ""),
        picture="",
        is_admin=is_admin_email(email, settings),
    )


@router.post("/logout")
def logout(response: Response, settings: Settings = Depends(get_settings)) -> dict:
    response.delete_cookie(key=settings.JWT_COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/config")
def public_config(settings: Settings = Depends(get_settings)) -> dict:
    """프론트엔드용 공개 설정 (GOOGLE_CLIENT_ID만 노출)."""
    return {"google_client_id": settings.GOOGLE_CLIENT_ID}
