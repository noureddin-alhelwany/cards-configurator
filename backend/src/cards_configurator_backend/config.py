from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = "cards-configurator"
    environment: str = "development"
    database_url: str = "sqlite:///./data/cards-configurator.sqlite3"
    frontend_dist_dir: Path = PROJECT_ROOT / "frontend" / "dist"
    registries_dir: Path = PROJECT_ROOT / "registries"
    proof_assets_dir: Path = PROJECT_ROOT / "proof-assets"
    data_dir: Path = PROJECT_ROOT / "data"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
