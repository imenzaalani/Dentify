from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings

# Import the models package so every model is registered on Base.metadata
# and all string-based relationship() references resolve correctly.
import app.models  # noqa: F401


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["health"])
async def root():
    return {"app": settings.APP_NAME, "environment": settings.ENVIRONMENT, "status": "ok"}


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
