from sqlalchemy.orm import Session

from app.models.role_permission import Permission, Role


PERMISSIONS: dict[str, tuple[str, str]] = {
    "dashboard.view": ("Podgląd dashboardu", "dashboard"),
    "reception.view": ("Dostęp do recepcji", "reception"),
    "calendar.view": ("Podgląd kalendarza", "calendar"),
    "calendar.manage": ("Zarządzanie jazdami", "calendar"),
    "clients.view": ("Podgląd klientów", "clients"),
    "clients.manage": ("Zarządzanie klientami", "clients"),
    "horses.view": ("Podgląd koni", "horses"),
    "horses.manage": ("Zarządzanie końmi", "horses"),
    "instructors.view": ("Podgląd instruktorów", "instructors"),
    "instructors.manage": ("Zarządzanie instruktorami", "instructors"),
    "schedule.view": ("Podgląd grafiku instruktorów", "schedule"),
    "schedule.manage": ("Zarządzanie grafikiem instruktorów", "schedule"),
    "availability.manage": (
        "Rozpatrywanie dyspozycyjności",
        "availability",
    ),
    "passes.view": ("Podgląd karnetów", "passes"),
    "passes.manage": ("Zarządzanie karnetami", "passes"),
    "scanner.use": ("Korzystanie ze skanera", "scanner"),
    "users.manage": ("Zarządzanie użytkownikami", "users"),
    "roles.manage": ("Zarządzanie rolami i uprawnieniami", "roles"),
    "payments.view": ("Podgląd płatności", "payments"),
    "payments.manage": ("Zarządzanie płatnościami", "payments"),
    "reports.view": ("Podgląd raportów", "reports"),
    "instructor.panel": ("Własny panel instruktora", "instructor"),
}


DEFAULT_ROLE_PERMISSIONS: dict[str, set[str]] = {
    "admin": set(PERMISSIONS) - {"instructor.panel"},
    "reception": {
        "dashboard.view",
        "reception.view",
        "calendar.view",
        "calendar.manage",
        "clients.view",
        "clients.manage",
        "horses.view",
        "horses.manage",
        "instructors.view",
        "schedule.view",
        "schedule.manage",
        "passes.view",
        "passes.manage",
        "scanner.use",
    },
    "instructor": {
        "instructor.panel",
    },
    "viewer": {
        "dashboard.view",
        "calendar.view",
        "clients.view",
        "horses.view",
        "instructors.view",
        "schedule.view",
        "passes.view",
        "reports.view",
    },
}


ROLE_NAMES = {
    "admin": "Administrator",
    "reception": "Recepcja",
    "instructor": "Instruktor",
    "viewer": "Podgląd",
}


def seed_roles_and_permissions(db: Session) -> None:
    permissions_by_code: dict[str, Permission] = {}

    for code, (name, module) in PERMISSIONS.items():
        permission = (
            db.query(Permission)
            .filter(Permission.code == code)
            .first()
        )

        if permission is None:
            permission = Permission(
                code=code,
                name=name,
                module=module,
            )
            db.add(permission)
            db.flush()
        else:
            permission.name = name
            permission.module = module

        permissions_by_code[code] = permission

    for role_code, permission_codes in DEFAULT_ROLE_PERMISSIONS.items():
        role = (
            db.query(Role)
            .filter(Role.code == role_code)
            .first()
        )

        if role is None:
            role = Role(
                code=role_code,
                name=ROLE_NAMES.get(role_code, role_code),
            )
            db.add(role)
            db.flush()

            role.permissions = [
                permissions_by_code[code]
                for code in sorted(permission_codes)
            ]
        else:
            role.name = ROLE_NAMES.get(role_code, role_code)

            # Nie nadpisujemy późniejszych zmian administratora.
            # Uzupełniamy domyślne przypisania tylko dla pustej roli.
            if not role.permissions:
                role.permissions = [
                    permissions_by_code[code]
                    for code in sorted(permission_codes)
                ]

    instructor_panel = permissions_by_code["instructor.panel"]

    for role in db.query(Role).all():
        if role.code == "instructor":
            if instructor_panel not in role.permissions:
                role.permissions.append(instructor_panel)
        elif instructor_panel in role.permissions:
            role.permissions.remove(instructor_panel)

    db.commit()