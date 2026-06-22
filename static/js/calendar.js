/* ===================================================================
   calendar.js — Monthly calendar view for Cyient Foundation CRM
   =================================================================== */
const Calendar = (() => {
  'use strict';

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const TYPE_COLORS = {
    assignment:  { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    activity:    { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    attendance:  { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  };

  function render(container, opts = {}) {
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
      draw();
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

    function today() {
      const now = new Date();
      state.year = now.getFullYear();
      state.month = now.getMonth();
      fetchEvents();
    }

    function draw() {
      const firstDay = new Date(state.year, state.month, 1).getDay();
      const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
      const todayStr = dateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

      let dayCells = '';
      // empty cells before month starts
      for (let i = 0; i < firstDay; i++) {
        dayCells += `<div class="cal-day cal-day-empty"></div>`;
      }
      // day cells
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = dateStr(state.year, state.month, d);
        const isToday = ds === todayStr;
        const dayEvents = eventsForDay(state.year, state.month, d);
        const evHtml = dayEvents.slice(0, 3).map(ev => {
          const c = TYPE_COLORS[ev.type] || TYPE_COLORS.assignment;
          return `<div class="cal-event" style="background:${c.bg};border-left:3px solid ${c.border};color:${c.text}" title="${UI.escapeHtml(ev.title)} — ${UI.escapeHtml(ev.detail || '')}">${UI.escapeHtml(ev.title)}</div>`;
        }).join('');
        const more = dayEvents.length > 3 ? `<div class="cal-more">+${dayEvents.length - 3} more</div>` : '';

        dayCells += `
          <div class="cal-day${isToday ? ' cal-today' : ''}">
            <div class="cal-day-num">${d}</div>
            <div class="cal-day-events">${evHtml}${more}</div>
          </div>`;
      }

      container.innerHTML = `
        <div class="cal-wrapper">
          <div class="cal-header">
            <button class="btn btn-ghost cal-nav" id="cal-prev">&larr;</button>
            <div class="cal-title">
              <h2>${MONTHS[state.month]} ${state.year}</h2>
              <button class="btn btn-ghost btn-sm" id="cal-today">Today</button>
            </div>
            <button class="btn btn-ghost cal-nav" id="cal-next">&rarr;</button>
          </div>
          <div class="cal-legend">
            <span class="cal-legend-item"><span class="cal-dot" style="background:#3b82f6"></span> Assignment</span>
            <span class="cal-legend-item"><span class="cal-dot" style="background:#f59e0b"></span> Activity</span>
            <span class="cal-legend-item"><span class="cal-dot" style="background:#10b981"></span> Attendance</span>
          </div>
          <div class="cal-grid">
            ${DAYS.map(d => `<div class="cal-day-header">${d}</div>`).join('')}
            ${dayCells}
          </div>
          ${state.loading ? '<div class="loader"><div class="spinner"></div></div>' : ''}
        </div>`;

      document.getElementById('cal-prev').addEventListener('click', prevMonth);
      document.getElementById('cal-next').addEventListener('click', nextMonth);
      document.getElementById('cal-today').addEventListener('click', today);
    }

    fetchEvents();
  }

  return { render };
})();
