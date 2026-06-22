"""Auth — JWT + bcrypt + email OTP for the admin owner panel."""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
import os
import secrets
import bcrypt
import jwt
from fastapi import HTTPException, Depends, Header, status

# ---------- Config (from env) ----------
JWT_SECRET = os.environ.get("JWT_SECRET", "mpt-dev-secret-change-me")
JWT_ALG = "HS256"
JWT_TTL_SECONDS = int(os.environ.get("JWT_TTL_SECONDS", "604800"))  # 7 days
OTP_TTL_SECONDS = int(os.environ.get("OTP_TTL_SECONDS", "600"))    # 10 min
OWNER_EMAIL = os.environ.get("ADMIN_EMAIL", "yaniv@masterpiece-innovations.com")
OWNER_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH", "")
OWNER_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Master2025!")

# In-memory OTP store (single-instance). Persisted to mongo could be added if needed.
_OTP_STORE: Dict[str, dict] = {}


# ---------- Helpers ----------
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def verify_owner(email: str, password: str) -> bool:
    """Verify email + password against env-configured owner credentials.

    If ADMIN_PASSWORD_HASH is set it takes precedence (production).
    Otherwise we compare against the literal ADMIN_PASSWORD (dev convenience).
    """
    if email.lower().strip() != OWNER_EMAIL.lower().strip():
        return False
    if OWNER_PASSWORD_HASH:
        return verify_password(password, OWNER_PASSWORD_HASH)
    return password == OWNER_PASSWORD


def make_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def issue_otp(email: str) -> str:
    """Generate + store a 6-digit OTP keyed by email. Returns the code."""
    code = make_otp()
    _OTP_STORE[email.lower().strip()] = {
        "code": code,
        "expires": datetime.now(timezone.utc) + timedelta(seconds=OTP_TTL_SECONDS),
        "attempts": 0,
    }
    return code


def verify_otp(email: str, code: str) -> bool:
    key = email.lower().strip()
    entry = _OTP_STORE.get(key)
    if not entry:
        return False
    if entry["attempts"] >= 5:
        _OTP_STORE.pop(key, None)
        return False
    if datetime.now(timezone.utc) > entry["expires"]:
        _OTP_STORE.pop(key, None)
        return False
    if entry["code"] != code.strip():
        entry["attempts"] += 1
        return False
    # one-time use
    _OTP_STORE.pop(key, None)
    return True


def issue_jwt(email: str) -> str:
    payload = {
        "sub": email,
        "role": "owner",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(seconds=JWT_TTL_SECONDS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_jwt(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None


async def require_owner(authorization: Optional[str] = Header(None)) -> dict:
    """FastAPI dependency: validate Bearer JWT and return payload."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(None, 1)[1]
    payload = decode_jwt(token)
    if not payload or payload.get("role") != "owner":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return payload
