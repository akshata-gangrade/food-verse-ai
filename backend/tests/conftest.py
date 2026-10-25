import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import mongomock_motor
from app.main import create_app
from app.db.mongo import db_manager
from app.core.security import hash_password, create_access_token

# Force demo mode during tests
os.environ["DEMO_MODE"] = "true"
os.environ["GEMINI_API_KEY"] = ""

from app.core.config import get_settings
get_settings.cache_clear()
import app.services.ai.provider_factory as pf
pf._cached_provider = None


@pytest_asyncio.fixture(scope="session")
async def test_app():
    # Use mock db for tests
    mock_client = mongomock_motor.AsyncMongoMockClient()
    db_manager.client = mock_client
    db_manager.db = mock_client["test_aahaar_ai"]
    db_manager.is_in_memory = True
    await db_manager.init_db()

    app = create_app()
    yield app
    await db_manager.close()


@pytest_asyncio.fixture
async def client(test_app):
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_headers(client, test_app):
    """Provides valid Bearer auth headers for the seeded demo user."""
    token = create_access_token(subject="usr_demo_aahaar_01")
    return {"Authorization": f"Bearer {token}"}
