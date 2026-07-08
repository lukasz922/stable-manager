from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.clients import router as clients_router
from app.api.horses import router as horses_router
from app.api.instructors import router as instructors_router
from app.api.rides import router as rides_router

from app.db.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.client import Client
from app.models.horse import Horse
from app.models.instructor import Instructor


from app.models.ride import Ride

Base.metadata.create_all(bind=engine)

app = FastAPI(title="StableManager API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(horses_router)
app.include_router(instructors_router)
app.include_router(rides_router)



@app.get("/")
def root():
    return {"app": "StableManager", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}