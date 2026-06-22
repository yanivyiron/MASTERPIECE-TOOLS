"""Auth — JWT + bcrypt + email OTP. Owner credentials read from MongoDB (settable via admin panel),
with env-var fallback for the very first login.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
import os
import secrets
import bcrypt
import jwt
from fastapi import HTTPException, Depends, Header, status
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

JWT_SECRET = os.environ.get("JWT_SECRET", "mpt-dev-secret-change-me")
JWT_ALG = "HS256"
JWT_TTL_SECONDS = int(os.environ.get("JWT_TTL_SECONDS", "604800"))
OTP_TTL_SECONDS = int(os.environ.get("OTP_TTL_SECONDS", "600"))
DEFAULT_OWNER_EMAIL = os.environ.get("ADMIN_EMAIL", "yaniv@masterpiece-innovations.com")
DEFAULT_OWNER_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Master2025!")

_MONGO = AsyncIOMotorClient(os.environ["MONGO_URL"])
_DB = _MONGO[os.environ["DB_NAME"]]

_OTP_STORE: Dict[str, dict] = {}


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


async def _get_owner_record() -> dict:
    """Returns the owner credentials record from db.owner_account, seeding it from env if missing."""
    doc = await _DB.owner_account.find_one({"_id": "owner"})
    if not doc:
        # First-run bootstrap from env
        doc = {
            "_id": "owner",
            "email": DEFAULT_OWNER_EMAIL,
            "password_hash": hash_password(DEFAULT_OWNER_PASSWORD),
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        await _DB.owner_account.insert_one(doc)
    return doc


async def get_owner_email() -> str:
    rec = await _get_owner_record()
    return rec["email"]


async def verify_owner(email: str, password: str) -> bool:
    rec = await _get_owner_record()
    if email.lower().strip() != rec["email"].lower().strip():
        return False
    return verify_password(password, rec["password_hash"])


async def change_owner_password(current_password: str, new_password: str) -> bool:
    rec = await _get_owner_record()
    if not verify_password(current_password, rec["password_hash"]):
        return False
    await _DB.owner_account.update_one(
        {"_id": "owner"},
        {"$set": {"password_hash": hash_password(new_password), "passwordUpdatedAt": datetime.now(timezone.utc).isoformat()}},
    )
    return True


async def change_owner_email(new_email: str) -> None:
    await _DB.owner_account.update_one(
        {"_id": "owner"},
        {"$set": {"email": new_email.lower().strip(), "emailUpdatedAt": datetime.now(timezone.utc).isoformat()}},
    )


def make_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def issue_otp(email: str) -> str:
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
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(None, 1)[1]
    payload = decode_jwt(token)
    if not payload or payload.get("role") != "owner":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return payload
