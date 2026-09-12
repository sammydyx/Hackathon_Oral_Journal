(() => {
  const section = document.createElement('section'); section.className='card';
  section.innerHTML='<h2>Student submissions</h2><p>Submitted explanations and formative feedback from this classroom.</p><label>Task <select aria-label="Filter student submissions by task"></select></label> <button type="button" class="outline">Refresh submissions</button><p role="status"></p><div class="submission-list"></div>';
  document.querySelector('#assignments-view').prepend(section);
  const select=section.querySelector('select'), status=section.querySelector('[role="status"]'), list=section.querySelector('.submission-list');
  let rows=[], busy=false, snapshot='';
  const node=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
  function render() {
    const expanded=new Set([...list.querySelectorAll('details[open]')].map(d=>d.dataset.id));
    const shown=rows.filter(r=>!select.value||r.task.id===select.value);
    list.replaceChildren(...shown.map(row=>{
      const a=row.attempt, result=a.combined||a.analysis, details=document.createElement('details'); details.className='attempt'; details.dataset.id=a.id; details.open=expanded.has(a.id);
      details.append(node('summary',`${row.studentName || row.studentEmail} · ${row.task.question} · Attempt ${a.n}`));
      details.append(node('p',`${row.studentEmail} · Submitted ${new Date(a.at).toLocaleString()}`));
      const answer=node('p',a.transcript);answer.style.whiteSpace='pre-wrap';answer.style.overflowWrap='anywhere';details.append(node('h3','Student answer'),answer);
      if(result) {
        details.append(node('p',`${result.mentioned.length}/${row.task.knowledgePoints.length} ideas expressed · ${result.mode==='ai'?'AI feedback':'Offline keyword check'} · Formative feedback`),node('p',result.feedback));
        const points=new Map(row.task.knowledgePoints.map(p=>[p.id,p.name]));const ul=document.createElement('ul');
        for(const [key,label] of [['mentioned','Expressed'],['missing','Not yet'],['misconceptions','Check idea']]) for(const item of result[key]) ul.append(node('li',`${label}: ${points.get(item.pointId)||item.pointId} — ${item.quote||item.hint||''}${item.correction?' · '+item.correction:''}`));
        details.append(ul);
      } else details.append(node('p',a.status==='failed'?'Answer received · Feedback unavailable.':'Answer received · Feedback is being prepared.'));
      return details;
    }));
    if(!shown.length) list.append(node('p','No submitted answers yet. Student submissions will appear here automatically.'));
  }
  async function refresh() {
    if(busy)return;busy=true;
    try {
      const response=await fetch('/api/submissions',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error();
      const data=await response.json();const next=JSON.stringify(data.submissions);
      if(next!==snapshot) {
        snapshot=next;rows=data.submissions;const selected=select.value;
        select.replaceChildren(new Option('All tasks',''),...[...new Map(rows.map(r=>[r.task.id,r.task.question]))].map(([id,title])=>new Option(title,id)));
        select.value=[...select.options].some(o=>o.value===selected)?selected:'';render();
      }
      status.textContent=`${rows.length} submitted attempt${rows.length === 1 ? "" : "s"} · Updated ${new Date().toLocaleTimeString()} · Checks every 5 seconds`;
    } catch {status.textContent='Could not refresh submissions. Showing the last loaded answers; retrying automatically.';}
    finally {busy=false;}
  }
  select.onchange=render;section.querySelector('button').onclick=refresh;
  window.addEventListener('focus',refresh);setInterval(()=>{if(!document.hidden)refresh();},5000);refresh();
})();
