"""Google ID Token 검증 + 자체 JWT 발급/검증 + FastAPI 의존성."""

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import Settings, get_settings


class AuthError(Exception):
    """인증 실패 (재발급 불가능한 상태)."""


def verify_google_id_token(credential: str, settings: Settings) -> dict:
    """Google ID 토큰 검증 → {email, sub, name, picture} 반환."""
    if not settings.GOOGLE_CLIENT_ID:
        raise AuthError("GOOGLE_CLIENT_ID not configured")
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise AuthError(f"Invalid Google credential: {exc}") from exc

    if idinfo.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise AuthError("Invalid token issuer")

    email = idinfo.get("email")
    if not email or not idinfo.get("email_verified"):
        raise AuthError("Email not verified by Google")

    return {
        "email": email,
        "sub": idinfo["sub"],
        "name": idinfo.get("name", ""),
        "picture": idinfo.get("picture", ""),
    }


def is_admin_email(email: str, settings: Settings) -> bool:
    return email.lower() in settings.admin_email_set


def create_access_token(payload: dict, settings: Settings) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode = {**payload, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str, settings: Settings) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def get_current_user(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> dict | None:
    """쿠키에서 JWT 추출 → payload 반환. 비로그인은 None."""
    token = request.cookies.get(settings.JWT_COOKIE_NAME)
    if not token:
        return None
    return decode_access_token(token, settings)


def require_admin(
    user: dict | None = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict:
    """관리자 가드 — 미로그인/비관리자는 401."""
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    email = user.get("email", "")
    if not is_admin_email(email, settings):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user
