import os
import sys

# Ensure backend root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Explicitly declare isolated test environment
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///./test_darukaa.db"
os.environ["JWT_SECRET_KEY"] = "test_secret_key_minimum_32_characters_long_12345"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"

from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.utils.security import create_access_token, hash_password

TEST_DB_URL = "sqlite:///./test_darukaa.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_darukaa.db"):
        try:
            os.remove("./test_darukaa.db")
        except Exception:
            pass


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_admin_user(db_session):
    user = db_session.query(User).filter(User.email == "test_admin@darukaa.earth").first()
    if not user:
        user = User(
            name="Test Admin",
            email="test_admin@darukaa.earth",
            password_hash=hash_password("AdminPass123!"),
            role=UserRole.ADMIN,
        )
        db_session.add(user)
        db_session.flush()
    return user


@pytest.fixture
def test_regular_user(db_session):
    user = db_session.query(User).filter(User.email == "test_user@darukaa.earth").first()
    if not user:
        user = User(
            name="Test Normal User",
            email="test_user@darukaa.earth",
            password_hash=hash_password("UserPass123!"),
            role=UserRole.USER,
        )
        db_session.add(user)
        db_session.flush()
    return user


@pytest.fixture
def admin_token_headers(test_admin_user):
    token = create_access_token({
        "sub": str(test_admin_user.id),
        "email": test_admin_user.email,
        "role": test_admin_user.role.value,
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_token_headers(test_regular_user):
    token = create_access_token({
        "sub": str(test_regular_user.id),
        "email": test_regular_user.email,
        "role": test_regular_user.role.value,
    })
    return {"Authorization": f"Bearer {token}"}
