# Cyient Foundation CRM Dashboard

A Flask + SQLite CRM prototype with three role-based portals:
**Super Admin**, **Trainer**, and **Student** — each with real login
(passwords hashed and stored in SQLite), file uploads, tickets,
certificates, attendance, feedback and chapter management.

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000 → you'll land on the role-selection page.

> **Important:** The database schema changed in this version. If you have an
> old `instance/crm.db`, delete it (or run `RESEED=1 python app.py`) so the new
> tables (users, tickets, certificates, chapter_files, student_chapter_status)
> are created and seeded.

## Login credentials

Default password for **every** seeded account: `cyient@123`

| Role        | Example username                       |
|-------------|----------------------------------------|
| Super Admin | `pavan.kumar@cyientfoundation.org`     |
| Trainer     | `anil.reddy@cyient.org`                |
| Student     | `student001@learner.cyient.org`        |

Usernames are the **emails** stored in the system. When a Super Admin adds a
new administrator / trainer / student, a login is **auto-created** for that
email with the default password (and a "must change password" flag).

Forgot-password is on each login page (prototype style: enter your email and a
new password — no email server needed).

## Portals

- **Student** — Dashboard, Chapter Management (view/download PDFs, set progress),
  Attendance, Certificates, Tickets, Feedback, Change Password.
- **Trainer** — Dashboard, Chapter Management (upload PDFs, set status),
  Student Management (add/edit), Mark Attendance, View Attendance, Certificates
  (view all issued), Tickets, Feedback, Change Password.
- **Super Admin** — full CRM admin board + Ticket Management, Certificate
  Management, Feedback Management, Change Password.

## File storage

Uploaded files (PDFs/videos) are saved on disk under `instance/uploads/`, and
only their metadata (name, size, type, chapter) is stored in SQLite. This keeps
the database small and handles videos well — the standard approach for real apps.
Max upload size is 50 MB; allowed types: pdf, mp4, webm, mov, png, jpg, jpeg,
ppt, pptx, doc, docx.
