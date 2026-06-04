-- Cyient Foundation CRM Dashboard - SQLite Schema
-- All tables use AUTOINCREMENT primary keys and ISO date strings.

PRAGMA foreign_keys = ON;

-- Drop tables (clean re-init)
DROP TABLE IF EXISTS trainer_attendance;
DROP TABLE IF EXISTS student_attendance;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS chapter_assignments;
DROP TABLE IF EXISTS student_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS trainers;
DROP TABLE IF EXISTS volunteers;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS administrators;
DROP TABLE IF EXISTS internships;
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS chapter_files;
DROP TABLE IF EXISTS student_chapter_status;

-- =====================================================
-- Administrators
-- =====================================================
CREATE TABLE administrators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Admin',     -- SuperAdmin / Admin / Manager / Viewer
    permissions TEXT DEFAULT 'read,write',  -- comma separated
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Active',  -- Active / Inactive
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- Projects
-- =====================================================
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    institution TEXT,
    start_date TEXT,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'Planned', -- Planned / Active / Completed / On Hold
    progress INTEGER NOT NULL DEFAULT 0,    -- 0 - 100
    budget REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- Courses
-- =====================================================
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    project_id INTEGER,
    duration_weeks INTEGER DEFAULT 4,
    objectives TEXT,
    learning_outcomes TEXT,
    target_group TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- =====================================================
-- Modules
-- =====================================================
CREATE TABLE modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    course_id INTEGER,
    learning_goals TEXT,
    sequence INTEGER DEFAULT 1,
    duration_hours INTEGER DEFAULT 8,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- =====================================================
-- Chapters
-- =====================================================
CREATE TABLE chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    module_id INTEGER,
    content_type TEXT DEFAULT 'Theory',  -- Theory / Practical / Skill / Assessment
    sequence INTEGER DEFAULT 1,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- =====================================================
-- Skills / Grades
-- =====================================================
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Technical',  -- Technical / Soft / Practical
    max_grade INTEGER DEFAULT 100,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE student_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    grade REAL DEFAULT 0,
    skill_level TEXT DEFAULT 'Beginner', -- Beginner / Intermediate / Advanced / Expert
    evaluated_on TEXT DEFAULT (datetime('now')),
    remarks TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- =====================================================
-- Trainers
-- =====================================================
CREATE TABLE trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    specialization TEXT,
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active',  -- Active / Inactive / On Leave
    joined_date TEXT DEFAULT (date('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- Volunteers
-- =====================================================
CREATE TABLE volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    organization TEXT,
    expertise TEXT,                                 -- area of expertise / skills offered
    area_of_interest TEXT DEFAULT 'Mentoring',      -- Mentoring / Teaching / Workshop / Content / Outreach / CSR / Event Support
    availability TEXT DEFAULT 'Flexible',           -- Weekdays / Weekends / Flexible / Project-based
    activity_id INTEGER,
    hours_contributed INTEGER DEFAULT 0,
    joined_date TEXT DEFAULT (date('now')),
    status TEXT NOT NULL DEFAULT 'Active',          -- Active / Inactive / On Break
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL
);

-- =====================================================
-- Students
-- =====================================================
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    project_id INTEGER,
    course_id INTEGER,
    batch TEXT DEFAULT 'B-2026',
    enrollment_date TEXT DEFAULT (date('now')),
    status TEXT NOT NULL DEFAULT 'Active',  -- Active / Inactive / Completed / Dropped
    gender TEXT,
    institution TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- =====================================================
-- Internships
-- =====================================================
CREATE TABLE internships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    company_name TEXT NOT NULL,
    role TEXT,
    start_date TEXT,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'Active', -- Active / Completed / Dropped
    stipend REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- =====================================================
-- Feedbacks
-- =====================================================
CREATE TABLE feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_name TEXT NOT NULL,
    provider_role TEXT DEFAULT 'Student', -- Student / Trainer / Volunteer / Admin
    subject TEXT,
    comments TEXT,
    rating INTEGER DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending / Reviewed / Addressed
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- Chapter Assignments (assign chapter to trainer for batch)
-- =====================================================
CREATE TABLE chapter_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    trainer_id INTEGER NOT NULL,
    batch TEXT NOT NULL,
    scheduled_date TEXT,
    status TEXT NOT NULL DEFAULT 'Scheduled', -- Scheduled / In Progress / Completed / Cancelled
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE
);

