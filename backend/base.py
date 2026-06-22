"""Reusable BaseModel + ObjectId helpers."""
from datetime import datetime, timezone
from typing import Annotated, Optional, Any
from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field
import uuid


def _to_str(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    return v


PyObjectId = Annotated[str, BeforeValidator(_to_str)]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class BaseDocument(BaseModel):
    """Base for all Mongo documents. Coerces _id → id (str), datetime → ISO string."""
    model_config = ConfigDict(extra="ignore", populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc: dict):
        if not doc:
            return None
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return cls(**doc)

    def to_mongo(self) -> dict:
        d = self.model_dump(by_alias=False, exclude_none=True)
        # Remove `id` (Mongo will assign its own _id)
        d.pop("id", None)
        return d


def new_uuid() -> str:
    return uuid.uuid4().hex
