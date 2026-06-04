/* ===================================================================
   UI helpers: toasts, modal form builder, confirmation dialog,
   badge rendering, HTML escaping.
   =================================================================== */
const UI = (() => {

  // ---------- escape ----------
  const escapeHtml = (s) => {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  };

  // ---------- toast ----------
  function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 250);
    }, duration);
  }

  // ---------- confirm ----------
  function confirmAction(message, okLabel = 'Delete') {
    return new Promise((resolve) => {
      const back = document.getElementById('confirm-backdrop');
      const body = document.getElementById('confirm-body');
      const ok   = document.getElementById('confirm-ok');
      const cancel = document.getElementById('confirm-cancel');
      body.textContent = message;
      ok.textContent = okLabel;
      back.hidden = false;

      const cleanup = () => {
        back.hidden = true;
        ok.removeEventListener('click', onOk);
        cancel.removeEventListener('click', onCancel);
        back.removeEventListener('click', onBack);
      };
      const onOk     = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };
      const onBack   = (e) => { if (e.target === back) onCancel(); };

      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
      back.addEventListener('click', onBack);
    });
  }

  // ---------- badge ----------
  // Pick a colour class for a status string.
  function badgeClassFor(status) {
    if (!status) return 'badge-neutral';
    const s = String(status).toLowerCase();
    if (['active', 'present', 'completed', 'in progress'].includes(s)) return 'badge-success';
    if (['planned', 'scheduled'].includes(s)) return 'badge-info';
    if (['on hold', 'on leave', 'half-day', 'late', 'pending'].includes(s)) return 'badge-warning';
    if (['inactive', 'absent', 'dropped', 'cancelled'].includes(s)) return 'badge-danger';
    if (['excused'].includes(s)) return 'badge-purple';
    return 'badge-neutral';
  }
  const badge = (text) =>
    `<span class="badge ${badgeClassFor(text)}">${escapeHtml(text || '—')}</span>`;

  // ---------- modal form ----------
  // Open a form modal. config.fields = [{key,label,type,options?,required?,full?,placeholder?,min?,max?,step?}]
  // Returns a Promise that resolves with the submitted form values, or null if cancelled.
  function openForm({ title, fields, values = {} }) {
    return new Promise(async (resolve) => {
      const back   = document.getElementById('modal-backdrop');
      const titleEl = document.getElementById('modal-title');
      const wrap   = document.getElementById('modal-fields');
      const form   = document.getElementById('modal-form');
      const close  = document.getElementById('modal-close');
      const cancel = document.getElementById('modal-cancel');

      titleEl.textContent = title;
      wrap.innerHTML = '';

      // Build fields. Resolve any async option providers first.
      const resolvedFields = await Promise.all(fields.map(async (f) => {
        if (typeof f.options === 'function') f = { ...f, options: await f.options() };
        return f;
      }));

      resolvedFields.forEach((f) => {
        const value = values[f.key] !== undefined && values[f.key] !== null ? values[f.key] : '';
        const wrapper = document.createElement('div');
        wrapper.className = 'field' + (f.full ? ' field-full' : '');
        wrapper.dataset.key = f.key;

        const labelHtml = `<label for="f-${f.key}">${escapeHtml(f.label)}${f.required ? '<span class="req">*</span>' : ''}</label>`;
        let inputHtml = '';

        const placeholder = f.placeholder ? ` placeholder="${escapeHtml(f.placeholder)}"` : '';

        if (f.type === 'textarea') {
          inputHtml = `<textarea id="f-${f.key}" name="${f.key}"${placeholder}>${escapeHtml(value)}</textarea>`;
        } else if (f.type === 'select') {
          const options = (f.options || []).map((o) => {
            const optVal = (typeof o === 'object') ? o.value : o;
            const optLab = (typeof o === 'object') ? o.label : o;
            const sel = String(optVal) === String(value) ? ' selected' : '';
            return `<option value="${escapeHtml(optVal)}"${sel}>${escapeHtml(optLab)}</option>`;
          }).join('');
          const placeholderOpt = f.required ? '' : `<option value="">— select —</option>`;
          inputHtml = `<select id="f-${f.key}" name="${f.key}">${placeholderOpt}${options}</select>`;
        } else {
          const type = f.type || 'text';
          const extras = [
            f.min !== undefined ? ` min="${f.min}"` : '',
            f.max !== undefined ? ` max="${f.max}"` : '',
            f.step !== undefined ? ` step="${f.step}"` : '',
          ].join('');
          inputHtml = `<input id="f-${f.key}" name="${f.key}" type="${type}" value="${escapeHtml(value)}"${placeholder}${extras} />`;
        }

        wrapper.innerHTML = `${labelHtml}${inputHtml}<div class="error-text">Required</div>`;
        wrap.appendChild(wrapper);
      });

      back.hidden = false;
      // focus first field
      const firstInput = wrap.querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();

      const cleanup = () => {
        back.hidden = true;
        form.removeEventListener('submit', onSubmit);
        close.removeEventListener('click', onCancel);
        cancel.removeEventListener('click', onCancel);
        back.removeEventListener('click', onBack);
      };

      const onSubmit = (e) => {
        e.preventDefault();
        // gather values + validate
        const out = {};
        let valid = true;
        resolvedFields.forEach((f) => {
          const fieldEl = wrap.querySelector(`[data-key="${f.key}"]`);
          const el = fieldEl.querySelector('input, select, textarea');
          let v = el.value;
          if (f.type === 'number') {
            v = v === '' ? null : Number(v);
            if (v !== null && Number.isNaN(v)) v = null;
          }
          if (f.required && (v === '' || v === null || v === undefined)) {
            fieldEl.classList.add('has-error');
            valid = false;
          } else {
            fieldEl.classList.remove('has-error');
          }
          out[f.key] = v === '' ? null : v;
        });
        if (!valid) return;
        cleanup();
        resolve(out);
      };

      const onCancel = () => { cleanup(); resolve(null); };
      const onBack   = (e) => { if (e.target === back) onCancel(); };

      form.addEventListener('submit', onSubmit);
      close.addEventListener('click', onCancel);
      cancel.addEventListener('click', onCancel);
      back.addEventListener('click', onBack);
    });
  }

  // ---------- formatters ----------
  const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtCurrency = (n) => {
    if (n === null || n === undefined || n === '') return '—';
    const v = Number(n);
    if (Number.isNaN(v)) return n;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  };

  const fmtNum = (n) => {
    if (n === null || n === undefined || n === '') return '—';
    return new Intl.NumberFormat('en-IN').format(Number(n));
  };

  // ---------- skeleton helpers ----------
  function loader() {
    return `<div class="loader"><div class="spinner"></div><div>Loading…</div></div>`;
  }

  function emptyState(title, message) {
    return `<div class="empty-state">
      <div class="icon">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M8 4v6"/>
        </svg>
      </div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
    </div>`;
  }

  return {
    escapeHtml, toast, confirmAction, badge, openForm,
    fmtDate, fmtCurrency, fmtNum, loader, emptyState,
  };
})();
