from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
import uuid

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    company: Optional[str] = None
    
class SOP(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    steps: List[str]
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class Automation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    zap_id: str
    status: str
    connected_apps: List[str]
    sop_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
