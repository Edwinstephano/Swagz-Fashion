import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import argparse
from app.database import SessionLocal
from app.models import User, UserRole
from app.auth import get_password_hash

def create_user(name: str, username: str, password: str, role: str):
    db = SessionLocal()
    try:
        valid_roles = [r.value for r in UserRole]
        if role.lower() not in valid_roles:
            print(f"❌ Error: Invalid role '{role}'. Must be one of: {', '.join(valid_roles)}")
            return

        existing = db.query(User).filter(User.username == username).first()
        if existing:
            existing.name = name
            existing.password_hash = get_password_hash(password)
            existing.role = role.lower()
            db.commit()
            print(f"✅ Successfully updated user '{username}': Password updated & Role set to {role.upper()}")
            return

        user = User(
            name=name,
            username=username,
            password_hash=get_password_hash(password),
            role=role.lower()
        )
        db.add(user)
        db.commit()
        print(f"✅ Successfully created user: {name} (Username: {username}, Role: {role.upper()})")
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to create/update user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new Swagz POS staff user manually.")
    parser.add_argument("--name", required=True, help="Full Name of the user (e.g. 'Jane Doe')")
    parser.add_argument("--username", required=True, help="Unique username (e.g. 'jane')")
    parser.add_argument("--password", required=True, help="Password")
    parser.add_argument("--role", required=True, choices=["admin", "manager", "cashier"], help="User role: admin, manager, or cashier")

    args = parser.parse_args()
    create_user(args.name, args.username, args.password, args.role)
