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
    # 局域网访问的正则表达式（匹配所有本地和局域网地址）
    CORS_ORIGIN_REGEX: str = r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$"
    SINGLE_USER_MODE: bool = True
    APP_NAME: str = "Personal Asset OS"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
