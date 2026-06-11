/* ===================================================================
   API helper — wraps fetch with JSON, error handling, and a query
   builder. Single source of truth for talking to the Flask backend.
   =================================================================== */
const API = (() => {
  const BASE = '';   // same origin

  async function request(path, opts = {}) {
    const init = {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

    let res;
    try {
      res = await fetch(BASE + path, init);
    } catch (err) {
      throw new Error('Network error: ' + err.message);
    }

    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); }
      catch { data = { raw: text }; }
    }

    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  function qs(params) {
    if (!params) return '';
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v);
    });
    const s = q.toString();
    return s ? '?' + s : '';
  }

  return {
    list:   (entity, params)        => request(`/api/${entity}${qs(params)}`),
    get:    (entity, id)            => request(`/api/${entity}/${id}`),
    create: (entity, body)          => request(`/api/${entity}`, { method: 'POST',   body }),
    update: (entity, id, body)      => request(`/api/${entity}/${id}`, { method: 'PUT', body }),
    remove: (entity, id)            => request(`/api/${entity}/${id}`, { method: 'DELETE' }),
    dashboard:                      () => request('/api/dashboard'),
    options: (entity)               => request(`/api/options/${entity}`),
  };
})();
