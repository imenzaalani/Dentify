from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Dentify API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    DATABASE_URL: str
    DATABASE_URL_SYNC: str

    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    UPLOAD_DIR: str = "/code/uploads"

    # Local folder (relative to the backend project root, i.e. next to the
    # `app/` package) where receptionist/dentist profile photos are saved.
    # Served back out at AVATARS_URL_PREFIX via a StaticFiles mount in main.py.
    AVATARS_DIR: str = "avatars"
    AVATARS_URL_PREFIX: str = "/avatars"
    AVATAR_MAX_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB

    # Clinical/administrative documents (X-rays, consent forms, invoices,
    # lab reports). Unlike avatars, this folder is never mounted as static
    # files — it's only reachable through the authenticated
    # /documents/{id}/file endpoint, since these are patient records.
    DOCUMENTS_DIR: str = "uploads/documents"
    DOCUMENT_MAX_SIZE_BYTES: int = 20 * 1024 * 1024  # 20 MB

    FRONTEND_URL: str = "http://localhost:3000"
    GMAIL_ADDRESS: str | None = None
    GMAIL_APP_PASSWORD: str | None = None

    SEED_OWNER_EMAIL: str
    SEED_OWNER_PASSWORD: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()