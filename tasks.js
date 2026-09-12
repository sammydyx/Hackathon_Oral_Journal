// Published assignments are separate from the teacher dashboard's sample results.
const publishedSection = document.createElement('section');
publishedSection.className = 'card';
publishedSection.innerHTML = '<h2 style="font-size:17px">Published to students</h2><p id="published-status" role="status"></p><div id="published-list"></div>';
document.querySelector('#assignments-view').prepend(publishedSection);
async function loadPublishedTasks() {
  const status = document.querySelector('#published-status');
  try {
    const response = await fetch('/api/tasks');
    if (!response.ok) throw new Error();
    const { tasks } = await response.json();
    status.textContent = tasks.length ? `${tasks.length} assignments available in the student workspace.` : 'No new assignments yet. Create an oral task to publish one.';
    document.querySelector('#published-list').replaceChildren(...tasks.map(task => {
      const article = document.createElement('article'); article.className = 'attempt';
      const title = document.createElement('h3'); title.textContent = task.question;
      const points = document.createElement('ul');
      task.knowledgePoints.forEach(point => { const item = document.createElement('li'); item.textContent = point.name; points.append(item); });
      article.append(title, points); return article;
    }));
  } catch { status.textContent = 'Could not load published assignments. Please refresh to retry.'; }
}
loadPublishedTasks();
