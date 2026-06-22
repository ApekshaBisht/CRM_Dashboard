/* ===================================================================
  Dashboard view (Master Board)
  - Stat cards
  - Project status doughnut
  - Attendance trend line chart
  - Course-wise student count bar chart
  - Top projects + recent activities
  =================================================================== */

const Dashboard = (() => {

  // Keep chart instances so we can destroy them when re-rendering.
  let charts = [];

  function destroyCharts() {
    charts.forEach((c) => { try { c.destroy(); } catch (e) { } });
    charts = [];
  }

  async function render(container) {
    container.innerHTML = UI.loader();

    let data;
    try {
      data = await API.dashboard();
    } catch (err) {
      container.innerHTML = `<div class="card"><h3 style="color:var(--danger);">Failed to load dashboard</h3><p>${UI.escapeHtml(err.message)}</p></div>`;
      return;
    }

    const c = data.counts;

    destroyCharts();

    container.innerHTML = `
      <!-- stat cards -->
      <div class="stats-grid">
        ${statCard('Total Projects', c.projects, `${c.active_projects} active`, 'briefcase', '')}
        ${statCard('Students', c.students, `${c.active_students} active`, 'users', 'purple')}
        ${statCard('Trainers', c.trainers, `${c.active_trainers} active`, 'user-tie', 'green')}
        ${statCard('Volunteers', c.volunteers, `${c.active_volunteers} active`, 'heart', 'pink')}
        ${statCard('Courses', c.courses, `${c.modules} modules`, 'book', 'blue')}
        ${statCard('Chapters', c.chapters, `${c.chapter_assignments} assignments`, 'bookmark', 'orange')}
        ${statCard('Activities', c.activities, 'all categories', 'activity', 'pink')}
        ${statCard('Skills', c.skills, 'tracked', 'award', '')}
        ${statCard('Administrators', c.administrators, 'with access', 'shield', 'red')}
      </div>

      <!-- charts row -->
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Student attendance — last 14 days</h3>
              <div class="card-subtitle">Daily present %</div>
            </div>
          </div>
          <div class="chart-wrap"><canvas id="chart-attendance"></canvas></div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Project status</h3>
              <div class="card-subtitle">Distribution across all projects</div>
            </div>
          </div>
          <div class="chart-wrap"><canvas id="chart-projects"></canvas></div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Students per course</h3>
              <div class="card-subtitle">Top courses by enrolment</div>
            </div>
          </div>
          <div class="chart-wrap"><canvas id="chart-courses"></canvas></div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Top projects</h3>
              <div class="card-subtitle">Sorted by progress</div>
            </div>
          </div>
          <div id="top-projects">
            ${data.top_projects.length
        ? data.top_projects.map(topProjectRow).join('')
        : '<p style="color:var(--gray-500);font-size:13px;">No projects yet.</p>'}
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">At-risk students</h3>
              <div class="card-subtitle">Dropout signals from attendance, chapters, grades and tickets</div>
            </div>
          </div>
          <div>
            ${data.at_risk_students && data.at_risk_students.length
        ? data.at_risk_students.map(riskRow).join('')
        : '<p style="color:var(--gray-500);font-size:13px;">No active risk signals right now.</p>'}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Batch health score</h3>
              <div class="card-subtitle">Attendance, progress, pending tickets and certificate readiness</div>
            </div>
          </div>
          <div>
            ${data.batch_health && data.batch_health.length
        ? data.batch_health.map(batchHealthRow).join('')
        : '<p style="color:var(--gray-500);font-size:13px;">No batch data available.</p>'}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Recent activities</h3>
            <div class="card-subtitle">Latest events, workshops and CSR initiatives</div>
          </div>
        </div>
        <div>
          ${data.recent_activities.length
        ? data.recent_activities.map(activityRow).join('')
        : '<p style="color:var(--gray-500);font-size:13px;">No activities yet.</p>'}
        </div>
      </div>
    `;

    // ----- charts -----
    drawAttendanceChart(data.attendance_trend);
    drawProjectStatusChart(data.project_status);
    drawCourseStudentChart(data.course_student_count);
  }

  function statCard(label, value, meta, icon, color) {
    return `<div class="stat-card">
      <div class="stat-icon ${color}">${ICONS[icon] || ICONS.grid}</div>
      <div>
        <div class="stat-label">${UI.escapeHtml(label)}</div>
        <div class="stat-value">${UI.fmtNum(value)}</div>
        <div class="stat-meta">${UI.escapeHtml(meta)}</div>
      </div>
    </div>`;
  }

  function topProjectRow(p) {
    const pct = p.progress || 0;
    return `<div class="project-row">
      <div>
        <div class="name">${UI.escapeHtml(p.name)}</div>
        <div class="meta">${UI.badge(p.status)} <span style="margin-left:6px;">${pct}% complete</span></div>
        <div class="progress-bar"><div class="progress-bar-fill${pct >= 100 ? ' full' : ''}" style="width:${pct}%"></div></div>
      </div>
    </div>`;
  }

  function activityRow(a) {
    const t = (a.activity_type || 'A').slice(0, 1).toUpperCase();
    return `<div class="activity-row">
      <div class="activity-icon">${t}</div>
      <div>
        <div class="activity-name">${UI.escapeHtml(a.name)}</div>
        <div class="activity-meta">${UI.escapeHtml(a.activity_type || '')} • ${UI.fmtDate(a.activity_date)} • ${UI.escapeHtml(a.project_name || 'No project')}</div>
      </div>
      <div class="activity-count">${UI.fmtNum(a.participants_count || 0)} ppl</div>
    </div>`;
  }

  function riskRow(r) {
    return `<div class="activity-row">
      <div class="activity-icon">${UI.escapeHtml((r.risk_level || 'R').slice(0, 1))}</div>
      <div>
        <div class="activity-name">${UI.escapeHtml(r.name)} ${UI.badge(r.risk_level || 'Watch')}</div>
        <div class="activity-meta">${UI.escapeHtml(r.reason || '')}</div>
        <div class="activity-meta">Attendance ${r.attendance_pct || 0}% • Progress ${r.progress_pct || 0}% • Pending chapters ${r.pending_chapters || 0}</div>
      </div>
      <div class="activity-count">${UI.fmtNum(r.risk_score || 0)}</div>
    </div>`;
  }

  function batchHealthRow(b) {
    const score = Math.max(0, Math.min(100, b.health_score || 0));
    return `<div class="project-row">
      <div>
        <div class="name">${UI.escapeHtml(b.batch)} ${UI.badge(b.status || 'Unknown')}</div>
        <div class="meta">${score}% health • ${UI.fmtNum(b.students || 0)} students • ${UI.fmtNum(b.pending_tickets || 0)} pending tickets</div>
        <div class="progress-bar"><div class="progress-bar-fill${score >= 75 ? ' full' : ''}" style="width:${score}%"></div></div>
        <div class="meta">Attendance ${b.attendance_pct || 0}% • Course progress ${b.course_progress_pct || 0}% • Certificate eligible ${UI.fmtNum(b.certificate_eligible || 0)}</div>
      </div>
    </div>`;
  }

  function drawAttendanceChart(trend) {
    const ctx = document.getElementById('chart-attendance');
    if (!ctx) return;
    const labels = trend.map((r) => UI.fmtDate(r.attendance_date).split(' ').slice(0, 2).join(' '));
    const data = trend.map((r) => r.present_pct);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(14,157,177,0.35)');
    gradient.addColorStop(1, 'rgba(14,157,177,0.00)');

    charts.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Present %',
          data,
          borderColor: '#0E9DB1',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: '#0E9DB1',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}% present` } },
        },
        scales: {
          y: {
            beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%', color: '#6B7785' },
            grid: { color: '#EEF2F6' }
          },
          x: { ticks: { color: '#6B7785', maxRotation: 0, autoSkip: true }, grid: { display: false } },
        },
      },
    }));
  }

  function drawProjectStatusChart(rows) {
    const ctx = document.getElementById('chart-projects');
    if (!ctx) return;
    const colorMap = {
      'Active': '#16A34A',
      'Completed': '#2563EB',
      'Planned': '#0E9DB1',
      'On Hold': '#D97706',
    };
    const labels = rows.map((r) => r.status);
    const data = rows.map((r) => r.count);
    const colors = labels.map((s) => colorMap[s] || '#95A2B1');

    charts.push(new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 14, font: { size: 12 } } },
        },
      },
    }));
  }

  function drawCourseStudentChart(rows) {
    const ctx = document.getElementById('chart-courses');
    if (!ctx) return;
    const labels = rows.map((r) => r.course_name);
    const data = rows.map((r) => r.student_count);

    charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Students',
          data,
          backgroundColor: '#2DB7C7',
          borderRadius: 6,
          maxBarThickness: 28,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { color: '#6B7785', precision: 0 }, grid: { color: '#EEF2F6' } },
          y: { ticks: { color: '#6B7785' }, grid: { display: false } },
        },
      },
    }));
  }

  return { render, destroyCharts };
})();
