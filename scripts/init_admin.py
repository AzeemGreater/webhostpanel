import sys
import random
import string
import os

# Set sys.path so we can import from backend/app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

try:
    from app.core.database import SessionLocal, engine, Base
    from app.models.models import User
    from app.core.security import get_password_hash
except ImportError as e:
    print(f"ERROR: Cannot import app modules: {e}")
    sys.exit(1)

# Generate a random 7-character password (letters + numbers)
chars = string.ascii_letters + string.digits
password = ''.join(random.choice(chars) for _ in range(7))

# Ensure tables are created
Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    # Check if any admin exists
    admin = db.query(User).filter(User.role == "admin").first()
    if not admin:
        hashed_password = get_password_hash(password)
        admin = User(username="admin", email="admin@panel.com", hashed_password=hashed_password, role="admin")
        db.add(admin)
        db.commit()
        print(f"SUCCESS|admin|{password}")
    else:
        print(f"EXISTS|{admin.username or admin.email}|[Existing Password]")
except Exception as e:
    print(f"ERROR: Database write failed: {e}")
finally:
    db.close()
