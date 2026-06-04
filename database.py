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


def init_db(app):
    """Create tables and seed if DB doesn't exist (or RESEED env var set)."""
    os.makedirs(app.instance_path, exist_ok=True)
    db_path = os.path.join(app.instance_path, DB_FILENAME)
    is_new = not os.path.exists(db_path)
    force_reseed = os.environ.get("RESEED") == "1"

    if not is_new and not force_reseed:
        print(f"[init_db] Database already exists at {db_path} (skipping schema/seed).")
        return

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
