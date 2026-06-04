"""Seed sample data for the CRM dashboard."""
from datetime import datetime, timedelta
import random


def seed(conn):
    cur = conn.cursor()

    # -------- Administrators --------
    admins = [
        ("Pavan Kumar", "pavan.kumar@cyientfoundation.org", "SuperAdmin", "read,write,delete,admin", "+91 9963200231", "Active"),
        ("Priya Sharma", "priya.sharma@cyientfoundation.org", "Admin", "read,write", "+91 9000000002", "Active"),
        ("Vikram Singh", "vikram.singh@cyientfoundation.org", "Manager", "read,write", "+91 9000000003", "Active"),
        ("Sunita Rao", "sunita.rao@cyientfoundation.org", "Viewer", "read", "+91 9000000004", "Active"),
    ]
    cur.executemany(
        "INSERT INTO administrators (name,email,role,permissions,phone,status) VALUES (?,?,?,?,?,?)",
        admins,
    )

    # -------- Projects --------
    projects = [
        ("Skill India - Telangana", "Digital literacy and employability programme across rural Telangana.",
         "Cyient Foundation", "2026-01-15", "2026-12-30", "Active", 62, 5000000),
        ("Women in STEM", "Promoting women participation in STEM fields through workshops and mentoring.",
         "Cyient Foundation x KL University", "2026-02-01", "2026-11-30", "Active", 45, 3200000),
        ("Industrial IoT Training", "IoT training programme for ITI students.",
         "Cyient Foundation", "2026-03-10", "2026-10-30", "Active", 30, 2500000),
        ("Rural Coding Bootcamp", "Python and web development bootcamp for rural youth.",
         "Cyient Foundation x Govt Schools", "2025-08-01", "2026-03-31", "Completed", 100, 1800000),
        ("AI for Educators", "AI awareness and tools training for school educators.",
         "Cyient Foundation", "2026-04-01", "2026-09-30", "Planned", 5, 1500000),
    ]
    cur.executemany(
        "INSERT INTO projects (name,description,institution,start_date,end_date,status,progress,budget) VALUES (?,?,?,?,?,?,?,?)",
        projects,
    )

    # -------- Courses --------
    courses = [
        ("Digital Literacy Foundations", 1, 8, "Build comfort with computers, internet and basic productivity tools.",
         "Use Office tools, browse safely, communicate digitally.", "Rural youth (18-25)", "Active"),
        ("Employability & Soft Skills", 1, 6, "Develop communication, teamwork and interview skills.",
         "Crack entry-level interviews, write resumes, communicate clearly.", "Rural youth (18-25)", "Active"),
        ("Python for STEM", 2, 12, "Python programming foundations for women in STEM.",
         "Write Python scripts, automate tasks, basic data analysis.", "Women undergraduates", "Active"),
        ("Robotics Foundations", 2, 10, "Arduino, sensors, robotic kits.",
         "Build small robots, understand sensors and actuators.", "Women undergraduates", "Active"),
        ("IoT with Arduino", 3, 8, "Hands-on IoT prototypes using Arduino and ESP32.",
         "Build 3 IoT prototypes, understand protocols.", "ITI students", "Active"),
        ("Web Development Basics", 4, 10, "HTML / CSS / JavaScript foundations.",
         "Build static and interactive websites.", "Rural youth (18-25)", "Completed"),
        ("AI Tools for Teachers", 5, 4, "Practical AI tools for lesson planning and admin.",
         "Use AI for lesson plans and content.", "School educators", "Planned"),
    ]
    cur.executemany(
        "INSERT INTO courses (name,project_id,duration_weeks,objectives,learning_outcomes,target_group,status) VALUES (?,?,?,?,?,?,?)",
        courses,
    )

    # -------- Modules --------
    modules = [
        # Course 1 - Digital Literacy
        ("Computer Basics", 1, "Understand hardware, OS basics, files & folders.", 1, 8),
        ("Internet & Email", 1, "Browse safely, set up email, use search engines.", 2, 6),
        ("Office Productivity", 1, "Word, Excel, basic PowerPoint.", 3, 10),
        # Course 2 - Soft Skills
        ("Communication Skills", 2, "Verbal, written and digital communication.", 1, 6),
        ("Interview Preparation", 2, "Resume, mock interviews, group discussions.", 2, 6),
        # Course 3 - Python
        ("Python Fundamentals", 3, "Variables, data types, control flow.", 1, 12),
        ("Functions & Modules", 3, "Code organisation and reuse.", 2, 8),
        ("Data with Pandas", 3, "Read, clean and analyse tabular data.", 3, 10),
        # Course 5 - IoT
        ("Arduino Basics", 5, "Setup, sketches, digital and analog IO.", 1, 8),
        ("Sensors & Actuators", 5, "Working with common sensors and motors.", 2, 8),
        ("IoT Cloud", 5, "Connect device to cloud, build a dashboard.", 3, 6),
    ]
    cur.executemany(
        "INSERT INTO modules (name,course_id,learning_goals,sequence,duration_hours) VALUES (?,?,?,?,?)",
        modules,
    )

    # -------- Chapters --------
    chapters = [
        # Module 1 - Computer Basics
        ("Introduction to Computers", 1, "Theory", 1, "What is a computer, components, types."),
        ("Operating System Basics", 1, "Theory", 2, "Windows / Linux essentials."),
        ("Files and Folders", 1, "Practical", 3, "Create, move, copy, search."),
        # Module 2 - Internet & Email
        ("Browsing the Web", 2, "Practical", 1, "Browsers, tabs, bookmarks, downloads."),
        ("Setting up Email", 2, "Practical", 2, "Create Gmail, attachments, drafts."),
        # Module 3 - Office
        ("Word Processing", 3, "Practical", 1, "Documents, formatting, tables."),
        ("Spreadsheets", 3, "Practical", 2, "Cells, formulas, charts."),
        # Module 6 - Python Fundamentals
        ("Hello Python", 6, "Practical", 1, "Install, REPL, first script."),
        ("Variables & Types", 6, "Theory", 2, "int, float, str, list, dict."),
        ("Control Flow", 6, "Practical", 3, "if, for, while."),
        # Module 7 - Functions
        ("Functions", 7, "Practical", 1, "def, args, return."),
        ("Modules & Imports", 7, "Practical", 2, "Standard library, pip."),
        # Module 9 - Arduino
        ("Arduino IDE", 9, "Practical", 1, "Setup, sketches, board selection."),
        ("Digital I/O", 9, "Practical", 2, "LED blink, buttons, debouncing."),
        ("Analog I/O", 9, "Practical", 3, "PWM, analog read."),
    ]
    cur.executemany(
        "INSERT INTO chapters (name,module_id,content_type,sequence,description) VALUES (?,?,?,?,?)",
        chapters,
    )

    # -------- Skills --------
    skills = [
        ("Python Programming", "Writing Python scripts and small applications.", "Technical", 100),
        ("HTML/CSS", "Building static web pages.", "Technical", 100),
        ("Communication", "Spoken and written communication.", "Soft", 100),
        ("Teamwork", "Working effectively in a team.", "Soft", 100),
        ("Problem Solving", "Breaking down and solving problems.", "Soft", 100),
        ("Arduino Prototyping", "Building Arduino-based prototypes.", "Practical", 100),
        ("MS Excel", "Data entry, formulas, basic analysis.", "Technical", 100),
        ("Resume Building", "Crafting a professional resume.", "Soft", 100),
    ]
    cur.executemany(
        "INSERT INTO skills (name,description,category,max_grade) VALUES (?,?,?,?)",
        skills,
    )

    # -------- Trainers --------
    trainers = [
        ("Dr. Anil Reddy", "anil.reddy@cyient.org", "+91 9111111111", "Python, Data Science", "PhD Computer Science", 12, "Active", "2024-06-01"),
        ("Meena Iyer", "meena.iyer@cyient.org", "+91 9111111112", "Communication, Soft Skills", "MA English, TESOL", 8, "Active", "2024-07-15"),
        ("Sanjay Patel", "sanjay.patel@cyient.org", "+91 9111111113", "Electronics, IoT, Arduino", "M.Tech Electronics", 10, "Active", "2024-05-20"),
        ("Lakshmi Narayanan", "lakshmi.n@cyient.org", "+91 9111111114", "MS Office, Digital Literacy", "MCA", 6, "Active", "2025-01-10"),
        ("Rohit Verma", "rohit.verma@cyient.org", "+91 9111111115", "Web Development, JavaScript", "B.Tech IT", 5, "On Leave", "2025-03-05"),
        ("Kavya Krishnan", "kavya.k@cyient.org", "+91 9111111116", "AI, Machine Learning", "M.Tech AI", 7, "Active", "2025-02-12"),
    ]
    cur.executemany(
        "INSERT INTO trainers (name,email,phone,specialization,qualification,experience_years,status,joined_date) VALUES (?,?,?,?,?,?,?,?)",
        trainers,
    )

    # -------- Students --------
    first_names = ["Aarav","Aditi","Arjun","Ananya","Bhavya","Chetan","Divya","Esha","Farhan","Gauri",
                   "Harsh","Ishaan","Jaya","Kiran","Lavanya","Manoj","Neha","Omkar","Pooja","Quasim",
                   "Rahul","Sneha","Tanvi","Uday","Vidya","Yash","Zara","Aryan","Bindu","Chirag"]
    last_names = ["Reddy","Sharma","Patel","Kumar","Singh","Rao","Naidu","Iyer","Krishnan","Joshi",
                  "Mehta","Das","Gupta","Bose","Pillai","Menon","Chowdhury","Bhat","Shetty","Nair"]
    institutions = ["Govt ITI Hyderabad", "KL University", "Govt High School Warangal",
                    "Polytechnic Nizamabad", "Govt ITI Karimnagar", "Anurag University"]

    random.seed(42)
    students = []
    for i in range(60):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"student{i+1:03d}@learner.cyient.org"
        phone = f"+91 9{random.randint(100000000, 999999999)}"
        project_id = random.choice([1, 1, 1, 2, 2, 3, 4])
        # pick a course that belongs to the same project (best-effort)
        course_id = {1: random.choice([1, 2]), 2: random.choice([3, 4]),
                     3: 5, 4: 6, 5: 7}.get(project_id, 1)
        batch = f"B-{2026}-{random.choice(['A','B','C'])}"
        enrollment_date = (datetime(2026, 1, 1) + timedelta(days=random.randint(0, 90))).date().isoformat()
        status = random.choices(["Active","Active","Active","Completed","Inactive"], k=1)[0]
        gender = random.choice(["Male","Female","Female","Male"])
        institution = random.choice(institutions)
        students.append((name, email, phone, project_id, course_id, batch, enrollment_date, status, gender, institution))

    cur.executemany(
        "INSERT INTO students (name,email,phone,project_id,course_id,batch,enrollment_date,status,gender,institution) VALUES (?,?,?,?,?,?,?,?,?,?)",
        students,
    )

    # -------- student_skills (random grades for some students) --------
    student_skill_rows = []
    for sid in range(1, 61):
        # each student gets 2-4 skill evaluations
        for skill_id in random.sample(range(1, 9), k=random.randint(2, 4)):
            grade = random.randint(40, 98)
            level = "Beginner" if grade < 55 else "Intermediate" if grade < 75 else "Advanced" if grade < 90 else "Expert"
            evaluated_on = (datetime(2026, 2, 1) + timedelta(days=random.randint(0, 80))).date().isoformat()
            student_skill_rows.append((sid, skill_id, grade, level, evaluated_on, ""))
    cur.executemany(
        "INSERT INTO student_skills (student_id,skill_id,grade,skill_level,evaluated_on,remarks) VALUES (?,?,?,?,?,?)",
        student_skill_rows,
    )

    # -------- Chapter Assignments --------
    chapter_assignments = []
    chapter_ids = list(range(1, 16))
    trainer_ids = list(range(1, 7))
    batches = ["B-2026-A", "B-2026-B", "B-2026-C"]
    for ch in chapter_ids:
        for b in random.sample(batches, k=random.randint(1, 2)):
            trainer = random.choice(trainer_ids)
            sched = (datetime(2026, 3, 1) + timedelta(days=random.randint(0, 60))).date().isoformat()
            status = random.choices(["Scheduled","In Progress","Completed"], k=1)[0]
            chapter_assignments.append((ch, trainer, b, sched, status, ""))
    cur.executemany(
        "INSERT INTO chapter_assignments (chapter_id,trainer_id,batch,scheduled_date,status,notes) VALUES (?,?,?,?,?,?)",
        chapter_assignments,
    )

    # -------- Activities --------
    activities = [
        ("Inaugural Workshop Hyderabad", "Workshop", 1, "2026-02-05", "Programme launch workshop.", 80, "Hyderabad"),
        ("Hackathon: SmartCity", "Hackathon", 2, "2026-04-10", "24hr SmartCity solutions hackathon.", 60, "KL University Hyderabad"),
        ("IoT Demo Day", "Practical", 3, "2026-05-12", "Students showcase IoT prototypes.", 45, "Cyient Madhapur"),
        ("Resume Building Workshop", "Workshop", 1, "2026-03-20", "Resume + LinkedIn workshop.", 70, "Online"),
        ("Women in Tech Panel", "Event", 2, "2026-03-08", "Industry panel for International Women's Day.", 120, "Cyient HQ"),
        ("CSR Tree Plantation", "CSR", 1, "2026-06-05", "World Environment Day plantation drive.", 50, "Outskirts of Warangal"),
        ("AI Awareness Seminar", "Workshop", 5, "2026-04-15", "Introductory AI seminar for educators.", 40, "Online"),
        ("Mid-term Assessment", "Classroom", 1, "2026-04-22", "Mid-programme student assessment.", 90, "Multiple centres"),
    ]
    cur.executemany(
        "INSERT INTO activities (name,activity_type,project_id,activity_date,description,participants_count,location) VALUES (?,?,?,?,?,?,?)",
        activities,
    )

    # -------- Student Attendance (last 30 days) --------
    sa_rows = []
    today = datetime(2026, 5, 17).date()
    statuses = ["Present","Present","Present","Present","Absent","Late","Excused"]
    for day_offset in range(30):
        d = (today - timedelta(days=day_offset)).isoformat()
        for sid in random.sample(range(1, 61), 25):  # only some students per day
            course_id = random.randint(1, 5)
            session = random.choice(["Morning","Afternoon","Full Day"])
            st = random.choice(statuses)
            sa_rows.append((sid, course_id, d, session, st, ""))
    cur.executemany(
        "INSERT INTO student_attendance (student_id,course_id,attendance_date,session,status,remarks) VALUES (?,?,?,?,?,?)",
        sa_rows,
    )

    # -------- Trainer Attendance (last 30 days) --------
    ta_rows = []
    for day_offset in range(30):
        d = (today - timedelta(days=day_offset)).isoformat()
        for tid in range(1, 7):
            status = random.choices(["Present","Present","Present","Half-day","Absent","On Leave"], k=1)[0]
            hours = {"Present": random.choice([6,7,8]), "Half-day": 4, "Absent": 0, "On Leave": 0}[status]
            ta_rows.append((tid, d, hours, status, ""))
    cur.executemany(
        "INSERT INTO trainer_attendance (trainer_id,attendance_date,hours_taught,status,remarks) VALUES (?,?,?,?,?)",
        ta_rows,
    )

    # ---------- Volunteers ----------
    volunteers = [
        ("Aarav Mehta",       "aarav.mehta@volunteer.org",     "+919812340001", "Infosys Foundation",  "Python, Data Science",       "Mentoring",      "Weekends",      1, 24, "2026-01-15", "Active",   "Mentors final-year ML capstone groups"),
        ("Diya Sharma",       "diya.sharma@volunteer.org",     "+919812340002", "TCS",                 "UI/UX, Figma",               "Teaching",       "Weekdays",      2, 36, "2026-01-22", "Active",   "Conducts design thinking workshops"),
        ("Rohan Iyer",        "rohan.iyer@volunteer.org",      "+919812340003", "Wipro",               "Java, Spring Boot",          "Mentoring",      "Flexible",      3, 18, "2026-02-05", "Active",   "Backend mentor for student projects"),
        ("Ananya Reddy",      "ananya.reddy@volunteer.org",    "+919812340004", "Independent",         "Public Speaking, Soft Skills","Workshop",      "Weekends",      4, 12, "2026-02-12", "Active",   "Runs communication-skills sessions"),
        ("Kabir Singh",       "kabir.singh@volunteer.org",     "+919812340005", "Cyient",              "Embedded Systems, IoT",      "Teaching",       "Weekdays",      5, 28, "2026-02-20", "Active",   "Industry mentor for IoT module"),
        ("Meera Krishnan",    "meera.krishnan@volunteer.org",  "+919812340006", "Tech Mahindra",       "Content Writing, Curriculum","Content",        "Flexible",      None, 15, "2026-03-01", "Active",   "Reviews course material"),
        ("Vihaan Patel",      "vihaan.patel@volunteer.org",    "+919812340007", "Accenture",           "Cloud, DevOps",              "Mentoring",      "Project-based", 6, 20, "2026-03-10", "Active",   "Azure mentor"),
        ("Ishita Verma",      "ishita.verma@volunteer.org",    "+919812340008", "Microsoft",           "AI/ML, NLP",                 "Workshop",       "Weekends",      7, 32, "2026-03-18", "Active",   "AI/ML expert sessions"),
        ("Arjun Nair",        "arjun.nair@volunteer.org",      "+919812340009", "Cognizant",           "Mobile Dev, Flutter",        "Teaching",       "Weekdays",      8, 16, "2026-03-25", "Active",   "Mobile app development trainer"),
        ("Sanvi Joshi",       "sanvi.joshi@volunteer.org",     "+919812340010", "Independent",         "Career Counseling",          "Outreach",       "Flexible",      None, 10, "2026-04-02", "Active",   "Placement preparation guidance"),
        ("Aditya Kapoor",     "aditya.kapoor@volunteer.org",   "+919812340011", "Cyient",              "CSR Program Management",     "CSR",            "Weekdays",      1, 22, "2026-04-08", "Active",   "Cyient CSR coordinator"),
        ("Pooja Menon",       "pooja.menon@volunteer.org",     "+919812340012", "HCL",                 "Event Management",           "Event Support",  "Project-based", 2, 8,  "2026-04-15", "On Break", "Hackathon coordinator (on leave)"),
        ("Karthik Rao",       "karthik.rao@volunteer.org",     "+919812340013", "Independent",         "Cybersecurity",              "Workshop",       "Weekends",      3, 14, "2026-04-22", "Active",   "Security awareness sessions"),
        ("Riya Bhat",         "riya.bhat@volunteer.org",       "+919812340014", "Capgemini",           "Database, SQL",              "Teaching",       "Weekdays",      4, 26, "2026-04-30", "Active",   "DBMS module support"),
        ("Yash Agarwal",      "yash.agarwal@volunteer.org",    "+919812340015", "Independent",         "Entrepreneurship",           "Mentoring",      "Flexible",      None, 6,  "2026-05-05", "Inactive", "Recently transitioned out"),
    ]
    cur.executemany(
        "INSERT INTO volunteers (name,email,phone,organization,expertise,area_of_interest,availability,activity_id,hours_contributed,joined_date,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        volunteers,
    )

    # -------- Internships (for some students) --------
    companies = ["Cyient Ltd", "TCS", "Infosys", "Tech Mahindra", "Wipro", "HCL", "Accenture"]
    roles_list = ["Software Intern", "Data Analyst Intern", "QA Intern", "IoT Intern", "Web Dev Intern"]
    internships = []
    for sid in random.sample(range(1, 61), 18):
        comp = random.choice(companies)
        role = random.choice(roles_list)
        start = (datetime(2026, 4, 1) + timedelta(days=random.randint(0, 30))).date().isoformat()
        end = (datetime(2026, 7, 1) + timedelta(days=random.randint(0, 30))).date().isoformat()
        status = random.choice(["Active", "Active", "Completed"])
        stipend = random.choice([5000, 8000, 10000, 12000, 15000])
        internships.append((sid, comp, role, start, end, status, stipend))
    cur.executemany(
        "INSERT INTO internships (student_id,company_name,role,start_date,end_date,status,stipend) VALUES (?,?,?,?,?,?,?)",
        internships,
    )

    # -------- Feedbacks (sample) --------
    feedbacks = [
        ("Aarav Reddy", "Student", "Great training sessions", "The Python module was very well structured and easy to follow.", 5, "Reviewed"),
        ("Divya Sharma", "Student", "Need more practical examples", "Would love more hands-on labs in the IoT chapter.", 4, "Pending"),
        ("Dr. Anil Reddy", "Trainer", "Projector issue in Lab 2", "The projector in Lab 2 frequently disconnects during class.", 3, "Pending"),
        ("Neha Kumar", "Student", "Excellent mentorship", "The trainers are very supportive and approachable.", 5, "Addressed"),
        ("Meena Iyer", "Trainer", "Request for updated curriculum", "Soft-skills curriculum could be refreshed for 2026.", 4, "Reviewed"),
    ]
    cur.executemany(
        "INSERT INTO feedbacks (provider_name,provider_role,subject,comments,rating,status) VALUES (?,?,?,?,?,?)",
        feedbacks,
    )

    # -------- Users (authentication) --------
    # All seeded users share the same default password for easy demo login.
    try:
        from werkzeug.security import generate_password_hash
        _hash = lambda pw: generate_password_hash(pw)
    except Exception:
        # Fallback (should not happen since Flask installs werkzeug)
        import hashlib
        _hash = lambda pw: "sha256$" + hashlib.sha256(pw.encode()).hexdigest()

    DEFAULT_PW = "cyient@123"
    user_rows = []
    # Administrators -> superadmin portal
    for row in cur.execute("SELECT id, name, email FROM administrators").fetchall():
        user_rows.append((row["email"], _hash(DEFAULT_PW), "superadmin", row["id"], row["name"], 0))
    # Trainers -> trainer portal
    for row in cur.execute("SELECT id, name, email FROM trainers").fetchall():
        user_rows.append((row["email"], _hash(DEFAULT_PW), "trainer", row["id"], row["name"], 0))
    # Students -> student portal
    for row in cur.execute("SELECT id, name, email FROM students").fetchall():
        user_rows.append((row["email"], _hash(DEFAULT_PW), "student", row["id"], row["name"], 0))
    cur.executemany(
        "INSERT INTO users (username,password_hash,role,ref_id,display_name,must_change_password) VALUES (?,?,?,?,?,?)",
        user_rows,
    )

    # -------- Certificates (for completed students) --------
    cert_rows = []
    completed = cur.execute("SELECT id, course_id FROM students WHERE status='Completed'").fetchall()
    for i, s in enumerate(completed, start=1):
        cert_no = f"CYF-2026-{1000 + i}"
        grade = random.choice(["A+", "A", "B+", "B"])
        issued = (datetime(2026, 5, 1) + timedelta(days=random.randint(0, 20))).date().isoformat()
        cert_rows.append((s["id"], s["course_id"], cert_no, grade, issued, "Issued"))
    cur.executemany(
        "INSERT INTO certificates (student_id,course_id,certificate_no,grade,issued_date,status) VALUES (?,?,?,?,?,?)",
        cert_rows,
    )

    # -------- Tickets (sample) --------
    tickets = [
        (None, "Aarav Reddy", "student", "Cannot download chapter PDF", "The download button for Chapter 3 PDF is not working.", "Technical", "High", "Open", None),
        (None, "Divya Sharma", "student", "Attendance marked wrong", "I attended on 12th May but it shows absent.", "Attendance", "Medium", "In Progress", "We are checking with your trainer."),
        (None, "Dr. Anil Reddy", "trainer", "Need student list export", "Please add an export option for the student list.", "General", "Low", "Open", None),
        (None, "Neha Kumar", "student", "Certificate not visible", "I completed the course but my certificate is not showing.", "Content", "High", "Resolved", "Certificate has been issued. Please check again."),
        (None, "Meena Iyer", "trainer", "Lab software outdated", "The Python version in the lab is old, please update.", "Technical", "Urgent", "Open", None),
    ]
    cur.executemany(
        "INSERT INTO tickets (raised_by_user_id,raised_by_name,raised_by_role,subject,description,category,priority,status,response) VALUES (?,?,?,?,?,?,?,?,?)",
        tickets,
    )

    # -------- Chapter files (sample metadata -> shared sample PDF on disk) --------
    chapter_file_rows = []
    sample_chapters = cur.execute("SELECT id FROM chapters ORDER BY id LIMIT 6").fetchall()
    for ch in sample_chapters:
        chapter_file_rows.append((ch["id"], "sample_chapter_material.pdf",
                                  "Chapter Material.pdf", "pdf", 13264, "trainer", "Dr. Anil Reddy"))
    cur.executemany(
        "INSERT INTO chapter_files (chapter_id,stored_name,original_name,file_type,file_size,uploaded_by_role,uploaded_by_name) VALUES (?,?,?,?,?,?,?)",
        chapter_file_rows,
    )

    # -------- Student chapter status (progress) --------
    scs_rows = []
    all_chapter_ids = [r["id"] for r in cur.execute("SELECT id FROM chapters").fetchall()]
    for sid in range(1, 61):
        # each student has progress on a random subset of chapters
        for cid in random.sample(all_chapter_ids, k=random.randint(3, len(all_chapter_ids))):
            status = random.choices(["Completed", "Completed", "In Progress", "Not Started"], k=1)[0]
            scs_rows.append((sid, cid, status))
    cur.executemany(
        "INSERT OR IGNORE INTO student_chapter_status (student_id,chapter_id,status) VALUES (?,?,?)",
        scs_rows,
    )

    print(f"[seed] Inserted: {len(admins)} admins, {len(projects)} projects, "
          f"{len(courses)} courses, {len(modules)} modules, {len(chapters)} chapters, "
          f"{len(skills)} skills, {len(trainers)} trainers, {len(students)} students, "
          f"{len(student_skill_rows)} student-skill rows, {len(chapter_assignments)} chapter assignments, "
          f"{len(activities)} activities, {len(sa_rows)} student-attendance rows, "
          f"{len(ta_rows)} trainer-attendance rows, {len(volunteers)} volunteers, "
          f"{len(internships)} internships, {len(feedbacks)} feedbacks, {len(user_rows)} users, "
          f"{len(cert_rows)} certificates, {len(tickets)} tickets, {len(chapter_file_rows)} chapter-files, "
          f"{len(scs_rows)} chapter-status rows.")
