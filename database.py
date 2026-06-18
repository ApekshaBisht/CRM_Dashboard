"""SQLite database helper for the CRM dashboard."""
import os
import sqlite3
from flask import g, current_app

DB_FILENAME = "crm.db"


def get_db_path():
    """Path to the SQLite file inside Flask's instance folder."""
    return os.path.join(current_app.instance_path, DB_FILENAME)


def get_db():
    """Return a per-request connection (row_factory enabled)."""
    if "db" not in g:
        g.db = sqlite3.connect(get_db_path(), detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def _table_columns(conn, table):
    """Return the set of column names currently on a table."""
    try:
        rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
        return {r[1] for r in rows}
    except sqlite3.Error:
        return set()


def migrate_db(app):
    """Non-destructive migration: add any missing columns to existing tables.

    Safe to run on every startup. SQLite's ALTER TABLE ADD COLUMN keeps all
    existing rows intact, so users never lose data when the schema grows.
    """
    db_path = os.path.join(app.instance_path, DB_FILENAME)
    if not os.path.exists(db_path):
        return  # fresh DB will be created from the full schema

    # Expected extra columns that may be missing on older databases.
    # Format: table -> list of (column_name, column_definition)
    expected = {
        "internships": [
            ("payment_type", "TEXT DEFAULT 'Unpaid'"),
            ("visitor_card_id", "TEXT"),
            ("reporting_manager", "TEXT"),
            ("offer_letter_file", "TEXT"),
            ("internship_report_file", "TEXT"),
            ("certificate_file", "TEXT"),
            ("lor_file", "TEXT"),
            ("stipend", "REAL DEFAULT 0"),
        ],
        "users": [
            ("must_change_password", "INTEGER DEFAULT 0"),
            ("display_name", "TEXT"),
        ],
        "tickets": [
            ("response", "TEXT"),
            ("updated_at", "TEXT"),
        ],
    }

    conn = sqlite3.connect(db_path)
    added = []
    try:
        for table, cols in expected.items():
            existing = _table_columns(conn, table)
            if not existing:
                continue  # table itself doesn't exist on this DB; skip
            for col_name, col_def in cols:
                if col_name not in existing:
                    try:
                        conn.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}")
                        added.append(f"{table}.{col_name}")
                    except sqlite3.Error as e:
                        print(f"[migrate_db] could not add {table}.{col_name}: {e}")
        conn.commit()
    finally:
        conn.close()

    if added:
        print(f"[migrate_db] Added missing columns: {', '.join(added)}")


def init_db(app):
    """Create tables and seed if DB doesn't exist (or RESEED env var set)."""
    os.makedirs(app.instance_path, exist_ok=True)
    db_path = os.path.join(app.instance_path, DB_FILENAME)
    is_new = not os.path.exists(db_path)
    force_reseed = os.environ.get("RESEED") == "1"

    if not is_new and not force_reseed:
        # Existing DB: don't wipe it, but patch in any columns added since it
        # was created (e.g. the internship document/detail columns).
        migrate_db(app)
        print(f"[init_db] Database already exists at {db_path} (migrated, kept data).")
        return

    if force_reseed and os.path.exists(db_path):
        # Rebuild from a clean file so DROP/CREATE in schema.sql cannot trip
        # over foreign-key dependencies from the existing database contents.
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()

    from seed_data import seed
    seed(conn)
    conn.commit()
    conn.close()
    print(f"[init_db] Database initialised at {db_path} and seeded.")


def rows_to_dicts(rows):
    """Convert sqlite3.Row list to list of dicts."""
    return [dict(r) for r in rows]


def row_to_dict(row):
    return dict(row) if row else None

#added notification bell icon in superadmin portal.