-- =====================================================
-- Activities (workshops, hackathons, classroom etc.)
-- =====================================================
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    activity_type TEXT DEFAULT 'Classroom',  -- Classroom / Practical / Workshop / Hackathon / CSR / Event
    project_id INTEGER,
    activity_date TEXT,
    description TEXT,
    participants_count INTEGER DEFAULT 0,
    location TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- =====================================================
-- Student Attendance
-- =====================================================
CREATE TABLE student_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER,
    attendance_date TEXT NOT NULL,
    session TEXT DEFAULT 'Morning',          -- Morning / Afternoon / Full Day
    status TEXT NOT NULL DEFAULT 'Present',  -- Present / Absent / Late / Excused
    remarks TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- =====================================================
-- Trainer Attendance
-- =====================================================
CREATE TABLE trainer_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    attendance_date TEXT NOT NULL,
    hours_taught REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Present',  -- Present / Absent / Half-day / On Leave
    remarks TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE
);

-- =====================================================
-- Users (authentication for all portals)
--   role: student / trainer / superadmin
--   ref_id: id in students / trainers / administrators table
-- =====================================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,          -- the login email
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,                     -- student / trainer / superadmin
    ref_id INTEGER,                         -- id in the role's own table
    display_name TEXT,
    must_change_password INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- Tickets (raised by students / trainers / admins)
-- =====================================================
CREATE TABLE tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raised_by_user_id INTEGER,
    raised_by_name TEXT,
    raised_by_role TEXT,                    -- student / trainer / superadmin
    subject TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',        -- General / Technical / Content / Attendance / Other
    priority TEXT NOT NULL DEFAULT 'Medium',-- Low / Medium / High / Urgent
    status TEXT NOT NULL DEFAULT 'Open',    -- Open / In Progress / Resolved / Closed
    response TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
);

-- =====================================================
-- Certificates (issued to students on course completion)
-- =====================================================
CREATE TABLE certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER,
    certificate_no TEXT NOT NULL,
    grade TEXT DEFAULT 'A',
    issued_date TEXT DEFAULT (date('now')),
    status TEXT NOT NULL DEFAULT 'Issued',  -- Issued / Pending
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- =====================================================
-- Chapter files (PDFs / videos uploaded for a chapter)
--   actual bytes live on disk in instance/uploads/, this is metadata
-- =====================================================
CREATE TABLE chapter_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    stored_name TEXT NOT NULL,              -- unique name on disk
    original_name TEXT NOT NULL,            -- name the user uploaded
    file_type TEXT,                         -- pdf / video / other
    file_size INTEGER DEFAULT 0,            -- bytes
    uploaded_by_role TEXT,
    uploaded_by_name TEXT,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- =====================================================
-- Student chapter progress / status
-- =====================================================
CREATE TABLE student_chapter_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Not Started', -- Not Started / In Progress / Completed
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(student_id, chapter_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX idx_students_project ON students(project_id);
CREATE INDEX idx_students_course ON students(course_id);
CREATE INDEX idx_courses_project ON courses(project_id);
CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_chapters_module ON chapters(module_id);
CREATE INDEX idx_sa_date ON student_attendance(attendance_date);
CREATE INDEX idx_ta_date ON trainer_attendance(attendance_date);
CREATE INDEX idx_volunteers_project ON volunteers(activity_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_certs_student ON certificates(student_id);
CREATE INDEX idx_chfiles_chapter ON chapter_files(chapter_id);
CREATE INDEX idx_scs_student ON student_chapter_status(student_id);
