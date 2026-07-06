from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.db.base import Base
from app.db.session import engine
from app.models.user import User

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StableManager API",
    version="0.1.0"
)

app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "app": "StableManager",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }