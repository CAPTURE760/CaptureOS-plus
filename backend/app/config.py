from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://captureos:captureos@db:5432/captureos"
    DATABASE_URL_SYNC: str = "postgresql://captureos:captureos@db:5432/captureos"
    API_PREFIX: str = "/api"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:8001",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ]
    SINGLE_USER_MODE: bool = True
    APP_NAME: str = "Personal Asset OS"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
