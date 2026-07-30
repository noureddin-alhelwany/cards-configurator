from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_initial_migration_creates_drafts_table(tmp_path, monkeypatch) -> None:
    db_path = tmp_path / "bootstrap.sqlite3"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")

    config = Config(str(Path("backend/alembic.ini").resolve()))
    config.set_main_option("script_location", str(Path("backend/migrations").resolve()))
    config.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")

    command.upgrade(config, "head")

    engine = create_engine(f"sqlite:///{db_path}")
    assert "drafts" in inspect(engine).get_table_names()
