/* ===================================================================
   Entity configurations.
   Each entry drives one module page (table columns + form fields).
   The router (app.js) reads this to render the table and form modal.
   =================================================================== */

const STATUS_OPTIONS = {
  project: ['Planned', 'Active', 'On Hold', 'Completed'],
  course:  ['Active', 'Inactive', 'Completed'],
  trainer: ['Active', 'Inactive', 'On Leave'],
  student: ['Active', 'Inactive', 'Completed', 'Dropped'],
  admin:   ['Active', 'Inactive'],
  assignment: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
  attendance_student: ['Present', 'Absent', 'Late', 'Excused'],
  attendance_trainer: ['Present', 'Absent', 'Half-day', 'On Leave'],
  volunteer: ['Active', 'Inactive', 'On Break'],
  internship: ['Active', 'Inactive', 'Completed'],
  feedback: ['Pending', 'Reviewed', 'Addressed'],
};

// Async option sources for FK selects.
const opts = (entity) => async () => {
  const list = await API.options(entity);
  return list.map((o) => ({ value: o.id, label: o.name }));
};

const ENTITIES = {

  // ---------- ACTIVITY HISTORY ----------
  activity_logs: {
    title: 'Activity History',
    section: 'Settings',
    entity: 'activity_logs',
    icon: 'activity',
    readonly: true,
    columns: [
      { key: 'created_at', label: 'When', render: (r) => UI.fmtDate(r.created_at) },
      { key: 'user_name', label: 'User' },
      { key: 'user_role', label: 'Role', render: (r) => UI.badge(r.user_role) },
      { key: 'action', label: 'Action', render: (r) => UI.badge(r.action) },
      { key: 'entity_type', label: 'Section' },
      { key: 'summary', label: 'Summary' },
    ],
    fields: [],
  },

  // ---------- ANALYTICS: AT-RISK STUDENTS ----------
  at_risk_students: {
    title: 'At-Risk Students',
    section: 'Analytics',
    entity: 'at_risk_students',
    icon: 'alert',
    readonly: false,
    noAdd: true,
    tableActions: [
      { key: 'sendWarnings', label: 'Send Warnings', className: 'btn btn-primary btn-sm' },
    ],
    emptyTitle: 'No at-risk students',
    emptyText: 'No active students currently match the dropout risk rules.',
    columns: [
      { key: 'name', label: 'Student' },
      { key: 'batch', label: 'Batch' },
      { key: 'course_name', label: 'Course' },
      { key: 'risk_level', label: 'Risk', render: (r) => UI.badge(r.risk_level) },
      { key: 'risk_score', label: 'Score' },
      { key: 'attendance_pct', label: 'Attendance', render: (r) => `${r.attendance_pct || 0}%` },
      { key: 'progress_pct', label: 'Progress', render: (r) => `${r.progress_pct || 0}%` },
      { key: 'pending_chapters', label: 'Pending chapters' },
      { key: 'unresolved_tickets', label: 'Open helpdesk' },
      { key: 'reason', label: 'Reason' },
    ],
    fields: [
      { key: 'name', label: 'Full name', required: true, full: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { key: 'project_id', label: 'Project', type: 'select', options: opts('projects') },
      { key: 'course_id',  label: 'Course',  type: 'select', options: opts('courses') },
      { key: 'batch', label: 'Batch', placeholder: 'B-2026-A' },
      { key: 'institution', label: 'Institution' },
      { key: 'enrollment_date', label: 'Enrollment date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.student },
    ],
  },

  // ---------- ANALYTICS: BATCH HEALTH ----------
  batch_health: {
    title: 'Batch Health',
    section: 'Analytics',
    entity: 'batch_health',
    icon: 'pulse',
    readonly: true,
    emptyTitle: 'No batch health data',
    emptyText: 'Batch health appears after active students are assigned to batches.',
    columns: [
      { key: 'batch', label: 'Batch' },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
      { key: 'health_score', label: 'Health score', render: (r) => `${r.health_score || 0}%` },
      { key: 'students', label: 'Students' },
      { key: 'attendance_pct', label: 'Attendance', render: (r) => `${r.attendance_pct || 0}%` },
      { key: 'course_progress_pct', label: 'Course progress', render: (r) => `${r.course_progress_pct || 0}%` },
      { key: 'pending_tickets', label: 'Pending helpdesk' },
      { key: 'certificate_eligible', label: 'Certificate eligible' },
      { key: 'issued_certificates', label: 'Issued certificates' },
      { key: 'avg_grade', label: 'Avg grade', render: (r) => r.avg_grade ?? '-' },
    ],
    fields: [],
  },

  // ---------- ADMINISTRATORS ----------
  administrators: {
    title: 'Administrators',
    section: 'People',
    entity: 'administrators',
    icon: 'shield',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role', render: (r) => UI.badge(r.role) },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'name',  label: 'Full name', required: true, full: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone' },
      { key: 'role',  label: 'Role', type: 'select', required: true,
        options: ['SuperAdmin', 'Admin', 'Manager', 'Viewer'] },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.admin },
      { key: 'permissions', label: 'Permissions (comma separated)', full: true,
        placeholder: 'read,write,delete' },
    ],
  },

  // ---------- PROJECTS ----------
  projects: {
    title: 'Project Management',
    section: 'Operations',
    entity: 'projects',
    icon: 'briefcase',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'name', label: 'Project' },
      { key: 'institution', label: 'Institution' },
      { key: 'start_date', label: 'Start', render: (r) => UI.fmtDate(r.start_date) },
      { key: 'end_date',   label: 'End',   render: (r) => UI.fmtDate(r.end_date) },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
      { key: 'progress', label: 'Progress', render: (r) => `
          <div style="display:flex;align-items:center;gap:8px;min-width:120px;">
            <div class="progress-bar" style="flex:1;"><div class="progress-bar-fill${(r.progress||0)>=100?' full':''}" style="width:${r.progress||0}%"></div></div>
            <span style="font-size:12px;color:var(--gray-600);">${r.progress||0}%</span>
          </div>` },
      { key: 'budget', label: 'Budget', render: (r) => UI.fmtCurrency(r.budget) },
    ],
    fields: [
      { key: 'name', label: 'Project name', required: true, full: true },
      { key: 'institution', label: 'Institution' },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.project },
      { key: 'start_date', label: 'Start date', type: 'date' },
      { key: 'end_date',   label: 'End date',   type: 'date' },
      { key: 'progress', label: 'Progress (%)', type: 'number', min: 0, max: 100 },
      { key: 'budget', label: 'Budget (INR)', type: 'number', min: 0, step: 1000 },
      { key: 'description', label: 'Description', type: 'textarea', full: true },
    ],
  },

  // ---------- COURSES ----------
  courses: {
    title: 'Course Management',
    section: 'Academics',
    entity: 'courses',
    icon: 'book',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'name', label: 'Course' },
      { key: 'project_name', label: 'Project' },
      { key: 'target_group', label: 'Target group' },
      { key: 'duration_weeks', label: 'Duration', render: (r) => `${r.duration_weeks || 0} weeks` },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'name', label: 'Course name', required: true, full: true },
      { key: 'project_id', label: 'Project', type: 'select', options: opts('projects') },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.course },
      { key: 'duration_weeks', label: 'Duration (weeks)', type: 'number', min: 1 },
      { key: 'target_group', label: 'Target group' },
      { key: 'objectives', label: 'Objectives', type: 'textarea', full: true },
      { key: 'learning_outcomes', label: 'Learning outcomes', type: 'textarea', full: true },
    ],
  },

  // ---------- MODULES ----------
  modules: {
    title: 'Modules Management',
    section: 'Academics',
    entity: 'modules',
    icon: 'layers',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'sequence', label: 'Seq' },
      { key: 'name', label: 'Module' },
      { key: 'course_name', label: 'Course' },
      { key: 'duration_hours', label: 'Duration', render: (r) => `${r.duration_hours || 0} hrs` },
    ],
    fields: [
      { key: 'name', label: 'Module name', required: true, full: true },
      { key: 'course_id', label: 'Course', type: 'select', required: true, options: opts('courses') },
      { key: 'sequence', label: 'Sequence number', type: 'number', min: 1 },
      { key: 'duration_hours', label: 'Duration (hours)', type: 'number', min: 1 },
      { key: 'learning_goals', label: 'Learning goals', type: 'textarea', full: true },
    ],
  },

  // ---------- CHAPTERS ----------
  chapters: {
    title: 'Chapters Management',
    section: 'Academics',
    entity: 'chapters',
    icon: 'bookmark',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'sequence', label: 'Seq' },
      { key: 'name', label: 'Chapter' },
      { key: 'module_name', label: 'Module' },
      { key: 'content_type', label: 'Type', render: (r) => UI.badge(r.content_type) },
    ],
    fields: [
      { key: 'name', label: 'Chapter name', required: true, full: true },
      { key: 'module_id', label: 'Module', type: 'select', required: true, options: opts('modules') },
      { key: 'sequence', label: 'Sequence', type: 'number', min: 1 },
      { key: 'content_type', label: 'Content type', type: 'select',
        options: ['Theory', 'Practical', 'Skill', 'Assessment'] },
      { key: 'description', label: 'Description', type: 'textarea', full: true },
    ],
  },

  // ---------- SKILLS ----------
  skills: {
    title: 'Grades / Skills Management',
    section: 'Academics',
    entity: 'skills',
    icon: 'award',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'name', label: 'Skill' },
      { key: 'category', label: 'Category', render: (r) => UI.badge(r.category) },
      { key: 'max_grade', label: 'Max grade' },
      { key: 'description', label: 'Description' },
    ],
    fields: [
      { key: 'name', label: 'Skill name', required: true, full: true },
      { key: 'category', label: 'Category', type: 'select', required: true,
        options: ['Technical', 'Soft', 'Practical'] },
      { key: 'max_grade', label: 'Max grade', type: 'number', min: 1 },
      { key: 'description', label: 'Description', type: 'textarea', full: true },
    ],
  },

  // ---------- CHAPTER ASSIGNMENTS ----------
  chapter_assignments: {
    title: 'Assign Chapter Management',
    section: 'Academics',
    entity: 'chapter_assignments',
    icon: 'clipboard',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'chapter_name', label: 'Chapter' },
      { key: 'trainer_name', label: 'Trainer' },
      { key: 'batch', label: 'Batch' },
      { key: 'scheduled_date', label: 'Scheduled', render: (r) => UI.fmtDate(r.scheduled_date) },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'chapter_id', label: 'Chapter', type: 'select', required: true, options: opts('chapters') },
      { key: 'trainer_id', label: 'Trainer', type: 'select', required: true, options: opts('trainers') },
      { key: 'batch', label: 'Batch', required: true, placeholder: 'B-2026-A' },
      { key: 'scheduled_date', label: 'Scheduled date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.assignment },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
  },

  // ---------- TRAINERS ----------
  trainers: {
    title: 'Trainer Management',
    section: 'People',
    entity: 'trainers',
    icon: 'user-tie',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'experience_years', label: 'Experience', render: (r) => `${r.experience_years || 0} yrs` },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'name', label: 'Full name', required: true, full: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'qualification', label: 'Qualification' },
      { key: 'experience_years', label: 'Experience (yrs)', type: 'number', min: 0 },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.trainer },
      { key: 'joined_date', label: 'Joined date', type: 'date' },
    ],
  },

  // ---------- VOLUNTEERS ----------
  volunteers: {
    title: 'Volunteer Management',
    section: 'People',
    entity: 'volunteers',
    icon: 'heart',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'organization', label: 'Organization' },
      { key: 'expertise', label: 'Expertise' },
      { key: 'area_of_interest', label: 'Interest', render: (r) => UI.badge(r.area_of_interest) },
      { key: 'availability', label: 'Availability' },
      { key: 'activity_name', label: 'Activity' },
      { key: 'hours_contributed', label: 'Hours', render: (r) => UI.fmtNum(r.hours_contributed) },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'name', label: 'Full name', required: true, full: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone' },
      { key: 'organization', label: 'Organization / Company' },
      { key: 'expertise', label: 'Expertise / Skills offered', full: true,
        placeholder: 'e.g. Python, UI Design, Public Speaking' },
      { key: 'area_of_interest', label: 'Area of interest', type: 'select', required: true,
        options: ['Mentoring', 'Teaching', 'Workshop', 'Content', 'Outreach', 'CSR', 'Event Support'] },
      { key: 'availability', label: 'Availability', type: 'select', required: true,
        options: ['Weekdays', 'Weekends', 'Flexible', 'Project-based'] },
      { key: 'activity_id', label: 'Assigned activity', type: 'select', options: opts('activities') },
      { key: 'hours_contributed', label: 'Hours contributed', type: 'number', min: 0 },
      { key: 'joined_date', label: 'Joined date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.volunteer },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
  },

  // ---------- STUDENTS ----------
  students: {
    title: 'Student Management',
    section: 'People',
    entity: 'students',
    icon: 'users',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'batch', label: 'Batch' },
      { key: 'project_name', label: 'Project' },
      { key: 'course_name', label: 'Course' },
      { key: 'institution', label: 'Institution' },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'name', label: 'Full name', required: true, full: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { key: 'project_id', label: 'Project', type: 'select', options: opts('projects') },
      { key: 'course_id',  label: 'Course',  type: 'select', options: opts('courses') },
      { key: 'batch', label: 'Batch', placeholder: 'B-2026-A' },
      { key: 'institution', label: 'Institution' },
      { key: 'enrollment_date', label: 'Enrollment date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.student },
    ],
  },

  // ---------- ACTIVITIES ----------
  activities: {
    title: 'Activity Management',
    section: 'Operations',
    entity: 'activities',
    icon: 'activity',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'name', label: 'Activity' },
      { key: 'activity_type', label: 'Type', render: (r) => UI.badge(r.activity_type) },
      { key: 'project_name', label: 'Project' },
      { key: 'activity_date', label: 'Date', render: (r) => UI.fmtDate(r.activity_date) },
      { key: 'location', label: 'Location' },
      { key: 'participants_count', label: 'Participants', render: (r) => UI.fmtNum(r.participants_count) },
    ],
    fields: [
      { key: 'name', label: 'Activity name', required: true, full: true },
      { key: 'activity_type', label: 'Type', type: 'select', required: true,
        options: ['Classroom', 'Practical', 'Workshop', 'Hackathon', 'CSR', 'Event'] },
      { key: 'project_id', label: 'Project', type: 'select', options: opts('projects') },
      { key: 'activity_date', label: 'Date', type: 'date' },
      { key: 'location', label: 'Location' },
      { key: 'participants_count', label: 'Participants', type: 'number', min: 0 },
      { key: 'description', label: 'Description', type: 'textarea', full: true },
    ],
  },

  // ---------- STUDENT ATTENDANCE ----------
  student_attendance: {
    title: 'Manage Student Attendance',
    section: 'Attendance',
    entity: 'student_attendance',
    icon: 'check-circle',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'attendance_date', label: 'Date', render: (r) => UI.fmtDate(r.attendance_date) },
      { key: 'student_name', label: 'Student' },
      { key: 'course_name', label: 'Course' },
      { key: 'session', label: 'Session' },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'student_id', label: 'Student', type: 'select', required: true, options: opts('students') },
      { key: 'course_id',  label: 'Course',  type: 'select', options: opts('courses') },
      { key: 'attendance_date', label: 'Date', type: 'date', required: true },
      { key: 'session', label: 'Session', type: 'select',
        options: ['Morning', 'Afternoon', 'Full Day'] },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.attendance_student },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true },
    ],
  },

  // ---------- TRAINER ATTENDANCE ----------
  trainer_attendance: {
    title: 'Trainer Attendance',
    section: 'Attendance',
    entity: 'trainer_attendance',
    icon: 'clock',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'attendance_date', label: 'Date', render: (r) => UI.fmtDate(r.attendance_date) },
      { key: 'trainer_name', label: 'Trainer' },
      { key: 'hours_taught', label: 'Hours' },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'trainer_id', label: 'Trainer', type: 'select', required: true, options: opts('trainers') },
      { key: 'attendance_date', label: 'Date', type: 'date', required: true },
      { key: 'hours_taught', label: 'Hours taught', type: 'number', min: 0, step: 0.5 },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.attendance_trainer },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true },
    ],
  },

  // ---------- STUDENT SKILLS (grades) ----------
  student_skills: {
    title: 'Student Skills & Grades',
    section: 'Academics',
    entity: 'student_skills',
    icon: 'star',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'student_name', label: 'Student' },
      { key: 'skill_name', label: 'Skill' },
      { key: 'grade', label: 'Grade' },
      { key: 'skill_level', label: 'Level', render: (r) => UI.badge(r.skill_level) },
      { key: 'evaluated_on', label: 'Evaluated', render: (r) => UI.fmtDate(r.evaluated_on) },
    ],
    fields: [
      { key: 'student_id', label: 'Student', type: 'select', required: true, options: opts('students') },
      { key: 'skill_id', label: 'Skill', type: 'select', required: true, options: opts('skills') },
      { key: 'grade', label: 'Grade', type: 'number', min: 0, max: 100 },
      { key: 'skill_level', label: 'Skill level', type: 'select',
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
      { key: 'evaluated_on', label: 'Evaluated on', type: 'date' },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true },
    ],
  },

  // ---------- INTERNSHIPS ----------
  internships: {
    title: 'Internship Management',
    section: 'People',
    entity: 'internships',
    icon: 'briefcase',
    columns: [
      { key: 'id', label: 'S.No', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'student_name', label: 'Student Name' },
      { key: 'company_name', label: 'Company' },
      { key: 'institution', label: 'University' },
      { key: 'role', label: 'Role' },
      { key: 'email', label: 'Email ID' },
      { key: 'phone', label: 'Mobile No' },
      { key: 'visitor_card_id', label: 'Visitor Card ID No' },
      { key: 'start_date', label: 'Start Date', render: (r) => UI.fmtDate(r.start_date) },
      { key: 'end_date', label: 'End Date', render: (r) => UI.fmtDate(r.end_date) },
      { key: 'stipend_details', label: 'Stipend', render: (r) => r.payment_type === 'Paid' ? `₹${r.stipend || 0}` : 'NIL' },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'student_id', label: 'Student', type: 'select', required: true, options: opts('students') },
      { key: 'company_name', label: 'Company Name', required: true, full: true },
      { key: 'role', label: 'Role' },
      { key: 'visitor_card_id', label: 'Visitor Card ID No' },
      { key: 'reporting_manager', label: 'Reporting Manager' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' },
      { key: 'payment_type', label: 'Payment Type', type: 'select', required: true, options: ['Unpaid', 'Paid'] },
      { key: 'stipend', label: 'Stipend Amount (₹)', type: 'number', min: 0 },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.internship },
    ],
    customActions: (r) => `<button class="btn btn-icon" title="Manage Documents" data-action="docs" data-id="${r.id}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></button>`
  },

  // ---------- FEEDBACKS ----------
  feedbacks: {
    title: 'Feedback Management',
    section: 'People',
    entity: 'feedbacks',
    icon: 'edit',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'provider_name', label: 'Provider Name' },
      { key: 'provider_role', label: 'Role', render: (r) => UI.badge(r.provider_role) },
      { key: 'subject', label: 'Subject' },
      { key: 'rating', label: 'Rating', render: (r) => `${r.rating}/5` },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'provider_name', label: 'Provider Name', required: true, full: true },
      { key: 'provider_role', label: 'Provider Role', type: 'select', options: ['Student', 'Trainer', 'Volunteer', 'Admin'] },
      { key: 'subject', label: 'Subject', required: true, full: true },
      { key: 'comments', label: 'Comments', type: 'textarea', full: true },
      { key: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5 },
      { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS.feedback },
    ],
  },

  tickets: {
    title: 'Helpdesk Management',
    section: 'Support',
    entity: 'tickets',
    icon: 'ticket',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'subject', label: 'Subject' },
      { key: 'raised_by_name', label: 'Raised By' },
      { key: 'raised_by_role', label: 'Role', render: (r) => UI.badge(r.raised_by_role) },
      { key: 'category', label: 'Category' },
      { key: 'priority', label: 'Priority', render: (r) => UI.badge(r.priority) },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'subject', label: 'Subject', required: true, full: true },
      { key: 'description', label: 'Description', type: 'textarea', full: true },
      { key: 'raised_by_name', label: 'Raised By' },
      { key: 'raised_by_role', label: 'Role', type: 'select', options: ['student', 'trainer', 'superadmin'] },
      { key: 'category', label: 'Category', type: 'select', options: ['General', 'Technical', 'Content', 'Attendance', 'Other'] },
      { key: 'priority', label: 'Priority', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Urgent'] },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
      { key: 'response', label: 'Response / Resolution note', type: 'textarea', full: true },
    ],
  },

  certificates: {
    title: 'Certificate Management',
    section: 'Support',
    entity: 'certificates',
    icon: 'award',
    columns: [
      { key: 'id', label: '#', render: (r) => `<strong>#${r.id}</strong>` },
      { key: 'certificate_no', label: 'Certificate No.' },
      { key: 'student_name', label: 'Student' },
      { key: 'course_name', label: 'Course' },
      { key: 'grade', label: 'Grade' },
      { key: 'issued_date', label: 'Issued', render: (r) => UI.fmtDate(r.issued_date) },
      { key: 'status', label: 'Status', render: (r) => UI.badge(r.status) },
    ],
    fields: [
      { key: 'student_id', label: 'Student', type: 'select', required: true, options: opts('students') },
      { key: 'course_id', label: 'Course', type: 'select', options: opts('courses') },
      { key: 'certificate_no', label: 'Certificate No.', required: true, placeholder: 'e.g. CYF-2026-1009' },
      { key: 'grade', label: 'Grade', type: 'select', options: ['A+', 'A', 'B+', 'B', 'C'] },
      { key: 'issued_date', label: 'Issued date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Issued', 'Pending'] },
    ],
  },
};

