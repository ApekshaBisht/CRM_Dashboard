/* ===================================================================
   app.js — Main SPA router for Cyient Foundation CRM Dashboard

   Responsibilities:
     - Build sidebar navigation from NAV_ORDER + ICONS
     - Wire sidebar toggle (desktop collapse) and mobile menu
     - Hash-based routing (#dashboard, #projects, #students, etc.)
     - Render the dashboard via Dashboard.render(...)
     - Render every entity module as a searchable table-card with CRUD
     - Hook up the global search box, the primary "+ Add" button,
       and per-row edit/delete actions

   Globals it relies on (defined in earlier scripts):
     API     -> api.js
     UI      -> ui.js
     ENTITIES, NAV_ORDER, ICONS, STATUS_OPTIONS, opts -> configs.js
     Dashboard -> dashboard.js
   =================================================================== */
(() => {
  'use strict';

  // --- Element handles ----------------------------------------------------
  const elShell        = document.querySelector('.app-shell');
  const elNav          = document.getElementById('sidebar-nav');
  const elContent      = document.getElementById('content');
  const elPageTitle    = document.getElementById('page-title');
  const elBcSection    = document.getElementById('bc-section');
  const elSearch       = document.getElementById('global-search');
  const elPrimary      = document.getElementById('primary-action');
  const elSidebarBtn   = document.getElementById('sidebar-toggle');
  const elMobileBtn    = document.getElementById('mobile-menu');

  // --- Router state -------------------------------------------------------
  const state = {
    currentKey: null,          // active nav key
    currentRows: [],           // last fetched rows for the active entity
    searchTimer: null,         // debounce handle
    searchHandler: null,       // bound search handler we attach/remove
    primaryHandler: null,      // bound "+ Add" handler we attach/remove
  };

  // ======================================================================
  //                           SIDEBAR
  // ======================================================================

  function buildSidebar() {
    const html = NAV_ORDER.map((item) => {
      if (item.type === 'heading') {
        return `<div class="nav-heading">${UI.escapeHtml(item.label)}</div>`;
      }
      const icon = ICONS[item.icon] || '';
      const idAttr = item.id ? ` id="${item.id}"` : '';
      return `
        <button class="nav-item" data-key="${item.key}"${idAttr} type="button">
          <span class="nav-icon">${icon}</span>
          <span class="nav-label">${UI.escapeHtml(item.label)}</span>
        </button>
      `;
    }).join('');
    elNav.innerHTML = html;

    elNav.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (key === 'change_password') {
          elShell.classList.remove('mobile-open');
          return;
        }
        location.hash = `#${key}`;
        // also close the mobile sidebar after a tap
        elShell.classList.remove('mobile-open');
      });
    });
  }

  function markActiveNav(key) {
    elNav.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.key === key);
    });
  }

  // ======================================================================
  //                           ROUTING
  // ======================================================================

  function parseHash() {
    const raw = (location.hash || '').replace(/^#/, '').trim();
    if (!raw) return 'dashboard';
    if (raw === 'dashboard' || ENTITIES[raw]) return raw;
    return 'dashboard';
  }

  async function route() {
    const key = parseHash();
    state.currentKey = key;
    markActiveNav(key);

    // Reset shared topbar handlers between routes
    detachSearch();
    detachPrimaryAction();
    elSearch.value = '';

    elContent.innerHTML = `<div class="loader"><div class="spinner"></div><div>Loading…</div></div>`;

    try {
      if (key === 'dashboard') {
        // Dashboard view: no search, no add button
        elPageTitle.textContent = 'Master Board';
        elBcSection.textContent = 'Dashboard';
        elSearch.parentElement.style.visibility = 'hidden';
        elPrimary.style.display = 'none';
        await Dashboard.render(elContent);
      } else {
        const cfg = ENTITIES[key];
        elPageTitle.textContent = cfg.title;
        elBcSection.textContent = cfg.section || 'CRM';
        elSearch.parentElement.style.visibility = 'visible';
        elPrimary.style.display = '';
        elPrimary.textContent = `+ Add ${singularize(cfg.title)}`;

        attachPrimaryAction(cfg);
        attachSearch(cfg);
        await renderEntityPage(cfg);
      }
    } catch (err) {
      console.error(err);
      elContent.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <h3>Something went wrong</h3>
            <p>${UI.escapeHtml(err.message || 'Unknown error')}</p>
            <button class="btn btn-primary" onclick="location.reload()">Reload</button>
          </div>
        </div>`;
      UI.toast(err.message || 'Failed to load page', 'danger');
    }
  }

  function singularize(title) {
    // crude but reasonable for our titles
    if (title.endsWith('Management')) return title.replace(/ Management$/, '');
    if (title.endsWith('s'))          return title.slice(0, -1);
    return title;
  }

  // ======================================================================
  //                       ENTITY PAGE RENDER
  // ======================================================================

  async function renderEntityPage(cfg, query = '') {
    const params = query ? { q: query } : {};
    let rows;
    try {
      rows = await API.list(cfg.entity, params);
    } catch (err) {
      throw new Error(`Could not load ${cfg.title}: ${err.message}`);
    }
    state.currentRows = rows;

    elContent.innerHTML = `
      <div class="card table-card">
        <div class="table-toolbar">
          <div class="table-meta">
            <span class="badge badge-info">${rows.length} record${rows.length === 1 ? '' : 's'}</span>
            ${query ? `<span class="muted">filtered by “${UI.escapeHtml(query)}”</span>` : ''}
          </div>
          <div class="table-actions">
            <button class="btn btn-ghost btn-sm" id="refresh-btn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              Refresh
            </button>
          </div>
        </div>
        <div class="table-wrap">
          ${rows.length ? buildTable(cfg, rows) : UI.emptyState(
            `No ${cfg.title.toLowerCase()} yet`,
            'Click the “+ Add” button in the top right to create one.'
          )}
        </div>
      </div>
    `;

    // Refresh
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => renderEntityPage(cfg, query));
    }

    // Per-row edit / delete / custom
    elContent.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => onEdit(cfg, Number(btn.dataset.id)));
    });
    elContent.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => onDelete(cfg, Number(btn.dataset.id)));
    });
    elContent.querySelectorAll('[data-action="docs"]').forEach((btn) => {
      btn.addEventListener('click', () => onDocs(cfg, Number(btn.dataset.id)));
    });
  }

  function buildTable(cfg, rows) {
    const cols = cfg.columns;
    const head = `
      <thead>
        <tr>
          ${cols.map((c) => `<th>${UI.escapeHtml(c.label)}</th>`).join('')}
          <th class="col-actions">Actions</th>
        </tr>
      </thead>`;

    const body = `
      <tbody>
        ${rows.map((row) => `
          <tr>
            ${cols.map((c) => {
              const val = c.render ? c.render(row) : formatCell(row[c.key]);
              return `<td>${val}</td>`;
            }).join('')}
            <td class="col-actions">
              ${cfg.customActions ? cfg.customActions(row) : ''}
              <button class="btn btn-icon" title="Edit" data-action="edit" data-id="${row.id}">${ICONS.edit}</button>
              <button class="btn btn-icon btn-icon-danger" title="Delete" data-action="delete" data-id="${row.id}">${ICONS.trash}</button>
            </td>
          </tr>
        `).join('')}
      </tbody>`;

    return `<table class="data-table">${head}${body}</table>`;
  }

  function formatCell(v) {
    if (v === null || v === undefined || v === '') return '<span class="muted">—</span>';
    return UI.escapeHtml(String(v));
  }

  // ======================================================================
  //                       CRUD HANDLERS
  // ======================================================================

  async function onCreate(cfg) {
    try {
      const values = await UI.openForm({
        title: `Add ${singularize(cfg.title)}`,
        fields: cfg.fields,
      });
      if (!values) return; // cancelled
      await API.create(cfg.entity, values);
      UI.toast(`${singularize(cfg.title)} created`, 'success');
      await renderEntityPage(cfg, elSearch.value.trim());
    } catch (err) {
      UI.toast(err.message || 'Create failed', 'danger');
    }
  }

  async function onEdit(cfg, id) {
    try {
      const current = await API.get(cfg.entity, id);
      const values = await UI.openForm({
        title: `Edit ${singularize(cfg.title)} #${id}`,
        fields: cfg.fields,
        values: current,
      });
      if (!values) return;
      await API.update(cfg.entity, id, values);
      UI.toast(`${singularize(cfg.title)} updated`, 'success');
      await renderEntityPage(cfg, elSearch.value.trim());
    } catch (err) {
      UI.toast(err.message || 'Update failed', 'danger');
    }
  }

  async function onDelete(cfg, id) {
    const ok = await UI.confirmAction(
      `Delete this ${singularize(cfg.title).toLowerCase()} (#${id})? This action cannot be undone.`,
      'Delete'
    );
    if (!ok) return;
    try {
      await API.remove(cfg.entity, id);
      UI.toast(`${singularize(cfg.title)} deleted`, 'success');
      await renderEntityPage(cfg, elSearch.value.trim());
    } catch (err) {
      UI.toast(err.message || 'Delete failed', 'danger');
    }
  }

  async function onDocs(cfg, id) {
    if (cfg.entity !== 'internships') return;
    
    // Fetch internship data to see what files exist
    const current = await API.get(cfg.entity, id);
    const docs = [
      { key: 'offer_letter', label: 'Offer Letter', file: current.offer_letter_file },
      { key: 'internship_report', label: 'Internship Report', file: current.internship_report_file },
      { key: 'certificate', label: 'Certificate of Completion', file: current.certificate_file },
      { key: 'lor', label: 'Letter of Recommendation', file: current.lor_file }
    ];

    // Build modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';
    
    const html = `
      <div class="modal" style="max-width:600px;">
        <header class="modal-header">
          <h3>Manage Documents (Internship #${id})</h3>
          <button class="modal-close" title="Close">×</button>
        </header>
        <div class="modal-body" style="padding:20px;">
          <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:15px;">
            ${docs.map(d => `
              <li style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px; border-radius:6px; border:1px solid #e2e8f0;">
                <div style="flex:1;">
                  <h4 style="margin:0 0 5px; font-size:14px; color:#1e293b;">${UI.escapeHtml(d.label)}</h4>
                  ${d.file 
                    ? `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                         <span style="font-size:12px; color:var(--gray-600); max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${d.file}">📄 ${d.file}</span>
                         <div style="display:flex; gap: 4px; align-items:center;">
                           <a href="/api/internships/files/${d.file}" target="_blank" class="btn btn-sm btn-icon" title="View" style="color:var(--primary);"
                              onclick="if(!['pdf','png','jpg','jpeg','gif','svg','mp4','webm','txt'].includes('${d.file}'.split('.').pop().toLowerCase())) { alert('This file format (e.g. Word/Excel) cannot be previewed directly in the browser and will be downloaded instead.'); }">
                             <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                           </a>
                           <a href="/api/internships/files/${d.file}" download="${d.file}" class="btn btn-sm btn-icon" title="Download" style="color:var(--primary);">
                             <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                           </a>
                           <button type="button" class="btn btn-sm btn-icon btn-icon-danger" title="Delete" data-delete-doc="${d.key}">
                             <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                           </button>
                         </div>
                       </div>` 
                    : `<span style="font-size:12px; color:#94a3b8;">No file uploaded</span>`}
                </div>
                <div style="margin-left:15px;">
                  <label class="btn btn-sm btn-ghost" style="cursor:pointer;">
                    Upload / Replace
                    <input type="file" hidden accept=".pdf,.mp4,.webm,.mov,.png,.jpg,.jpeg,.ppt,.pptx,.doc,.docx" data-doc-type="${d.key}" />
                  </label>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.modal-close');
    const closeOverlay = (e) => {
      if (e.target === overlay || e.target === closeBtn) overlay.remove();
    };
    overlay.addEventListener('click', closeOverlay);

    overlay.querySelectorAll('input[type="file"]').forEach(input => {
      input.addEventListener('change', async (e) => {
        if (!input.files.length) return;
        const file = input.files[0];
        const docType = input.dataset.docType;
        const fd = new FormData();
        fd.append('file', file);
        
        UI.toast('Uploading...', 'info');
        try {
          const res = await fetch(`/api/internships/${id}/upload/${docType}`, {
            method: 'POST',
            body: fd
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          UI.toast('Upload successful', 'success');
          overlay.remove();
          onDocs(cfg, id); // refresh modal
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      });
    });

    overlay.querySelectorAll('[data-delete-doc]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const docType = btn.dataset.deleteDoc;
        const ok = await UI.confirmAction('Delete this document?', 'Delete');
        if (!ok) return;
        try {
          const res = await fetch(`/api/internships/${id}/delete/${docType}`, { method: 'POST' });
          if (!res.ok) throw new Error('Delete failed');
          UI.toast('Document deleted', 'success');
          overlay.remove();
          onDocs(cfg, id);
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      });
    });
  }

  // ======================================================================
  //                       TOPBAR HANDLERS
  // ======================================================================

  function attachPrimaryAction(cfg) {
    state.primaryHandler = () => onCreate(cfg);
    elPrimary.addEventListener('click', state.primaryHandler);
  }
  function detachPrimaryAction() {
    if (state.primaryHandler) {
      elPrimary.removeEventListener('click', state.primaryHandler);
      state.primaryHandler = null;
    }
  }

  function attachSearch(cfg) {
    state.searchHandler = () => {
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => {
        const q = elSearch.value.trim();
        renderEntityPage(cfg, q).catch((err) => UI.toast(err.message, 'danger'));
      }, 280);
    };
    elSearch.addEventListener('input', state.searchHandler);
  }
  function detachSearch() {
    if (state.searchHandler) {
      elSearch.removeEventListener('input', state.searchHandler);
      state.searchHandler = null;
    }
    clearTimeout(state.searchTimer);
  }

  // ======================================================================
  //                       SIDEBAR / MOBILE
  // ======================================================================

  function wireChrome() {
    elSidebarBtn.addEventListener('click', () => {
      elShell.classList.toggle('sidebar-collapsed');
    });
    elMobileBtn.addEventListener('click', () => {
      elShell.classList.toggle('mobile-open');
    });

    // Logout — clear the server session then go to role selection
    const logoutBtn = document.getElementById('logout-action');
    if (logoutBtn) logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (_) {}
      window.location.href = '/login';
    });

    // Change password
    const cpBtn = document.getElementById('change-pw-action');
    if (cpBtn) cpBtn.addEventListener('click', async () => {
      const v = await UI.openForm({ title: 'Change Password', fields: [
        { key: 'current_password', label: 'Current Password', type: 'password', required: true, full: true },
        { key: 'new_password', label: 'New Password', type: 'password', required: true, full: true },
        { key: 'confirm_password', label: 'Confirm New Password', type: 'password', required: true, full: true },
      ] });
      if (!v) return;
      if (v.new_password !== v.confirm_password) { UI.toast('New passwords do not match', 'danger'); return; }
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_password: v.current_password, new_password: v.new_password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        UI.toast('Password updated successfully', 'success');
      } catch (err) { UI.toast(err.message, 'danger'); }
    });

    // Close mobile sidebar when clicking outside on small screens
    document.addEventListener('click', (e) => {
      if (window.innerWidth >= 900) return;
      if (!elShell.classList.contains('mobile-open')) return;
      const sidebar = document.getElementById('sidebar');
      if (!sidebar.contains(e.target) && !elMobileBtn.contains(e.target)) {
        elShell.classList.remove('mobile-open');
      }
    });

    // Notifications
    const notifBtn = document.getElementById('notifications-action');
    if (notifBtn) {
      notifBtn.addEventListener('click', async () => {
        // Clear badge when opened and store read timestamp
        const badge = document.getElementById('notif-badge');
        if (badge) badge.hidden = true;
        localStorage.setItem('lastReadNotifsTime', Date.now());

        const overlay = document.createElement('div');
        overlay.className = 'modal-backdrop';
        overlay.innerHTML = `
          <div class="modal" style="max-width: 500px;">
            <header class="modal-header">
              <h3>Notifications</h3>
              <button class="modal-close" title="Close">×</button>
            </header>
            <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
              <div id="notif-loading" style="text-align: center; color: var(--gray-500);">Loading...</div>
              <ul id="notif-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px;"></ul>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);

        const closeBtn = overlay.querySelector('.modal-close');
        const closeOverlay = (e) => {
          if (e.target === overlay || e.target === closeBtn) overlay.remove();
        };
        overlay.addEventListener('click', closeOverlay);

        try {
          const [tickets, feedbacks] = await Promise.all([
            API.list('tickets'),
            API.list('feedbacks')
          ]);

          const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
          const pendingFeedbacks = feedbacks.filter(f => f.status === 'Pending');

          const items = [];
          openTickets.forEach(t => {
            items.push({
              title: `Ticket: ${t.subject}`,
              desc: `Raised by ${t.raised_by_name} (${t.priority} priority)`,
              time: t.id,
              icon: '🎫'
            });
          });
          pendingFeedbacks.forEach(f => {
            items.push({
              title: `Feedback: ${f.subject}`,
              desc: `From ${f.provider_name} (Rating: ${f.rating})`,
              time: f.id,
              icon: '📝'
            });
          });

          items.sort((a, b) => b.time - a.time);

          overlay.querySelector('#notif-loading').remove();
          const list = overlay.querySelector('#notif-list');

          if (items.length === 0) {
            list.innerHTML = `<li style="text-align: center; color: var(--gray-500); padding: 20px;">No new notifications</li>`;
          } else {
            list.innerHTML = items.map(item => `
              <li style="padding: 12px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; gap: 12px; align-items: flex-start;">
                <div>
                  <div style="font-weight: 600; font-size: 14px; color: #1e293b;">${UI.escapeHtml(item.title)}</div>
                  <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${UI.escapeHtml(item.desc)}</div>
                </div>
              </li>
            `).join('');
          }
        } catch (err) {
          const loader = overlay.querySelector('#notif-loading');
          if (loader) loader.textContent = 'Failed to load notifications.';
        }
      });
    }
  }

  async function updateNotifBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    try {
      const [tickets, feedbacks] = await Promise.all([
        API.list('tickets'),
        API.list('feedbacks')
      ]);
      const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
      const pendingFeedbacks = feedbacks.filter(f => f.status === 'Pending');
      const allItems = [...openTickets, ...pendingFeedbacks];
      
      const lastRead = localStorage.getItem('lastReadNotifsTime');
      let unreadCount = 0;
      
      if (!lastRead) {
        unreadCount = allItems.length;
      } else {
        const readTime = parseInt(lastRead, 10);
        unreadCount = allItems.filter(item => {
          if (!item.created_at) return true; // if no timestamp, assume unread
          const itemTime = new Date(item.created_at.replace(' ', 'T') + 'Z').getTime();
          return itemTime > readTime;
        }).length;
      }
      
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    } catch (err) {
      // ignore
    }
  }

  // ======================================================================
  //                       BOOTSTRAP
  // ======================================================================

  function init() {
    buildSidebar();
    wireChrome();
    updateNotifBadge();
    window.addEventListener('hashchange', route);
    route(); // initial paint
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
