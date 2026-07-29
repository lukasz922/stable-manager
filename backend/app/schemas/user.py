from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    username: str
    full_name: str
    password: str
    role: str = "reception"


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    permissions: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    username: str
    full_name: str
    role: str


class UserStatusUpdate(BaseModel):
    is_active: bool


class PasswordChange(BaseModel):
    password: str


class UserActiveUpdate(BaseModel):
    is_active: bool