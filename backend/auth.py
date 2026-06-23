"""Auth — JWT + bcrypt + email OTP. Owner credentials read from MongoDB (settable via admin panel),
with env-var fallback for the very first login.

Now supports a multi-user team with role-based permissions:
  - owner: full access (single account, the original Yaniv)
  - admin: full access to operational data
  - member: read + reply only by default; can be granted per-resource edit/delete
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List
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

# Default RBAC permission template for each role.
DEFAULT_PERMISSIONS: Dict[str, Dict[str, bool]] = {
    "owner": {
        "quotes.read": True, "quotes.edit": True, "quotes.delete": True, "quotes.reply": True,
        "customers.read": True, "customers.edit": True, "customers.delete": True, "customers.email": True,
        "products.read": True, "products.edit": True, "products.delete": True,
        "categories.read": True, "categories.edit": True, "categories.delete": True,
        "settings.read": True, "settings.edit": True,
        "team.read": True, "team.edit": True, "team.delete": True,
        "templates.read": True, "templates.edit": True,
    },
    "admin": {
        "quotes.read": True, "quotes.edit": True, "quotes.delete": True, "quotes.reply": True,
        "customers.read": True, "customers.edit": True, "customers.delete": True, "customers.email": True,
        "products.read": True, "products.edit": True, "products.delete": True,
        "categories.read": True, "categories.edit": True, "categories.delete": True,
        "settings.read": True, "settings.edit": True,
        "team.read": True, "team.edit": False, "team.delete": False,
        "templates.read": True, "templates.edit": True,
    },
    "member": {
        "quotes.read": True, "quotes.edit": True, "quotes.delete": False, "quotes.reply": True,
        "customers.read": True, "customers.edit": False, "customers.delete": False, "customers.email": True,
        "products.read": True, "products.edit": False, "products.delete": False,
        "categories.read": True, "categories.edit": False, "categories.delete": False,
        "settings.read": True, "settings.edit": False,
        "team.read": True, "team.edit": False, "team.delete": False,
        "templates.read": True, "templates.edit": False,
    },
}


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
    """Validate owner credentials. The legacy single-owner record continues to work."""
    rec = await _get_owner_record()
    if email.lower().strip() != rec["email"].lower().strip():
        return False
    return verify_password(password, rec["password_hash"])


async def verify_user(email: str, password: str) -> Optional[dict]:
    """Validate ANY active user (owner or invited team member). Returns the user record on success."""
    e = email.lower().strip()
    # Owner first
    rec = await _get_owner_record()
    if e == rec["email"].lower().strip() and verify_password(password, rec["password_hash"]):
        return {"email": rec["email"], "role": "owner", "name": "Owner", "permissions": DEFAULT_PERMISSIONS["owner"]}
    # Then team
    tm = await _DB.team_members.find_one({"email": e, "active": True})
    if tm and verify_password(password, tm.get("password_hash", "")):
        return {
            "email": tm["email"],
            "role": tm.get("role", "member"),
            "name": tm.get("name") or tm["email"],
            "permissions": tm.get("permissions") or DEFAULT_PERMISSIONS.get(tm.get("role", "member"), {}),
        }
    return None


async def get_user_record(email: str) -> Optional[dict]:
    """Look up a user (owner or team) by email — used by JWT verification to load permissions."""
    e = email.lower().strip()
    rec = await _get_owner_record()
    if e == rec["email"].lower().strip():
        return {"email": rec["email"], "role": "owner", "name": "Owner", "permissions": DEFAULT_PERMISSIONS["owner"]}
    tm = await _DB.team_members.find_one({"email": e, "active": True})
    if tm:
        return {
            "email": tm["email"],
            "role": tm.get("role", "member"),
            "name": tm.get("name") or tm["email"],
            "permissions": tm.get("permissions") or DEFAULT_PERMISSIONS.get(tm.get("role", "member"), {}),
        }
    return None


async def list_team_members() -> List[dict]:
    rows = await _DB.team_members.find({}, {"password_hash": 0}).sort("createdAt", -1).to_list(None)
    out = []
    for r in rows:
        r["id"] = str(r.pop("_id"))
        out.append(r)
    return out


async def create_team_member(email: str, name: str, role: str, password: str, permissions: Optional[dict] = None, notifications: Optional[dict] = None) -> dict:
    e = email.lower().strip()
    if role not in ("admin", "member"):
        raise ValueError("role must be 'admin' or 'member'")
    if await _DB.team_members.find_one({"email": e}):
        raise ValueError("Email already exists")
    rec = {
        "email": e,
        "name": name.strip(),
        "role": role,
        "password_hash": hash_password(password),
        "permissions": permissions or DEFAULT_PERMISSIONS[role],
        "notifications": notifications or {"newRfq": False},
        "active": True,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    res = await _DB.team_members.insert_one(rec)
    rec["id"] = str(res.inserted_id)
    rec.pop("password_hash", None)
    rec.pop("_id", None)
    return rec


async def update_team_member(member_id: str, *, name: Optional[str] = None, role: Optional[str] = None,
                              permissions: Optional[dict] = None, notifications: Optional[dict] = None,
                              active: Optional[bool] = None,
                              password: Optional[str] = None) -> bool:
    from bson import ObjectId
    try:
        oid = ObjectId(member_id)
    except Exception:
        return False
    patch: Dict = {"updatedAt": datetime.now(timezone.utc).isoformat()}
    if name is not None:
        patch["name"] = name.strip()
    if role is not None and role in ("admin", "member"):
        patch["role"] = role
        if not permissions:
            patch["permissions"] = DEFAULT_PERMISSIONS[role]
    if permissions is not None:
        patch["permissions"] = permissions
    if notifications is not None:
        patch["notifications"] = notifications
    if active is not None:
        patch["active"] = bool(active)
    if password:
        patch["password_hash"] = hash_password(password)
    res = await _DB.team_members.update_one({"_id": oid}, {"$set": patch})
    return res.matched_count > 0


async def delete_team_member(member_id: str) -> bool:
    from bson import ObjectId
    try:
        oid = ObjectId(member_id)
    except Exception:
        return False
    res = await _DB.team_members.delete_one({"_id": oid})
    return res.deleted_count > 0


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


def issue_jwt(email: str, role: str = "owner", permissions: Optional[dict] = None) -> str:
    payload = {
        "sub": email,
        "role": role,
        "perm": permissions or DEFAULT_PERMISSIONS.get(role, {}),
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(seconds=JWT_TTL_SECONDS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_jwt(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None


async def require_user(authorization: Optional[str] = Header(None)) -> dict:
    """Any authenticated team user (owner / admin / member)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(None, 1)[1]
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return payload


async def require_owner(authorization: Optional[str] = Header(None)) -> dict:
    """Strict: owner only (used for sensitive settings + team-management endpoints)."""
    payload = await require_user(authorization)
    if payload.get("role") != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner only")
    return payload


def require_perm(perm: str):
    """Dependency factory — returns a dep that ensures the JWT carries `perm`."""
    async def _dep(authorization: Optional[str] = Header(None)) -> dict:
        payload = await require_user(authorization)
        if payload.get("role") == "owner":
            return payload  # owner always wins
        perms = payload.get("perm") or {}
        if not perms.get(perm):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing permission: {perm}")
        return payload
    return _dep
