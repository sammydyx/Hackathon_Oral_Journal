// Submitted attempts sync to the shared classroom; unfinished drafts stay private.
(() => {
  const account = OralJournal.read();
  if (account?.role !== 'student' || !window.OJWork) return;
  const status = document.createElement('p'); status.className = 'note'; status.setAttribute('role','status');
  document.getElementById('saveStatus').after(status);
  const queue = new Map(), acknowledged = new Map(); let running = false;
  function collect(id, work) {
    if (!work.task) return;
    for (const attempt of work.attempts || []) {
      const payload = { studentEmail: account.email, studentName: document.getElementById('name').value.trim(), task:work.task, attempt };
      const serialized = JSON.stringify(payload);
      if (acknowledged.get(attempt.id) !== serialized) queue.set(attempt.id, serialized);
    }
  }
  async function sync() {
    if (running || !queue.size) return;
    running = true; status.textContent = 'Sending submitted answers to your teacher…';
    try {
      while (queue.size) {
        const [id, body] = queue.entries().next().value;
        const response = await fetch('/api/submissions', { method:'POST', headers:{'Content-Type':'application/json'}, body, signal:AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error();
        acknowledged.set(id,body); if (queue.get(id) === body) queue.delete(id);
      }
      status.textContent = 'Submitted answers synced to your teacher · ' + new Date().toLocaleTimeString();
    } catch { status.textContent = 'Teacher sync pending · Your saved answers will retry automatically. Reopen this browser to resume.'; }
    finally { running = false; }
  }
  function scan() {
    try { for(let i=0;i<localStorage.length;i++) { const key=localStorage.key(i); if(key.startsWith(OJWork.prefix)) collect(key.slice(OJWork.prefix.length), JSON.parse(localStorage.getItem(key))); } } catch {}
    sync();
  }
  window.addEventListener('oj-work-saved', e => { collect(e.detail.id,e.detail.work); sync(); });
  window.addEventListener('online',scan); window.addEventListener('focus',scan);
  setInterval(scan,5000); scan();
  if (!queue.size && !acknowledged.size) status.textContent = 'Submit an explanation to share it with your teacher. Drafts stay private.';
})();
