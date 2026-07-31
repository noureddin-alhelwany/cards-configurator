from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_initial_migration_creates_core_tables(tmp_path, monkeypatch) -> None:
    db_path = tmp_path / "bootstrap.sqlite3"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")

    config = Config(str(Path("backend/alembic.ini").resolve()))
    config.set_main_option("script_location", str(Path("backend/migrations").resolve()))
    config.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")

    command.upgrade(config, "head")

    engine = create_engine(f"sqlite:///{db_path}")
    tables = inspect(engine).get_table_names()
    assert "drafts" in tables
    assert "orders" in tables
    assert "order_assets" in tables
    assert "render_jobs" in tables
