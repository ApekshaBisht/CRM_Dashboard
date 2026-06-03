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

-- Indexes for common queries
CREATE INDEX idx_students_project ON students(project_id);
CREATE INDEX idx_students_course ON students(course_id);
CREATE INDEX idx_courses_project ON courses(project_id);
CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_chapters_module ON chapters(module_id);
CREATE INDEX idx_sa_date ON student_attendance(attendance_date);
CREATE INDEX idx_ta_date ON trainer_attendance(attendance_date);
CREATE INDEX idx_volunteers_project ON volunteers(activity_id);
