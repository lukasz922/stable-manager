from pydantic import BaseModel, ConfigDict, Field


class PermissionRead(BaseModel):
    id: int
    code: str
    name: str
    module: str

    model_config = ConfigDict(from_attributes=True)


class RoleRead(BaseModel):
    id: int
    code: str
    name: str
    permissions: list[PermissionRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class RolePermissionsUpdate(BaseModel):
    permission_codes: list[str] = Field(default_factory=list)
