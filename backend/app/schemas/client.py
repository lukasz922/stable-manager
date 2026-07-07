from pydantic import BaseModel, EmailStr


class ClientCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str | None = None
    email: EmailStr | None = None
    riding_level: str | None = None
    barcode: str | None = None
    qr_code: str | None = None
    rfid_uid: str | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    riding_level: str | None = None
    barcode: str | None = None
    qr_code: str | None = None
    rfid_uid: str | None = None
    notes: str | None = None


class ClientResponse(ClientCreate):
    id: int

    model_config = {
        "from_attributes": True
    }