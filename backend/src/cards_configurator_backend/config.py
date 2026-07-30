from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Cards Configurator"
    environment: str = "development"
    database_url: str = "sqlite:///./data/cards-configurator.sqlite3"
    frontend_dist_dir: Path = Path("frontend/dist")
    registries_dir: Path = Path("registries")
    proof_assets_dir: Path = Path("proof-assets")
    data_dir: Path = Path("data")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
