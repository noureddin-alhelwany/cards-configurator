from __future__ import annotations

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from .config import get_settings

Base = declarative_base()


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    settings = get_settings()
    connect_args = {}
    if settings.database_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(settings.database_url, future=True, connect_args=connect_args)


def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, class_=Session)


def _column_names(connection: Connection, table_name: str) -> set[str]:
    rows = connection.execute(text(f"PRAGMA table_info({table_name})")).all()
    return {str(row[1]) for row in rows}


def ensure_database_compatibility(engine: Engine) -> None:
    if not engine.url.get_backend_name().startswith("sqlite"):
        return

    with engine.begin() as connection:
        tables = {
            row[0]
            for row in connection.execute(
                text("SELECT name FROM sqlite_master WHERE type='table'")
            ).all()
        }
        if "orders" not in tables:
            return

        columns = _column_names(connection, "orders")
        if "category_id" not in columns and "use_case_id" in columns:
            connection.execute(text("ALTER TABLE orders ADD COLUMN category_id VARCHAR(255)"))
            connection.execute(
                text(
                    "UPDATE orders SET category_id = use_case_id WHERE category_id IS NULL AND use_case_id IS NOT NULL"
                )
            )
            columns.add("category_id")

        if "category_snapshot" not in columns and "use_case_snapshot" in columns:
            connection.execute(text("ALTER TABLE orders ADD COLUMN category_snapshot JSON"))
            connection.execute(
                text(
                    "UPDATE orders SET category_snapshot = use_case_snapshot WHERE category_snapshot IS NULL AND use_case_snapshot IS NOT NULL"
                )
            )

        if "design_id" not in columns and "variant_id" in columns:
            connection.execute(text("ALTER TABLE orders ADD COLUMN design_id VARCHAR(255)"))
            connection.execute(
                text(
                    "UPDATE orders SET design_id = variant_id WHERE design_id IS NULL AND variant_id IS NOT NULL"
                )
            )


def get_db() -> Iterator[Session]:
    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()
