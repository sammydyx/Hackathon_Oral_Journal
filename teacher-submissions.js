(() => {
  const section=document.createElement('section');section.id='submissions-view';section.hidden=true;
  section.innerHTML=`<style>
  #submissions-view .sub-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:26px 0}
  #submissions-view .sub-metric{padding:20px 24px;background:#fff;border:1px solid var(--line);border-radius:12px}
  #submissions-view .sub-metric b{display:block;font-size:30px;margin-top:10px;letter-spacing:-1px}#submissions-view .sub-metric span{font-size:12px;color:var(--muted)}
  #submissions-view .sub-toolbar{display:flex;gap:14px;flex-wrap:wrap;padding:20px;border-bottom:1px solid var(--line);align-items:end}
  #submissions-view label{display:grid;gap:7px;font-size:11px;font-weight:700;color:var(--muted)}
  #submissions-view input,#submissions-view select{font:inherit;font-size:13px;color:var(--ink);background:#fff;border:1px solid #d8e0e4;border-radius:8px;padding:10px 12px;max-width:100%;min-width:150px}
  #submissions-view .sub-search{flex:1}#submissions-view .sub-task{flex:1.3;min-width:180px}
  #submissions-view .sub-table{padding:0;overflow:hidden}#submissions-view .sub-scroll{overflow-x:auto}#submissions-view table{min-width:760px}#submissions-view th{background:#f9faf9;padding:14px 20px;font-size:10px;text-transform:uppercase;letter-spacing:.7px}#submissions-view td{padding:22px 20px;vertical-align:middle}
  #submissions-view tbody tr:hover{background:#f7faf9}#submissions-view .sub-person{display:flex;align-items:center;gap:12px}
  #submissions-view .sub-avatar{flex-shrink:0;width:42px;height:42px;border-radius:50%;background:#e5efed;color:#27685f;display:grid;place-items:center;font-size:13px;font-weight:750}
  #submissions-view small{display:block;color:var(--muted);font-size:11px;line-height:1.6;margin-top:4px}#submissions-view .sub-person b{font-size:13px}
  #submissions-view .sub-badge{display:inline-flex;gap:6px;align-items:center;padding:5px 9px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;background:#edf5ef;color:#277454}#submissions-view .sub-badge.waiting{background:#f1f2f4;color:#727c84}
  #submissions-view progress{display:block;width:100px;height:5px;accent-color:#278276;margin-top:8px}#submissions-view .sub-footer{padding:14px 20px;color:var(--muted);font-size:11px}
  #submissions-view .sub-detail-head{display:flex;gap:16px;align-items:center;margin:24px 0}#submissions-view .sub-detail-head .sub-avatar{width:56px;height:56px;font-size:18px}
  #submissions-view .sub-attempt{margin-bottom:16px}#submissions-view .sub-attempt h2{font-size:16px;margin:0}#submissions-view .sub-answer{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.8;background:#f6f8f7;border-left:3px solid #90b9aa;padding:20px;margin:20px 0}
  #submissions-view .sub-feedback{font-size:13px;line-height:1.7}#submissions-view .sub-feedback li{padding:5px 0}#submissions-view .sub-empty{text-align:center;padding:40px;color:var(--muted)}
  #submissions-view button:focus-visible,#submissions-view input:focus-visible,#submissions-view select:focus-visible{outline:3px solid #78b6ad;outline-offset:3px}
  @media(max-width:700px){#submissions-view .sub-metrics{gap:8px}#submissions-view .sub-metric{padding:14px}#submissions-view .sub-metric b{font-size:24px}#submissions-view .sub-toolbar{flex-direction:column;align-items:stretch}}
  </style><div class="sub-overview"><div class="top"><div><h1>Student submissions</h1><p class="subtitle">See who has submitted. Take a closer look at their thinking.</p></div><button class="outline sub-refresh">↻ Refresh</button></div>
  <div class="sub-metrics"></div><div class="card sub-table"><div class="sub-toolbar"><label class="sub-task">ASSIGNMENT<select aria-label="Assignment"></select></label><label class="sub-search">STUDENT<input type="search" placeholder="Search name or email" aria-label="Search students"></label><label>STATUS<select aria-label="Submission status"><option value="all">All students</option><option value="submitted">Submitted</option><option value="waiting">Not submitted</option></select></label></div><div class="sub-scroll"><table><thead><tr><th>Student</th><th>Status</th><th>Latest result</th><th>Last submitted</th><th><span aria-label="Actions">Review</span></th></tr></thead><tbody></tbody></table></div><div class="sub-footer" role="status"></div></div></div><div class="sub-detail" hidden></div>`;
  document.querySelector('#assignments-view').after(section);
  const $=s=>section.querySelector(s), assignment=$('[aria-label="Assignment"]'), search=$('input'), filter=$('[aria-label="Submission status"]');
  let rows=[],tasks=[],busy=false,snapshot='',selectedEmail=null,loaded=false;
  const node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
  const date=value=>new Date(value).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  const attemptsFor=email=>rows.filter(r=>r.studentEmail===email&&(!assignment.value||r.task.id===assignment.value)).sort((a,b)=>Date.parse(b.attempt.at)-Date.parse(a.attempt.at));
  function students(){
    const accounts=new Map(Object.entries(OralJournal.accounts).filter(([,role])=>role==='student').map(([email])=>[email,{email,name:email.split('@')[0]}]));
    for(const row of [...rows].sort((a,b)=>Date.parse(a.attempt.at)-Date.parse(b.attempt.at))) accounts.set(row.studentEmail,{email:row.studentEmail,name:row.studentName||row.studentEmail.split('@')[0]});
    return [...accounts.values()];
  }
  function avatar(student){const initials=student.name.split(/[\s._-]+/).filter(Boolean).map(p=>p[0]).slice(0,2).join('').toUpperCase();const el=node('span',initials,'sub-avatar');el.setAttribute('aria-hidden','true');return el;}
  function person(student){const wrap=node('div','','sub-person'),label=document.createElement('div');label.append(node('b',student.name),node('small',student.email));wrap.append(avatar(student),label);return wrap;}
  function render(){
    const all=students(),submitted=all.filter(s=>attemptsFor(s.email).length).length;
    $('.sub-metrics').replaceChildren(...[['Students',all.length],['Submitted',submitted],['Not submitted',all.length-submitted]].map(([label,count])=>{const card=node('div','','sub-metric');card.append(node('span',label),node('b',loaded?count:'—'));return card;}));
    const shown=all.filter(s=>`${s.name} ${s.email}`.toLowerCase().includes(search.value.toLowerCase())&&(filter.value==='all'||(attemptsFor(s.email).length?'submitted':'waiting')===filter.value));
    $('tbody').replaceChildren(...(loaded?shown:[]).map(student=>{
      const attempts=attemptsFor(student.email),latest=attempts[0],a=latest?.attempt,result=a&&(a.combined||a.analysis),tr=document.createElement('tr');
      const cells=Array.from({length:5},()=>document.createElement('td'));cells[0].append(person(student));
      cells[1].append(node('span',latest?'● Submitted':'○ Not submitted',`sub-badge${latest?'':' waiting'}`));
      cells[1].append(node('small',latest?`${attempts.length} attempt${attempts.length===1?'':'s'}`:assignment.value?'Awaiting this assignment':'No submissions yet'));
      if(result){const total=latest.task.knowledgePoints.length;cells[2].append(node('b',`${result.mentioned.length} / ${total} ideas`));const bar=document.createElement('progress');bar.max=total;bar.value=result.mentioned.length;bar.setAttribute('aria-label','Ideas expressed');cells[2].append(bar,node('small','Idea coverage · formative'));}
      else cells[2].append(node('span',latest?(a.status==='failed'?'Feedback unavailable':'Preparing feedback…'):'—'));
      cells[3].append(node('span',latest?date(a.at):'—'));
      const button=node('button',latest?'View submission →':'View student →','outline');button.onclick=()=>{selectedEmail=student.email;renderDetail();$('.sub-detail button').focus();};cells[4].append(button);tr.append(...cells);return tr;
    }));
    if(!loaded||!shown.length){const tr=document.createElement('tr'),td=node('td',loaded?'No students match these filters.':'Loading student submissions…','sub-empty');td.colSpan=5;tr.append(td);$('tbody').append(tr);}
    if(selectedEmail)renderDetail();
  }
  function renderDetail(){
    $('.sub-overview').hidden=true;const detail=$('.sub-detail');detail.hidden=false;
    const student=students().find(s=>s.email===selectedEmail);if(!student)return;
    const back=node('button','← All submissions','outline');back.onclick=()=>{selectedEmail=null;detail.hidden=true;$('.sub-overview').hidden=false;assignment.focus();};
    const head=node('div','','sub-detail-head'),label=document.createElement('div');label.append(node('h1',student.name),node('small',student.email));head.append(avatar(student),label);detail.replaceChildren(back,head);
    const attempts=attemptsFor(student.email);
    if(!attempts.length){const empty=node('div','','card sub-empty');empty.append(node('h2','No submission yet'),node('p',assignment.value?'This student has not submitted this assignment.':'This student has not submitted an explanation yet.'));detail.append(empty);return;}
    for(const row of attempts){const a=row.attempt,result=a.combined||a.analysis,card=node('article','','card sub-attempt');
      card.append(node('h2',row.task.question),node('small',`Attempt ${a.n} · ${date(a.at)}`),node('p',a.transcript,'sub-answer'));
      if(result){const feedback=node('div','','sub-feedback');feedback.append(node('b',`${result.mentioned.length}/${row.task.knowledgePoints.length} ideas expressed`),node('small',`${result.mode==='ai'?'AI feedback':'Offline keyword check'} · Formative feedback, not an official grade`),node('p',result.feedback));const points=new Map(row.task.knowledgePoints.map(p=>[p.id,p.name]));
        for(const [key,title] of [['mentioned','Expressed'],['missing','Not yet expressed'],['misconceptions','Needs another look']]){if(!result[key].length)continue;feedback.append(node('h3',title));const list=document.createElement('ul');for(const item of result[key])list.append(node('li',`${points.get(item.pointId)||item.pointId} — ${item.quote||item.hint||''}${item.correction?' · '+item.correction:''}`));feedback.append(list);}card.append(feedback);
      }else card.append(node('p',a.status==='failed'?'Answer received. Feedback is unavailable.':'Answer received. Feedback is being prepared.','sub-feedback'));detail.append(card);
    }
  }
  async function refresh(){if(busy)return;busy=true;$('.sub-refresh').disabled=true;
    try{const responses=await Promise.all([fetch('/api/submissions',{signal:AbortSignal.timeout(10000)}),fetch('/api/tasks',{signal:AbortSignal.timeout(10000)})]);if(responses.some(r=>!r.ok))throw Error();const [submissions,assignments]=await Promise.all(responses.map(r=>r.json()));
      const next=JSON.stringify([submissions.submissions,assignments.tasks]);
      if(next!==snapshot){snapshot=next;rows=submissions.submissions;tasks=assignments.tasks;const selected=assignment.value;
        const options=new Map(tasks.map(t=>[t.id,t.title||t.question]));for(const r of rows)if(!options.has(r.task.id))options.set(r.task.id,r.task.question);
        assignment.replaceChildren(new Option('All assignments',''),...[...options].map(([id,title])=>new Option(title,id)));assignment.value=options.has(selected)?selected:'';loaded=true;render();}
      $('.sub-footer').textContent=`${students().length} student account${students().length===1?'':'s'} · Updated ${date(new Date())} · Automatically synced`;
    }catch{$('.sub-footer').textContent='Unable to refresh. Your last loaded records are still here. Please retry.';}
    finally{busy=false;$('.sub-refresh').disabled=false;}}
  assignment.onchange=()=>{selectedEmail=null;render();};search.oninput=render;filter.onchange=render;
  $('.sub-refresh').onclick=refresh;window.addEventListener('focus',refresh);setInterval(()=>{if(!document.hidden)refresh();},5000);render();refresh();
})();
