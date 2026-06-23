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
      <!-- Grid 1: Primary Analytics (Graphs) -->
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

      <!-- Grid 2: Performance & Health Visuals -->
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">At-risk students</h3>
              <div class="card-subtitle">Attendance vs Progress Quadrant</div>
            </div>
          </div>
          <div class="chart-wrap" style="height: 280px; position: relative;">
            <canvas id="chart-at-risk"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Course Completion Rates</h3>
              <div class="card-subtitle">Highest completion percentage by course</div>
            </div>
          </div>
          <div>
            ${data.course_completion && data.course_completion.length
        ? data.course_completion.map(courseCompletionRow).join('')
        : '<p style="color:var(--gray-500);font-size:13px;">No course completion data yet.</p>'}
          </div>
        </div>
      </div>

      <!-- Grid 3: Urgent Support Actions -->
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Recent Tickets</h3>
              <div class="card-subtitle">Latest support requests</div>
            </div>
          </div>
          <div>
            ${data.recent_tickets && data.recent_tickets.length
        ? data.recent_tickets.map(ticketRow).join('')
        : '<p style="color:var(--gray-500);font-size:13px;">No open tickets.</p>'}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Recent Feedback</h3>
              <div class="card-subtitle">Latest ratings and comments</div>
            </div>
          </div>
          <div>
            ${data.recent_feedbacks && data.recent_feedbacks.length
        ? data.recent_feedbacks.map(feedbackRow).join('')
        : '<p style="color:var(--gray-500);font-size:13px;">No recent feedback.</p>'}
          </div>
        </div>
      </div>

      <!-- Grid 4: Operational Lists -->
      <div class="dashboard-grid">
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

      <!-- Full Width: Recent Activities Logs -->
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
    drawAtRiskChart(data.at_risk_students);
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

  function courseCompletionRow(c) {
    const pct = c.completion_pct || 0;
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
    const bg = pct >= 80 ? '#d1fae5' : pct >= 50 ? '#fef3c7' : '#fee2e2';
    const statusText = pct >= 80 ? 'Excellent' : pct >= 50 ? 'Good' : 'Needs Focus';

    return `<div class="activity-row" style="align-items: center; padding: 16px; margin-bottom: 8px; border-radius: 12px; border: 1px solid var(--gray-200); background: #fff; transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);" onmouseover="this.style.transform='translateY(-2px) scale(1.01)'; this.style.boxShadow='0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
      <div style="position: relative; width: 50px; height: 50px; flex-shrink: 0; margin-right: 16px;">
        <svg width="50" height="50" viewBox="0 0 50 50" style="transform: rotate(-90deg);">
          <circle cx="25" cy="25" r="${radius}" stroke="${bg}" stroke-width="4" fill="none" />
          <circle cx="25" cy="25" r="${radius}" stroke="${color}" stroke-width="4" fill="none" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" style="animation: drawCircle 1.2s ease-out forwards; animation-delay: 0.1s;" stroke-linecap="round">
             <animate attributeName="stroke-dashoffset" from="${circumference}" to="${offset}" dur="1.2s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </circle>
        </svg>
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: ${color};">
          ${Math.round(pct)}%
        </div>
      </div>
      <div style="flex-grow: 1;">
        <div style="font-weight: 600; font-size: 15px; color: var(--gray-800); margin-bottom: 4px; letter-spacing: -0.01em;">${UI.escapeHtml(c.course_name)}</div>
        <div style="font-size: 13px; color: var(--gray-500);">${UI.fmtNum(c.completed_count || 0)} out of ${UI.fmtNum(c.enrolled || 0)} students completed</div>
      </div>
      <div style="text-align: right; margin-left: 10px;">
        <span class="badge" style="background:${bg}; color:${color}; border: none; padding: 6px 12px; font-weight: 600; font-size: 12px; border-radius: 20px;">${statusText}</span>
      </div>
    </div>`;
  }

  function ticketRow(t) {
    const p = (t.priority || 'M').slice(0, 1).toUpperCase();
    return `<div class="activity-row" style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'" onclick="window.location.hash='#tickets'">
      <div class="activity-icon" style="background:var(--red-100);color:var(--red-600);">${p}</div>
      <div>
        <div class="activity-name">#${t.id} ${UI.escapeHtml(t.subject)}</div>
        <div class="activity-meta">${UI.escapeHtml(t.raised_by_name)} • ${UI.fmtDate(t.created_at)}</div>
      </div>
      <div class="activity-count">${UI.badge(t.status)}</div>
    </div>`;
  }

  function feedbackRow(f) {
    const r = (f.rating || 5);
    return `<div class="activity-row" style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'" onclick="window.location.hash='#feedbacks'">
      <div class="activity-icon" style="background:var(--yellow-100);color:var(--yellow-600);">★</div>
      <div>
        <div class="activity-name">${UI.escapeHtml(f.subject || 'Feedback')}</div>
        <div class="activity-meta">${UI.escapeHtml(f.provider_name)} • ${UI.fmtDate(f.created_at)}</div>
      </div>
      <div class="activity-count">${r}/5</div>
    </div>`;
  }

  function drawAtRiskChart(rows) {
    const ctx = document.getElementById('chart-at-risk');
    if (!ctx || !rows || !rows.length) {
       if (ctx) ctx.parentElement.innerHTML = '<p style="color:var(--gray-500);font-size:13px;padding:16px;">No active risk signals right now.</p>';
       return;
    }

    const data = rows.map(r => ({
      x: r.progress_pct || 0,
      y: r.attendance_pct || 0,
      r: 6,
      raw: r
    }));

    charts.push(new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'At-Risk Students',
          data,
          backgroundColor: function(context) {
            const row = context.raw?.raw;
            if (!row) return '#ef4444';
            if (row.risk_level === 'High') return '#ef4444';
            if (row.risk_level === 'Medium') return '#f59e0b';
            return '#10b981';
          },
          borderColor: '#ffffff',
          borderWidth: 1,
          hoverBackgroundColor: '#000000',
          hoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(17,24,39,0.95)',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            padding: 12,
            callbacks: {
              title: function(context) {
                const r = context[0].raw.raw;
                return r.name + ' (' + r.risk_level + ' Risk)';
              },
              label: function(context) {
                const r = context.raw.raw;
                const lines = [];
                lines.push('Progress: ' + r.progress_pct + '% | Attendance: ' + r.attendance_pct + '%');
                lines.push('Reason: ' + r.reason);
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Course Progress %', color: '#6B7785' },
            min: 0, max: 100,
            grid: { color: '#EEF2F6' }
          },
          y: {
            title: { display: true, text: 'Attendance %', color: '#6B7785' },
            min: 0, max: 100,
            grid: { color: '#EEF2F6' }
          }
        }
      }
    }));
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



  return { render, destroyCharts };
})();
