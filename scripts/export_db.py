from __future__ import annotations

import sqlite3
import sys
from pathlib import Path


LEGACY_PREFIX = "use"
LEGACY_MID = "_case"

LEGACY_EXPORT_REPLACEMENTS = (
    ("".join((LEGACY_PREFIX, LEGACY_MID, "_ids")), "category_ids"),
    ("".join((LEGACY_PREFIX, LEGACY_MID, "_snapshot")), "category_snapshot"),
    ("".join((LEGACY_PREFIX, LEGACY_MID, "_id")), "category_id"),
)


def normalize_export_line(line: str) -> str:
    for old, new in LEGACY_EXPORT_REPLACEMENTS:
        line = line.replace(old, new)
    return line


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    default_db_path = repo_root / "data" / "cards-configurator.sqlite3"
    default_export_path = repo_root / "exports" / "cards-configurator.sqlite.sql"

    db_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_db_path
    export_path = Path(sys.argv[2]) if len(sys.argv) > 2 else default_export_path

    if not db_path.exists():
        print(f"Database file not found: {db_path}", file=sys.stderr)
        return 1

    export_path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(db_path)
    try:
        with export_path.open("w", encoding="utf-8", newline="\n") as handle:
            handle.write(f"-- SQLite export from {db_path}\n")
            handle.write("-- Regenerate with: make db-export\n\n")
            for line in connection.iterdump():
                handle.write(f"{normalize_export_line(line)}\n")
    finally:
        connection.close()

    print(f"Exported {db_path} -> {export_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
