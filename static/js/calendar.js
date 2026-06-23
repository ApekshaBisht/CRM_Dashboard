/* ===================================================================
   calendar.js — Monthly calendar view for Cyient Foundation CRM
   =================================================================== */
const Calendar = (() => {
  'use strict';

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const DAYS_SHORT = ['S','M','T','W','T','F','S'];

  const TYPE_COLORS = {
    assignment:  { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    activity:    { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    attendance:  { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  };

  let refreshTimer = null;
  let todayTickTimer = null;
  let resizeHandler = null;
  let destroyed = false;

  function render(container, opts = {}) {
    destroyed = false;
    const state = {
      year: opts.year || new Date().getFullYear(),
      month: opts.month || new Date().getMonth(),
      events: [],
      loading: true,
    };

    function dateStr(y, m, d) {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    function getMonthRange(y, m) {
      const start = dateStr(y, m, 1);
      const lastDay = new Date(y, m + 1, 0).getDate();
      const end = dateStr(y, m, lastDay);
      return { start, end };
    }

    function eventsForDay(y, m, d) {
      const ds = dateStr(y, m, d);
      return state.events.filter(e => e.date === ds);
    }

    function todayStr() {
      const n = new Date();
      return dateStr(n.getFullYear(), n.getMonth(), n.getDate());
    }

    function isMobile() {
      return window.innerWidth <= 768;
    }

    function isTiny() {
      return window.innerWidth <= 480;
    }

    async function fetchEvents() {
      const { start, end } = getMonthRange(state.year, state.month);
      state.loading = true;
      draw();
      try {
        state.events = await API.request(`/api/calendar?start=${start}&end=${end}`);
      } catch (err) {
        console.error('Calendar fetch error:', err);
        state.events = [];
      }
      state.loading = false;
      if (!destroyed) draw();
    }

    function chooseEventType(ds) {
      return new Promise((resolve) => {
        const wrap = document.createElement('div');
        wrap.className = 'modal-backdrop';
        wrap.style.zIndex = '9999';
        wrap.innerHTML = `
          <div class="modal">
            <header class="modal-header">
              <h2 class="modal-title">Create Event on ${UI.fmtDate(ds)}</h2>
              <button class="btn btn-ghost" id="choose-close">&times;</button>
            </header>
            <div class="modal-body" style="display:flex;gap:1rem;padding:2rem;">
              <button class="btn btn-primary" id="btn-assignment" style="flex:1;padding:1rem;">Chapter Assignment</button>
              <button class="btn btn-secondary" id="btn-activity" style="flex:1;padding:1rem;">Activity</button>
            </div>
          </div>
        `;
        document.body.appendChild(wrap);

        const cleanup = (val) => {
          if (document.body.contains(wrap)) document.body.removeChild(wrap);
          resolve(val);
        };

        wrap.querySelector('#choose-close').onclick = () => cleanup(null);
        wrap.querySelector('#btn-assignment').onclick = () => cleanup('assignment');
        wrap.querySelector('#btn-activity').onclick = () => cleanup('activity');
        wrap.onclick = (e) => { if (e.target === wrap) cleanup(null); };
      });
    }

    async function handleDayClick(ds) {
      const canManage = !window.PORTAL || window.PORTAL.role === 'trainer' || window.PORTAL.role === 'superadmin';
      if (!canManage) return;

      const eventType = await chooseEventType(ds);
      if (!eventType) return;

      if (eventType === 'assignment') {
        try {
          const chapters = await API.list('chapters');
          const trainers = await API.list('trainers');
          
          const v = await UI.openForm({
            title: 'New Chapter Assignment',
            fields: [
              { key: 'chapter_id', label: 'Chapter', type: 'select', options: chapters.map(c => ({ value: c.id, label: c.name })), required: true },
              { key: 'trainer_id', label: 'Trainer', type: 'select', options: trainers.map(t => ({ value: t.id, label: t.name })), required: true },
              { key: 'batch', label: 'Batch', required: true },
              { key: 'scheduled_date', label: 'Date', type: 'date', required: true, full: true }
            ],
            values: { scheduled_date: ds }
          });

          if (!v) return;
          
          await API.create('chapter_assignments', v);
          UI.toast('Assignment created', 'success');
          fetchEvents();
        } catch (err) {
          UI.toast(err.message || 'Failed to create assignment', 'danger');
        }
      } else if (eventType === 'activity') {
        try {
          const projects = await API.list('projects');
          const v = await UI.openForm({
            title: 'New Activity',
            fields: [
              { key: 'name', label: 'Activity Name', required: true },
              { key: 'activity_type', label: 'Type', type: 'select', options: [
                  {value: 'Classroom', label: 'Classroom'}, {value: 'Practical', label: 'Practical'},
                  {value: 'Workshop', label: 'Workshop'}, {value: 'Hackathon', label: 'Hackathon'},
                  {value: 'CSR', label: 'CSR'}, {value: 'Event', label: 'Event'}
                ], required: true },
              { key: 'project_id', label: 'Project', type: 'select', options: projects.map(p => ({ value: p.id, label: p.name })) },
              { key: 'activity_date', label: 'Date', type: 'date', required: true, full: true },
              { key: 'location', label: 'Location' },
              { key: 'description', label: 'Description', full: true },
              { key: 'participants_count', label: 'Participants', type: 'number' }
            ],
            values: { activity_date: ds, activity_type: 'Classroom', participants_count: 0 }
          });

          if (!v) return;
          await API.create('activities', v);
          UI.toast('Activity created', 'success');
          fetchEvents();
        } catch (err) {
          UI.toast(err.message || 'Failed to create activity', 'danger');
        }
      }
    }

    async function handleEventClick(rawId, type) {
      const canManage = !window.PORTAL || window.PORTAL.role === 'trainer' || window.PORTAL.role === 'superadmin';
      const ev = state.events.find(e => String(e.raw_id) === String(rawId) && e.type === type);
      if (!ev) return;

      if (canManage && (type === 'assignment' || type === 'activity')) {
        const ok = await UI.confirmAction(`Delete ${type} "${ev.title}" on ${ev.date}?`, 'Delete');
        if (ok) {
          try {
            const endpoint = type === 'assignment' ? 'chapter_assignments' : 'activities';
            await API.remove(endpoint, rawId);
            UI.toast(`${type === 'assignment' ? 'Assignment' : 'Activity'} deleted`, 'success');
            fetchEvents();
          } catch (err) {
            UI.toast(err.message || 'Failed to delete event', 'danger');
          }
        }
      }
    }


    function prevMonth() {
      state.month--;
      if (state.month < 0) { state.month = 11; state.year--; }
      fetchEvents();
    }

    function nextMonth() {
      state.month++;
      if (state.month > 11) { state.month = 0; state.year++; }
      fetchEvents();
    }

    function goToday() {
      const now = new Date();
      state.year = now.getFullYear();
      state.month = now.getMonth();
      fetchEvents();
    }

    function renderAgenda() {
      const today = todayStr();
      const allDays = [];
      const firstDay = new Date(state.year, state.month, 1).getDay();
      const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const ds = dateStr(state.year, state.month, d);
        const dayEvents = eventsForDay(state.year, state.month, d);
        if (dayEvents.length === 0) continue;
        const dayName = DAYS[new Date(state.year, state.month, d).getDay()];
        const isT = ds === today;
        const evHtml = dayEvents.map(ev => {
          const c = TYPE_COLORS[ev.type] || TYPE_COLORS.assignment;
          return `<div class="cal-agenda-event" style="background:${c.bg};border-left:3px solid ${c.border};color:${c.text}">${UI.escapeHtml(ev.title)}</div>`;
        }).join('');
        allDays.push(`
          <div class="cal-agenda-day${isT ? ' cal-today' : ''}">
            <div class="cal-agenda-date">
              <div class="cal-agenda-daynum">${d}</div>
              <div class="cal-agenda-dayname">${dayName}</div>
            </div>
            <div class="cal-agenda-events">${evHtml}</div>
          </div>`);
      }

      if (allDays.length === 0) {
        return `<div class="cal-agenda-empty">No events this month</div>`;
      }
      return allDays.join('');
    }

    function draw() {
      const now = new Date();
      const tStr = todayStr();
      const isTinyScreen = isTiny();
      const dayLabels = isTinyScreen ? DAYS_SHORT : DAYS;

      let dayCells = '';
      if (!isTinyScreen) {
        const firstDay = new Date(state.year, state.month, 1).getDay();
        const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
          dayCells += `<div class="cal-day cal-day-empty"></div>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
          const ds = dateStr(state.year, state.month, d);
          const isToday = ds === tStr;
          const dayEvents = eventsForDay(state.year, state.month, d);
          const maxShow = isMobile() ? 2 : 3;
          const evHtml = dayEvents.slice(0, maxShow).map(ev => {
            const c = TYPE_COLORS[ev.type] || TYPE_COLORS.assignment;
            const dataAttrs = ev.raw_id ? `data-id="${ev.raw_id}" data-type="${ev.type}"` : '';
            return `<div class="cal-event" ${dataAttrs} style="background:${c.bg};border-left:3px solid ${c.border};color:${c.text};cursor:pointer;" title="${UI.escapeHtml(ev.title)} — ${UI.escapeHtml(ev.detail || '')}">${UI.escapeHtml(ev.title)}</div>`;
          }).join('');
          const more = dayEvents.length > maxShow ? `<div class="cal-more">+${dayEvents.length - maxShow} more</div>` : '';

          dayCells += `
            <div class="cal-day${isToday ? ' cal-today' : ''}" data-date="${ds}">
              <div class="cal-day-num">${d}</div>
              <div class="cal-day-events">${evHtml}${more}</div>
            </div>`;
        }
      }

      const clockHtml = `<span class="cal-clock" id="cal-clock">${now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>`;

      container.innerHTML = `
        <div class="cal-wrapper">
          <div class="cal-header">
            <button class="btn btn-ghost cal-nav" id="cal-prev" aria-label="Previous month">&larr;</button>
            <div class="cal-title">
              <h2>${MONTHS[state.month]} ${state.year}</h2>
              ${clockHtml}
              <button class="btn btn-ghost btn-sm" id="cal-today">Today</button>
            </div>
            <button class="btn btn-ghost cal-nav" id="cal-next" aria-label="Next month">&rarr;</button>
          </div>
          <div class="cal-legend">
            <span class="cal-legend-item"><span class="cal-dot" style="background:#3b82f6"></span> Assignment</span>
            <span class="cal-legend-item"><span class="cal-dot" style="background:#f59e0b"></span> Activity</span>
            <span class="cal-legend-item"><span class="cal-dot" style="background:#10b981"></span> Attendance</span>
          </div>
          ${isTinyScreen
            ? `<div class="cal-agenda">${renderAgenda()}</div>`
            : `<div class="cal-grid">
                ${dayLabels.map(d => `<div class="cal-day-header">${d}</div>`).join('')}
                ${dayCells}
              </div>`
          }
          ${state.loading ? '<div class="loader"><div class="spinner"></div></div>' : ''}
        </div>`;

      document.getElementById('cal-prev').addEventListener('click', prevMonth);
      document.getElementById('cal-next').addEventListener('click', nextMonth);
      document.getElementById('cal-today').addEventListener('click', goToday);

      // Add click listener for interactivity
      container.addEventListener('click', (e) => {
        const evEl = e.target.closest('.cal-event');
        if (evEl && evEl.dataset.type) {
          e.stopPropagation();
          handleEventClick(evEl.dataset.id, evEl.dataset.type);
          return;
        }
        
        const dayEl = e.target.closest('.cal-day');
        if (dayEl && dayEl.dataset.date) {
          handleDayClick(dayEl.dataset.date);
        }
      });
    }

    function updateClock() {
      const el = document.getElementById('cal-clock');
      if (el) {
        el.textContent = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      }
      const todayEl = document.querySelector('.cal-today .cal-day-num');
      if (todayEl) {
        const now = new Date();
        const currentToday = dateStr(now.getFullYear(), now.getMonth(), now.getDate());
        const displayedMonth = state.month;
        const displayedYear = state.year;
        if (now.getMonth() !== displayedMonth || now.getFullYear() !== displayedYear) {
          goToday();
        }
      }
    }

    clearInterval(refreshTimer);
    clearInterval(todayTickTimer);
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    refreshTimer = setInterval(() => {
      if (!destroyed) fetchEvents();
    }, 5 * 60 * 1000);
    todayTickTimer = setInterval(updateClock, 30000);

    resizeHandler = () => { if (!destroyed) draw(); };
    window.addEventListener('resize', resizeHandler);

    fetchEvents();
  }

  function destroy() {
    destroyed = true;
    clearInterval(refreshTimer);
    clearInterval(todayTickTimer);
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  }

  return { render, destroy };
})();
