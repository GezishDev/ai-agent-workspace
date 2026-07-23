from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(default="postgresql+asyncpg://agent_workspace:change-me@localhost:5432/agent_workspace")
    jwt_secret_key: str = Field(default="change-this-secret-in-production", min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    cors_origins: list[str] = ["http://localhost:5173"]
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    groq_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()