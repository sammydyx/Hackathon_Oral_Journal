// Browser-owned Supabase identity. Public key only; RLS isolates every row.
(async () => {
  const status = message => { document.getElementById('saveStatus').textContent = message; };
  const prefix = window.OJWork.prefix;
  const queue = new Map();
  let config, session, timer, running = false;
  const authKey = 'oj_supabase_session_v1';
  async function request(path, options = {}) {
    const response = await fetch(config.url + path, {
      ...options, signal: AbortSignal.timeout(15000), headers: {
        apikey: config.key, 'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: 'Bearer ' + session.access_token } : {}),
        ...options.headers
      }
    });
    if (!response.ok) throw new Error('Cloud request failed (' + response.status + ')');
    return response.status === 204 || response.headers.get('content-length') === '0' ? null : response.json();
  }
  async function authenticate() {
    if (session && session.expires_at * 1000 > Date.now() + 60000) return;
    const data = session?.refresh_token
      ? await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }) })
      : await request('/auth/v1/signup', { method: 'POST', body: '{}' });
    session = { ...data, expires_at: data.expires_at || Math.floor(Date.now() / 1000) + data.expires_in };
    localStorage.setItem(authKey, JSON.stringify(session));
  }
  async function sync() {
    if (!config || running) return;
    running = true;
    try {
      await authenticate();
      while (queue.size) {
        const [id, work] = queue.entries().next().value;
        status('Saved on this browser · Syncing to cloud…');
        // Immutable submissions have their own rows, making retries idempotent.
        const submissions = (work.attempts || []).map(a => ({ user_id: session.user.id,
          id: a.id, task_id: id, payload: a }));
        if (submissions.length) await request('/rest/v1/oj_submissions?on_conflict=user_id,id', {
          method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(submissions)
        });
        await request('/rest/v1/oj_task_work?on_conflict=user_id,task_id', {
          method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({ user_id: session.user.id, task_id: id, payload: work, updated_at: work.updatedAt })
        });
        if (queue.get(id) === work) queue.delete(id);
      }
      status('Saved to cloud · ' + new Date().toLocaleTimeString());
    } catch {
      status('Saved on this browser · Cloud sync unavailable; will retry when connected.');
    } finally { running = false; }
  }
  window.addEventListener('oj-work-saved', e => {
    queue.set(e.detail.id, structuredClone(e.detail.work));
    clearTimeout(timer); timer = setTimeout(sync, 700);
  });
  window.addEventListener('online', sync);
  setInterval(() => { if (queue.size) sync(); }, 15000);
  try {
    config = await fetch('/api/storage-config').then(r => r.json());
    if (!config.url || !config.key) { config = null; return; }
    session = JSON.parse(localStorage.getItem(authKey) || 'null');
    await authenticate();
    const rows = await request('/rest/v1/oj_task_work?select=task_id,payload');
    for (const row of rows) {
      const local = window.OJWork.read(row.task_id);
      // Never replace a draft typed during startup with an older cloud copy.
      if (!local.updatedAt || row.payload.updatedAt > local.updatedAt) {
        const union = new Map((local.attempts || []).map(a => [a.id, a]));
        for (const a of row.payload.attempts || []) union.set(a.id, a);
        row.payload.attempts = [...union.values()].sort((a,b) => a.at.localeCompare(b.at));
        localStorage.setItem(prefix + row.task_id, JSON.stringify(row.payload));
      }
    }
    window.OJWork.refresh();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) queue.set(key.slice(prefix.length), JSON.parse(localStorage.getItem(key)));
    }
    await sync();
  } catch { status('Saved on this browser · Cloud setup needed.'); }
})();
