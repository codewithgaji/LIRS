# all my settings come from backend/.env, pydantic-settings reads it for me

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ".env" is looked up from the folder I start the server in,
    # so uvicorn and alembic both have to be run from inside backend/
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "LIRS Correspondence Register Management System"
    api_v1_prefix: str = "/api/v1"

    # no defaults for these two on purpose, if .env is missing the app should fail loudly
    database_url: str
    jwt_secret_key: str

    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    # comes in as one comma separated string, the property below splits it into a list
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