// Sidebar order — grouped by section
const NAV_ORDER = [
  { type: 'item',    key: 'dashboard',           label: 'Master Board',                icon: 'grid' },
  { type: 'heading', label: 'Analytics' },
  { type: 'item',    key: 'at_risk_students',    label: 'At-Risk Students',            icon: 'alert' },
  { type: 'item',    key: 'batch_health',        label: 'Batch Health',                icon: 'pulse' },
  { type: 'item',    key: 'calendar',            label: 'Calendar',                   icon: 'calendar' },
  { type: 'heading', label: 'Operations' },
  { type: 'item',    key: 'projects',            label: 'Projects',                    icon: 'briefcase' },
  { type: 'item',    key: 'activities',          label: 'Activities',                  icon: 'activity' },
  { type: 'heading', label: 'Academics' },
  { type: 'item',    key: 'courses',             label: 'Courses',                     icon: 'book' },
  { type: 'item',    key: 'modules',             label: 'Modules',                     icon: 'layers' },
  { type: 'item',    key: 'chapters',            label: 'Chapters',                    icon: 'bookmark' },
  { type: 'item',    key: 'chapter_assignments', label: 'Assign Chapters',             icon: 'clipboard' },
  { type: 'item',    key: 'skills',              label: 'Skills',                      icon: 'award' },
  { type: 'item',    key: 'student_skills',      label: 'Grades',                      icon: 'star' },
  { type: 'heading', label: 'People' },
  { type: 'item',    key: 'students',            label: 'Students',                    icon: 'users' },
  { type: 'item',    key: 'trainers',            label: 'Trainers',                    icon: 'user-tie' },
  { type: 'item',    key: 'volunteers',          label: 'Volunteers',                  icon: 'heart' },
  { type: 'item',    key: 'administrators',      label: 'Administrators',              icon: 'shield' },
  { type: 'item',    key: 'internships',         label: 'Internships',                 icon: 'briefcase' },
  { type: 'item',    key: 'feedbacks',           label: 'Feedback',                    icon: 'edit' },
  { type: 'heading', label: 'Support' },
  { type: 'item',    key: 'tickets',             label: 'Helpdesk',                     icon: 'ticket' },
  { type: 'item',    key: 'certificates',        label: 'Certificates',                icon: 'award' },
  { type: 'heading', label: 'Attendance' },
  { type: 'item',    key: 'student_attendance',  label: 'Student Attendance',          icon: 'check-circle' },
  { type: 'item',    key: 'trainer_attendance',  label: 'Trainer Attendance',          icon: 'clock' },
  { type: 'heading', label: 'Settings' },
  { type: 'item',    key: 'activity_logs',       label: 'Activity History',            icon: 'activity' },
  { type: 'item',    key: 'change_password',     label: 'Change Password',             icon: 'key', id: 'change-pw-action' },
];

// SVG icon set used across the sidebar and stat cards.
const ICONS = {
  grid:        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  briefcase:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  book:        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  layers:      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  bookmark:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  award:       '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 22 12 19 17 22 15.79 13.88"/></svg>',
  clipboard:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6v4H9z"/><rect x="5" y="4" width="14" height="18" rx="2"/></svg>',
  users:       '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  'user-tie':  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>',
  shield:      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  activity:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  alert:       '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  pulse:       '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 8L9 4l-3 8H2"/></svg>',
  'check-circle': '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  clock:       '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  star:        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  heart:       '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  edit:        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash:       '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
  ticket:      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/></svg>',
  key:         '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>',
  calendar:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
};
