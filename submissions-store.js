import fs from 'node:fs';
import path from 'node:path';

// Shared demo classroom storage. Identity is demo-only, matching session.js.
export function submissionsAPI(req, res, url, directory, send) {
  if (url.pathname !== '/api/submissions') return false;
  return handle();
  async function handle() {
    const file = path.join(directory, 'submissions.json');
    const read = () => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch(e) { if(e.code === 'ENOENT') return []; throw e; } };
    try {
      if (req.method === 'GET') {
        const rows = read().filter(r => !url.searchParams.get('taskId') || r.task.id === url.searchParams.get('taskId'));
        return send(res, 200, { submissions: rows.sort((a,b) => b.receivedAt.localeCompare(a.receivedAt)) });
      }
      if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
      let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 200000) return send(res, 413, { error: 'Submission is too large' }); }
      let body; try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'Invalid JSON' }); }
      const { studentEmail, studentName, task, attempt } = body || {};
      const str = (v,n) => typeof v === 'string' && v.trim().length > 0 && v.length <= n;
      if (studentEmail !== 'student@oraljournal.demo' || !str(task?.id,100) || !str(task?.question,2000) ||
          !Array.isArray(task.knowledgePoints) || !task.knowledgePoints.length || task.knowledgePoints.length > 30 ||
          task.knowledgePoints.some(p => !str(p?.id,100) || !str(p?.name,500)) ||
          !str(attempt?.id,100) || !str(attempt?.transcript,50000) || !['pending','graded','failed'].includes(attempt.status) ||
          !Number.isInteger(attempt.n) || attempt.n < 1 || !Number.isFinite(Date.parse(attempt.at))) {
        return send(res, 400, { error: 'Invalid student, task or attempt' });
      }
      const result = attempt.combined || attempt.analysis;
      const pointIds = new Set(task.knowledgePoints.map(p => p.id));
      if ((attempt.status === 'graded' && !result) || (result && (
        typeof result.feedback !== 'string' || result.feedback.length > 10000 ||
        ['mentioned','missing','misconceptions'].some(k => !Array.isArray(result[k]) || result[k].length > 30 ||
          result[k].some(item => !item || !pointIds.has(item.pointId) ||
            ['quote','hint','correction'].some(field => item[field] !== undefined && (typeof item[field] !== 'string' || item[field].length > 50000))))
      ))) return send(res, 400, { error: 'Invalid feedback' });
      const rows = read(), index = rows.findIndex(r => r.studentEmail === studentEmail && r.attempt.id === attempt.id);
      const old = rows[index];
      if (old && (old.task.id !== task.id || old.attempt.transcript !== attempt.transcript)) return send(res, 409, { error: 'A submitted answer cannot be replaced' });
      // Late retries must not replace completed feedback with a pending snapshot.
      if (old && old.attempt.status !== 'pending' && attempt.status === 'pending') return send(res, 200, { submission: old });
      const row = { studentEmail, studentName: typeof studentName === 'string' ? studentName.slice(0,100) : '',
        task: { id: task.id, question: task.question, knowledgePoints: task.knowledgePoints.map(p => ({ id:p.id, name:p.name })) },
        attempt, receivedAt: old?.receivedAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (index < 0) rows.push(row); else rows[index] = row;
      fs.mkdirSync(directory, { recursive:true }); fs.writeFileSync(file + '.tmp', JSON.stringify(rows)); fs.renameSync(file + '.tmp', file);
      return send(res, index < 0 ? 201 : 200, { submission: row });
    } catch { return send(res, 500, { error: 'Could not save or load submissions. Please retry.' }); }
  }
}
