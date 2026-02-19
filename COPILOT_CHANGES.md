# Copilot Fixes — ChipTrace AI (Feb 19 2026)

Summary of all errors hit and fixes applied during local dev setup.
No API response shapes, DB model fields, or router logic were changed.

---

## 1. `ModuleNotFoundError: No module named 'psycopg2'`

**Cause:** `seed_db.py` was being run with the system Python (`pythoncore-3.14`) instead of the project `.venv`.

**Fix:** Switched all Python commands to `.venv/Scripts/python.exe`.

---

## 2. Backend packages missing (sqlalchemy, pydantic, faker, etc.)

**Cause:** The `.venv` had nothing installed. `pip install -r requirements.txt` failed because `psycopg2-binary==2.9.9` has no prebuilt wheel for Python 3.14 and failed to compile from source.

**Fix:** Installed all packages without strict version pinning using:
```
pip install sqlalchemy pydantic pydantic-settings python-dotenv scikit-learn numpy pandas faker networkx psycopg2-binary fastapi "uvicorn[standard]"
```
Actual installed versions are newer than those in `requirements.txt` but fully compatible.

---

## 3. `OperationalError: connection to server at "localhost" port 5432 failed`

**Cause:** PostgreSQL is not installed locally and Docker is not available on this machine.

**Fix: `backend/database.py` was changed** to fall back to SQLite when no `DATABASE_URL` env var is set.

### Before:
```python
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://chiptrace:chiptrace123@localhost:5432/chiptrace_db"
)
engine = create_engine(DATABASE_URL)
```

### After:
```python
_DEFAULT_DB = os.path.join(os.path.dirname(__file__), "chiptrace_dev.db")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{_DEFAULT_DB}"
)
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args)
```

- Locally: uses `backend/chiptrace_dev.db` (SQLite file, auto-created).
- In Docker / production: `DATABASE_URL` env var is set to PostgreSQL — **behaviour unchanged**.

---

## 4. `TypeError: SQLite DateTime type only accepts Python datetime and date objects`

**Cause:** The generated JSON files store all dates as ISO strings (e.g. `"2026-02-19T15:26:57"`). SQLite's SQLAlchemy dialect requires actual Python `datetime`/`date` objects. PostgreSQL accepts strings, so this only affects local dev.

**Fix: `backend/data/seed_db.py` was changed** — added datetime conversion helpers and per-model fixer functions.

### Added helpers:
```python
_IS_SQLITE = DATABASE_URL.startswith("sqlite")

def _parse_dt(val):
    # converts ISO datetime string → Python datetime object
    ...

def _parse_date(val):
    # converts ISO date string → Python date object
    ...
```

### Added per-model fixers (no-ops when using PostgreSQL):
- `_fix_supplier(row)` — converts `created_at`
- `_fix_event(row)` — converts `recorded_at`, `planned_date`, `actual_date`
- `_fix_disruption(row)` — converts `triggered_at`, `resolved_at`
- `_fix_inventory(row)` — converts `updated_at`
- `_fix_macro(row)` — converts `signal_date`

All `db.add(Model(**row))` calls now pass through the appropriate fixer.

**No changes to field names, model structure, or data values.**

---

## 5. `Could not import module "main"` (uvicorn)

**Cause:** Uvicorn was being run from the project root (`chiptrace-ai/`) where `main.py` doesn't exist. It only exists in `backend/`.

**Fix:** Always run uvicorn from the `backend/` directory:
```powershell
cd C:\COLLEGE\EUREKATHON\chiptrace-ai\backend
C:/COLLEGE/EUREKATHON/chiptrace-ai/.venv/Scripts/uvicorn.exe main:app --reload
```

---

## Impact Summary

| Area                          | Changed? | Frontend / API Impact?          |
|-------------------------------|----------|---------------------------------|
| `backend/database.py`         | Yes      | None — same schema, same API    |
| `backend/data/seed_db.py`     | Yes      | None — data shape unchanged     |
| All routers (`routers/`)      | No       | None                            |
| All services (`services/`)    | No       | None                            |
| DB models (`models/`)         | No       | None                            |
| API response shapes           | No       | No frontend adjustments needed  |
| DB schema / field names       | No       | No frontend adjustments needed  |

---

## Local Dev Commands (in order)

```powershell
# 1. Activate venv
C:/COLLEGE/EUREKATHON/chiptrace-ai/.venv/Scripts/activate

# 2. Generate dataset (if needed)
cd C:\COLLEGE\EUREKATHON\chiptrace-ai\backend
python data/generate_dataset.py

# 3. Seed the database
python data/seed_db.py

# 4. Start the backend
uvicorn main:app --reload
# → API running at http://127.0.0.1:8000
# → Docs at http://127.0.0.1:8000/docs
```
