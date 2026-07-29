from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.auth.security import hash_password


class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def get_all(self):
        return self.repo.get_all()

    def get_by_id(self, user_id: int):
        return self.repo.get_by_id(user_id)

    def create(
        self,
        username: str,
        full_name: str,
        password: str,
        role: str = "reception",
    ):
        existing = self.repo.get_by_username(username)

        if existing:
            raise ValueError("Użytkownik o takim loginie już istnieje.")

        user = User(
            username=username,
            full_name=full_name,
            hashed_password=hash_password(password),
            role=role,
            is_active=True,
        )

        return self.repo.create(user)

    def delete(self, user_id: int):
        user = self.repo.get_by_id(user_id)

        if not user:
            raise ValueError("Użytkownik nie istnieje.")

        self.repo.delete(user)
    def update(
        self,
        user_id: int,
        username: str,
        full_name: str,
        role: str,
    ):
        user = self.repo.get_by_id(user_id)

        if not user:
            raise ValueError("Użytkownik nie istnieje.")

        existing = self.repo.get_by_username(username)

        if existing and existing.id != user.id:
            raise ValueError("Użytkownik o takim loginie już istnieje.")

        user.username = username
        user.full_name = full_name
        user.role = role

        return self.repo.update(user)
    
    def set_active(self, user_id: int, is_active: bool):
        user = self.repo.get_by_id(user_id)

        if not user:
            raise ValueError("Użytkownik nie istnieje.")

        user.is_active = is_active

        return self.repo.update(user)
    def change_password(self, user_id: int, password: str):
        user = self.repo.get_by_id(user_id)

        if not user:
            raise ValueError("Użytkownik nie istnieje.")

        user.hashed_password = hash_password(password)

        return self.repo.update(user)