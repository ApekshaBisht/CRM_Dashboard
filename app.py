"""
Cyient Foundation CRM Dashboard - Flask backend
================================================
A single-file Flask app exposing a JSON REST API for all 13 modules
plus a /api/dashboard endpoint that aggregates summary stats for the
Master Board.

Run: python app.py
"""
import os
from flask import Flask, jsonify, request, render_template, abort     # importing flask from libraries 
from database import get_db, close_db, init_db, rows_to_dicts, row_to_dict


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = Flask(__name__, instance_relative_config=True)
app.config["JSON_SORT_KEYS"] = False
app.teardown_appcontext(close_db)

with app.app_context():
    init_db(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def fetch_all(query, params=()):
    db = get_db()
    return rows_to_dicts(db.execute(query, params).fetchall())


def fetch_one(query, params=()):
    db = get_db()
    return row_to_dict(db.execute(query, params).fetchone())


def execute(query, params=()):
    db = get_db()
    cur = db.execute(query, params)
    db.commit()
    return cur           # executing the database


def json_body():
    """Get JSON body or empty dict. Handles missing Content-Type gracefully."""
    return request.get_json(silent=True) or {}


def build_crud(name, table, fields, *, search_fields=None, select_extra="", joins=""):
    """Register a standard set of CRUD endpoints under /api/<name>.

    fields        -> list of column names that can be inserted/updated
    search_fields -> columns that participate in a free-text ?q= search
    select_extra  -> extra SELECT columns (joined data) appended after "<table>.*"
    joins         -> raw SQL JOIN string appended after FROM clause
    """
    search_fields = search_fields or []
    base_select = f"SELECT {table}.*{(', ' + select_extra) if select_extra else ''} FROM {table} {joins}"

    @app.route(f"/api/{name}", methods=["GET"], endpoint=f"list_{name}")
    def list_items():
        q = request.args.get("q", "").strip()
        params = []
        where = ""
        if q and search_fields:
            # If a field already contains a dot, use it verbatim;
            # otherwise prefix with the base table so we don't get
            # ambiguous column errors after joins.
            def _qual(f):
                return f if "." in f else f"{table}.{f}"
            clauses = " OR ".join([f"{_qual(f)} LIKE ?" for f in search_fields])
            where = f"WHERE {clauses}"
            params = [f"%{q}%"] * len(search_fields)
        order = f" ORDER BY {table}.id DESC"
        return jsonify(fetch_all(base_select + " " + where + order, params))

    @app.route(f"/api/{name}/<int:item_id>", methods=["GET"], endpoint=f"get_{name}")
    def get_item(item_id):
        row = fetch_one(base_select + f" WHERE {table}.id = ?", (item_id,))
        if not row:
            abort(404, description=f"{name} not found")
        return jsonify(row)

    @app.route(f"/api/{name}", methods=["POST"], endpoint=f"create_{name}")
    def create_item():
        body = json_body()
        cols, vals = [], []
        for f in fields:
            if f in body:
                cols.append(f)
                vals.append(body[f])
        if not cols:
            return jsonify({"error": "no fields supplied"}), 400
        placeholders = ",".join(["?"] * len(cols))
        try:
            cur = execute(f"INSERT INTO {table} ({','.join(cols)}) VALUES ({placeholders})", vals)
        except Exception as e:
            return jsonify({"error": str(e)}), 400
        new_id = cur.lastrowid
        row = fetch_one(base_select + f" WHERE {table}.id = ?", (new_id,))
        return jsonify(row), 201

    @app.route(f"/api/{name}/<int:item_id>", methods=["PUT"], endpoint=f"update_{name}")
    def update_item(item_id):
        body = json_body()
        cols, vals = [], []
        for f in fields:
            if f in body:
                cols.append(f"{f} = ?")
                vals.append(body[f])
        if not cols:
            return jsonify({"error": "no fields supplied"}), 400
        vals.append(item_id)
        try:
            execute(f"UPDATE {table} SET {','.join(cols)} WHERE id = ?", vals)
        except Exception as e:
            return jsonify({"error": str(e)}), 400
        row = fetch_one(base_select + f" WHERE {table}.id = ?", (item_id,))
        if not row:
            abort(404, description=f"{name} not found")
        return jsonify(row)

    @app.route(f"/api/{name}/<int:item_id>", methods=["DELETE"], endpoint=f"delete_{name}")
    def delete_item(item_id):
        execute(f"DELETE FROM {table} WHERE id = ?", (item_id,))
        return jsonify({"deleted": True, "id": item_id})


# ---------------------------------------------------------------------------
# CRUD registrations for each module
# ---------------------------------------------------------------------------
build_crud(
    "administrators", "administrators",
    fields=["name", "email", "role", "permissions", "phone", "status"],
    search_fields=["name", "email", "role"],
)

build_crud(
    "projects", "projects",
    fields=["name", "description", "institution", "start_date", "end_date",
            "status", "progress", "budget"],
    search_fields=["name", "institution", "status"],
)

build_crud(
    "courses", "courses",
    fields=["name", "project_id", "duration_weeks", "objectives",
            "learning_outcomes", "target_group", "status"],
    search_fields=["courses.name", "target_group", "courses.status"],
    select_extra="projects.name AS project_name",
    joins="LEFT JOIN projects ON courses.project_id = projects.id",
)

build_crud(
    "modules", "modules",
    fields=["name", "course_id", "learning_goals", "sequence", "duration_hours"],
    search_fields=["modules.name", "learning_goals"],
    select_extra="courses.name AS course_name",
    joins="LEFT JOIN courses ON modules.course_id = courses.id",
)

build_crud(
    "chapters", "chapters",
    fields=["name", "module_id", "content_type", "sequence", "description"],
    search_fields=["chapters.name", "content_type"],
    select_extra="modules.name AS module_name",
    joins="LEFT JOIN modules ON chapters.module_id = modules.id",
)

build_crud(
    "skills", "skills",
    fields=["name", "description", "category", "max_grade"],
    search_fields=["name", "category"],
)

build_crud(
    "trainers", "trainers",
    fields=["name", "email", "phone", "specialization", "qualification",
            "experience_years", "status", "joined_date"],
    search_fields=["name", "email", "specialization", "status"],
)

build_crud(
    "students", "students",
    fields=["name", "email", "phone", "project_id", "course_id", "batch",
            "enrollment_date", "status", "gender", "institution"],
    search_fields=["students.name", "students.email", "batch", "institution"],
    select_extra="projects.name AS project_name, courses.name AS course_name",
    joins="LEFT JOIN projects ON students.project_id = projects.id "
          "LEFT JOIN courses ON students.course_id = courses.id",
)

build_crud(
    "chapter_assignments", "chapter_assignments",
    fields=["chapter_id", "trainer_id", "batch", "scheduled_date", "status", "notes"],
    search_fields=["batch", "chapter_assignments.status"],
    select_extra="chapters.name AS chapter_name, trainers.name AS trainer_name",
    joins="LEFT JOIN chapters ON chapter_assignments.chapter_id = chapters.id "
          "LEFT JOIN trainers ON chapter_assignments.trainer_id = trainers.id",
)

build_crud(
    "activities", "activities",
    fields=["name", "activity_type", "project_id", "activity_date",
            "description", "participants_count", "location"],
    search_fields=["activities.name", "activity_type", "location"],
    select_extra="projects.name AS project_name",
    joins="LEFT JOIN projects ON activities.project_id = projects.id",
)

build_crud(
    "student_attendance", "student_attendance",
    fields=["student_id", "course_id", "attendance_date", "session", "status", "remarks"],
    search_fields=["student_attendance.status", "session"],
    select_extra="students.name AS student_name, courses.name AS course_name",
    joins="LEFT JOIN students ON student_attendance.student_id = students.id "
          "LEFT JOIN courses ON student_attendance.course_id = courses.id",
)

build_crud(
    "trainer_attendance", "trainer_attendance",
    fields=["trainer_id", "attendance_date", "hours_taught", "status", "remarks"],
    search_fields=["trainer_attendance.status"],
    select_extra="trainers.name AS trainer_name",
    joins="LEFT JOIN trainers ON trainer_attendance.trainer_id = trainers.id",
)

build_crud(
    "student_skills", "student_skills",
    fields=["student_id", "skill_id", "grade", "skill_level", "evaluated_on", "remarks"],
    search_fields=["skill_level"],
    select_extra="students.name AS student_name, skills.name AS skill_name",
    joins="LEFT JOIN students ON student_skills.student_id = students.id "
          "LEFT JOIN skills ON student_skills.skill_id = skills.id",
)

build_crud(
    "volunteers", "volunteers",
    fields=["name", "email", "phone", "organization", "expertise",
            "area_of_interest", "availability", "activity_id",
            "hours_contributed", "joined_date", "status", "notes"],
    search_fields=["volunteers.name", "email", "organization", "expertise", "area_of_interest"],
    select_extra="activities.name AS activity_name",
    joins="LEFT JOIN activities ON volunteers.activity_id = activities.id",
)

build_crud(
    "internships", "internships",
    fields=["student_id", "company_name", "role", "start_date", "end_date", "status", "stipend"],
    search_fields=["company_name", "role", "internships.status"],
    select_extra="students.name AS student_name",
    joins="LEFT JOIN students ON internships.student_id = students.id",
)

build_crud(
    "feedbacks", "feedbacks",
    fields=["provider_name", "provider_role", "subject", "comments", "rating", "status"],
    search_fields=["provider_name", "provider_role", "subject", "status"],
)


# ---------------------------------------------------------------------------
# Master board / dashboard aggregates
# ---------------------------------------------------------------------------
@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    """Aggregate counters, project status breakdown and recent attendance trend."""
    db = get_db()

    counts = {
        "projects": db.execute("SELECT COUNT(*) FROM projects").fetchone()[0],
        "active_projects": db.execute("SELECT COUNT(*) FROM projects WHERE status='Active'").fetchone()[0],
        "courses": db.execute("SELECT COUNT(*) FROM courses").fetchone()[0],
        "modules": db.execute("SELECT COUNT(*) FROM modules").fetchone()[0],
        "chapters": db.execute("SELECT COUNT(*) FROM chapters").fetchone()[0],
        "students": db.execute("SELECT COUNT(*) FROM students").fetchone()[0],
        "active_students": db.execute("SELECT COUNT(*) FROM students WHERE status='Active'").fetchone()[0],
        "trainers": db.execute("SELECT COUNT(*) FROM trainers").fetchone()[0],
        "active_trainers": db.execute("SELECT COUNT(*) FROM trainers WHERE status='Active'").fetchone()[0],
        "administrators": db.execute("SELECT COUNT(*) FROM administrators").fetchone()[0],
        "skills": db.execute("SELECT COUNT(*) FROM skills").fetchone()[0],
        "activities": db.execute("SELECT COUNT(*) FROM activities").fetchone()[0],
        "chapter_assignments": db.execute("SELECT COUNT(*) FROM chapter_assignments").fetchone()[0],
        "volunteers": db.execute("SELECT COUNT(*) FROM volunteers").fetchone()[0],
        "active_volunteers": db.execute("SELECT COUNT(*) FROM volunteers WHERE status='Active'").fetchone()[0],
        "internships": db.execute("SELECT COUNT(*) FROM internships").fetchone()[0],
        "feedbacks": db.execute("SELECT COUNT(*) FROM feedbacks").fetchone()[0],
    }

    # ----- Project status breakdown -----
    project_status = rows_to_dicts(db.execute(
        "SELECT status, COUNT(*) AS count FROM projects GROUP BY status"
    ).fetchall())

    # ----- Top projects by progress -----
    top_projects = rows_to_dicts(db.execute(
        "SELECT id, name, status, progress FROM projects ORDER BY progress DESC LIMIT 5"
    ).fetchall())

    # ----- Attendance: present % per day (last 14 days) -----
    attendance_trend = rows_to_dicts(db.execute("""
        SELECT attendance_date,
               COUNT(*) AS total,
               SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) AS present_count
        FROM student_attendance
        GROUP BY attendance_date
        ORDER BY attendance_date DESC
        LIMIT 14
    """).fetchall())
    attendance_trend = list(reversed(attendance_trend))
    for r in attendance_trend:
        r["present_pct"] = round((r["present_count"] / r["total"]) * 100, 1) if r["total"] else 0

    # ----- Students by status -----
    students_by_status = rows_to_dicts(db.execute(
        "SELECT status, COUNT(*) AS count FROM students GROUP BY status"
    ).fetchall())

    # ----- Course-wise student count -----
    course_student_count = rows_to_dicts(db.execute("""
        SELECT c.name AS course_name, COUNT(s.id) AS student_count
        FROM courses c LEFT JOIN students s ON s.course_id = c.id
        GROUP BY c.id ORDER BY student_count DESC LIMIT 7
    """).fetchall())

    # ----- Recent activities -----
    recent_activities = rows_to_dicts(db.execute("""
        SELECT a.id, a.name, a.activity_type, a.activity_date, a.participants_count,
               p.name AS project_name
        FROM activities a LEFT JOIN projects p ON a.project_id = p.id
        ORDER BY date(a.activity_date) DESC LIMIT 6
    """).fetchall())

    return jsonify({
        "counts": counts,
        "project_status": project_status,
        "top_projects": top_projects,
        "attendance_trend": attendance_trend,
        "students_by_status": students_by_status,
        "course_student_count": course_student_count,
        "recent_activities": recent_activities,
    })


# ---------------------------------------------------------------------------
# Helper: lightweight option lists for dropdowns
# ---------------------------------------------------------------------------
@app.route("/api/options/<entity>", methods=["GET"])
def options(entity):
    """Return [{id, name}] pairs for selects. Used to populate FK dropdowns."""
    allowed = {
        "projects": "SELECT id, name FROM projects ORDER BY name",
        "courses": "SELECT id, name FROM courses ORDER BY name",
        "modules": "SELECT id, name FROM modules ORDER BY name",
        "chapters": "SELECT id, name FROM chapters ORDER BY name",
        "trainers": "SELECT id, name FROM trainers ORDER BY name",
        "students": "SELECT id, name FROM students ORDER BY name",
        "skills": "SELECT id, name FROM skills ORDER BY name",
        "volunteers": "SELECT id, name FROM volunteers ORDER BY name",
        "activities": "SELECT id, name FROM activities ORDER BY name",
    }
    if entity not in allowed:
        return jsonify({"error": "unknown entity"}), 400
    return jsonify(fetch_all(allowed[entity]))


# ---------------------------------------------------------------------------
# Frontend (single page) + error handlers
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login")
def login_selection():
    return render_template("role_selection.html")

@app.route("/login/<role>")
def login_form(role):
    if role not in ["student", "trainer", "superadmin"]:
        abort(404)
    display_names = {"student": "Student", "trainer": "Trainer", "superadmin": "Super Admin"}
    return render_template("login.html", role=role, role_name=display_names[role])

@app.route("/student")
def student_dashboard():
    return render_template("student.html")

@app.route("/trainer")
def trainer_dashboard():
    return render_template("trainer.html")

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({"error": "not found", "message": str(e.description)}), 404
    return render_template("index.html"), 200  # let SPA handle it


@app.errorhandler(500)
def server_error(e):
    if request.path.startswith("/api/"):
        return jsonify({"error": "server error", "message": str(e)}), 500
    return "Internal Server Error", 500


if __name__ == "__main__":
    # debug=True is fine for local development; turn off for production.
    app.run(host="127.0.0.1", port=5000, debug=True)

#app.py file is the main backend file that integrates the database to the frontend.