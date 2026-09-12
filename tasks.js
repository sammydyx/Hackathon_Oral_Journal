// Persisted assignments share the Oral tasks grid with the existing demo tasks.
async function loadPublishedTasks() {
  const grid = document.querySelector('#assignment-grid');
  let status = document.querySelector('#task-load-status');
  if (!status) {
    status = document.createElement('p'); status.id = 'task-load-status'; status.setAttribute('role', 'status');
    grid.before(status);
  }
  try {
    const response = await fetch('/api/tasks');
    if (!response.ok) throw new Error();
    const { tasks } = await response.json();
    for (const saved of tasks.slice().reverse()) {
      if (taskTemplates.some(task => task.id === saved.id)) continue;
      const task = { id:saved.id, title:saved.title || saved.question, question:saved.question,
        date:new Date(saved.createdAt).toLocaleDateString(), status:'Active', responses:0 };
      taskTemplates.push(task);
      taskSpecifications[task.id] = { criteria:saved.knowledgePoints.map(p=>p.name), misconceptions:[] };
      understandingData[task.id] = saved.knowledgePoints.slice(0,4).map(p=>[p.name,0,0,'No common misconception added yet.']);
      for (const select of [taskFilter,mapTask]) select.add(new Option(task.title,task.id));
      const card = document.createElement('article'); card.className='card assignment-card';card.dataset.taskCard=task.id;
      const text=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el;};
      const tag=text('span',`Active · ${task.date}`);tag.className='tag';
      card.append(tag,text('h2',task.title),text('p',task.question),text('p','Ready for student responses'));
      for (const [label,action] of [['View task →','assignmentTask'],['Edit','editTask'],['Delete','deleteTask']]) {
        const button=text('button',label);button.className='outline';button.dataset[action]=task.id;card.append(button);
      }
      bindAssignmentButtons(card);grid.prepend(card);
    }
    status.hidden=true;
  } catch { status.hidden=false;status.textContent='Could not load saved tasks. Refresh the page to retry.'; }
}
loadPublishedTasks();
