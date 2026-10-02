from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1 import api_router
from app.core.config import settings
from app.core.rate_limit import limiter

# Import the models package so every model is registered on Base.metadata
# and all string-based relationship() references resolve correctly.
import app.models  # noqa: F401

# Make sure the local avatars folder exists before we mount it — StaticFiles
# raises on startup if the directory is missing.
AVATARS_PATH = Path(settings.AVATARS_DIR)
AVATARS_PATH.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing to warm up yet (DB tables are managed via Alembic
    # migrations, not create_all — see alembic/README or the "Database
    # migrations" section of the project README).
    yield
    # Shutdown: place any cleanup here (closing pools, etc.)


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Serves files saved by the avatar upload endpoint, e.g.
# GET /avatars/<filename> -> app/../avatars/<filename> on disk.
app.mount(settings.AVATARS_URL_PREFIX, StaticFiles(directory=AVATARS_PATH), name="avatars")


@app.get("/", tags=["health"])
async def root():
    return {"app": settings.APP_NAME, "environment": settings.ENVIRONMENT, "status": "ok"}


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}