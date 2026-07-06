from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Dentify API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    DATABASE_URL: str = "postgresql+asyncpg://dentify:dentify@db:5432/dentify"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://dentify:dentify@db:5432/dentify"

    REDIS_URL: str = "redis://redis:6379/0"

    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    UPLOAD_DIR: str = "/code/uploads"

    SEED_OWNER_EMAIL: str = "owner@dentify.tn"
    SEED_OWNER_PASSWORD: str = "ChangeMe123!"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
