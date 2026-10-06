(() => {
  'use strict';
  const { STATUSES, PRIORITIES, createBrowserTaskService, KEY } = TaskService;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const dateValue = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  function offsetDate(days) { const date = new Date(); date.setDate(date.getDate() + days); return dateValue(date); }
  const today = () => dateValue(new Date());
  const dateLabel = value => value ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`)) : 'No due date';
  const timeLabel = value => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const api = createBrowserTaskService({ seed: [
    { title: 'Outline your research proposal', description: 'Start with the research question, then sketch the methods and a realistic timeline.', priority: 'High', status: 'In Progress', assignee: 'You', dueDate: offsetDate(1) },
    { title: 'Fix the mobile navigation', description: 'The menu overlaps the page heading on small screens. Check the layout below 600px.', priority: 'Urgent', status: 'Todo', assignee: 'You', dueDate: offsetDate(0) },
    { title: 'Review literature notes', description: 'Compare the three papers from this week and highlight the main gaps.', priority: 'Medium', status: 'Under Review', assignee: 'Alya', dueDate: offsetDate(2) },
    { title: 'Submit weekly reflection', description: 'Write a short reflection on what worked, what felt difficult, and what to try next.', priority: 'Medium', status: 'Todo', assignee: 'You', dueDate: offsetDate(4) },
    { title: "Plan next week's study blocks", description: 'Leave a little room for breaks and catch-up time.', priority: 'Low', status: 'Todo', assignee: null, dueDate: null },
    { title: 'Set up your task desk', description: 'A place for assignments, small fixes, and the things you want to make happen. These are sample tasks — edit them or make the desk your own.', priority: 'Low', status: 'Done', assignee: 'You', dueDate: offsetDate(-1) }
  ] });
  const state = { view: 'all', status: '', search: '', priority: '', assignee: '', sort: 'newest', panelId: null, panelMode: null, deleteId: null };
  let toastTimer;
  const panel = $('#task-panel');
  const deleteDialog = $('#delete-dialog');
  const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const errorMessage = error => error instanceof TaskService.TaskError ? error.message : 'Something went wrong. Please try again.';
  function toast(message, isError = false) {
    clearTimeout(toastTimer);
    const el = $('#toast'); el.textContent = message; el.classList.toggle('error', isError); el.hidden = false;
    toastTimer = setTimeout(() => { el.hidden = true; }, isError ? 7000 : 3500);
  }
  function query() {
    return { view: state.view, today: today(), until: offsetDate(6), status: state.status, search: state.search, priority: state.priority, assignee: state.assignee.startsWith('person:') ? state.assignee.slice(7) : '', unassigned: state.assignee === '__unassigned', sort: state.sort };
  }
  function priorityBadge(priority) { return `<span class="priority-badge priority-${priority.toLowerCase()}">${escape(priority)}</span>`; }
  function assigneeMarkup(assignee) {
    const initials = (assignee || '').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    return `<span class="assignee-avatar" aria-hidden="true">${escape(initials || '–')}</span><span class="${assignee ? '' : 'unassigned'}" title="${escape(assignee || 'Unassigned')}">${escape(assignee || 'Unassigned')}</span>`;
  }
  function statusSelect(task) {
    return `<select class="status-select" data-action="status" data-id="${escape(task.id)}" data-status="${escape(task.status)}" aria-label="Status for ${escape(task.title)}">${STATUSES.map(status => `<option${task.status === status ? ' selected' : ''}>${status}</option>`).join('')}</select>`;
  }
  function renderRow(task) {
    const due = task.dueDate;
    const dueText = due === today() ? 'Today' : dateLabel(due);
    const dueClass = task.status === 'Done' ? '' : due && due < today() ? ' overdue' : due === today() ? ' today' : '';
    return `<article class="task-row${task.status === 'Done' ? ' is-done' : ''}" aria-label="${escape(task.title)}">
      <div class="task-main"><button class="complete-button${task.status === 'Done' ? ' done' : ''}" data-action="complete" data-id="${escape(task.id)}" aria-label="${task.status === 'Done' ? 'Reopen' : 'Complete'} ${escape(task.title)}" aria-pressed="${task.status === 'Done'}">${task.status === 'Done' ? '✓' : ''}</button><div style="min-width:0"><button class="task-title-button" data-action="details" data-id="${escape(task.id)}">${escape(task.title)}</button><p class="task-description">${escape(task.description || 'Add a few details when you’re ready.')}</p></div></div>
      <div class="priority-cell">${priorityBadge(task.priority)}</div><div class="assignee-cell">${assigneeMarkup(task.assignee)}</div><div class="due-cell${dueClass}"><span aria-hidden="true">${due ? '◷' : '–'}</span><span>${escape(dueText)}</span></div><div class="status-cell">${statusSelect(task)}</div></article>`;
  }
  function render() {
    $('#task-list').setAttribute('aria-busy', 'true');
    try {
      const all = api.list();
      const scoped = api.list({ view: state.view, today: today(), until: offsetDate(6) });
      const tasks = api.list(query());
      const done = all.filter(t => t.status === 'Done').length;
      const percent = all.length ? Math.round(done / all.length * 100) : 0;
      $('#nav-all').textContent = all.length;
      $('#nav-completed').textContent = done;
      $('#nav-upcoming').textContent = api.list({ view: 'upcoming', today: today(), until: offsetDate(6) }).length;
      $('#progress').value = percent; $('#progress').textContent = `${percent}%`; $('#progress-value').textContent = `${percent}%`;
      $('#progress-title').textContent = all.length && done === all.length ? 'All caught up. Nicely done!' : done ? "You're making room for what's next." : 'One small step is a good start.';
      $('#progress-copy').textContent = all.length ? `${done} of ${all.length} tasks complete. ${done === all.length ? 'Take a well-earned breather.' : 'Every little bit counts.'}` : 'Add your first task and give it a place to land.';
      const assignees = [...new Set(all.map(t => t.assignee).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      $('#assignee-filter').innerHTML = `<option value="">Everyone</option><option value="__unassigned">Unassigned</option>${assignees.map(name => `<option value="person:${escape(name)}">${escape(name)}</option>`).join('')}`;
      // Preserve a selected assignee even when their final task was deleted.
      if (state.assignee.startsWith('person:') && !assignees.includes(state.assignee.slice(7))) {
        const option = document.createElement('option'); option.value = state.assignee; option.textContent = state.assignee.slice(7); $('#assignee-filter').append(option);
      }
      $('#assignee-filter').value = state.assignee;
      $('#status-tabs').innerHTML = ['', ...STATUSES].map(status => `<button class="status-tab" data-status="${status}" aria-pressed="${state.status === status}">${status || 'All'}<span class="tab-count">${status ? scoped.filter(t => t.status === status).length : scoped.length}</span></button>`).join('');
      $('#clear-filters').hidden = !state.status && !state.search && !state.priority && !state.assignee;
      $('#list-error').hidden = true;
      if (tasks.length) {
        $('#task-list').innerHTML = `<div class="task-table-head" aria-hidden="true"><span>TASK</span><span>PRIORITY</span><span class="assignee-heading">ASSIGNEE</span><span>DUE DATE</span><span>STATUS</span></div>${tasks.map(renderRow).join('')}`;
      } else {
        const filtered = Boolean(state.status || state.search || state.priority || state.assignee);
        const title = !all.length ? 'A fresh page, just for you.' : filtered ? 'No tasks match just yet.' : state.view === 'completed' ? 'Your first finish is on its way.' : 'A little breathing room.';
        const copy = !all.length ? 'Start with one thing you want to get done. You can figure out the rest as you go.' : filtered ? 'Try a different search or clear your filters to see more tasks.' : state.view === 'completed' ? 'Completed tasks will land here. Head back to your desk and take the next small step.' : 'No unfinished tasks are due in the next seven days. Add a task whenever you’re ready.';
        $('#task-list').innerHTML = `<div class="empty-state"><div class="empty-illustration" aria-hidden="true">${filtered ? '⌕' : '✧'}</div><h2>${title}</h2><p>${copy}</p><button class="${filtered ? 'secondary' : 'primary'}" data-action="${filtered ? 'clear' : 'new'}">${filtered ? 'Clear filters' : 'Add a task'}</button></div>`;
      }
      $('#result-count').textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}${tasks.length !== scoped.length ? ` of ${scoped.length}` : ''} · ${state.view === 'upcoming' ? 'due in the next 7 days' : 'saved on this browser'}`;
    } catch (error) {
      $('#list-error').hidden = false; $('#list-error-copy').textContent = errorMessage(error);
      $('#task-list').innerHTML = ''; $('#result-count').textContent = 'Tasks unavailable';
    } finally { $('#task-list').setAttribute('aria-busy', 'false'); }
  }
  function clearFilters() {
    Object.assign(state, { status: '', search: '', priority: '', assignee: '' });
    $('#search').value = ''; $('#priority-filter').value = ''; $('#assignee-filter').value = ''; render();
  }
  function setView(view) {
    state.view = view; clearFilters();
    const titles = { all: ['All your tasks', 'Get it out of your head. Take it one task at a time.', 'All tasks'], upcoming: ['A look ahead', 'Your unfinished tasks due in the next seven days.', 'This week'], completed: ['Look how far you’ve come', 'A little collection of things you made happen.', 'Completed'] };
    const [title, subtitle, breadcrumb] = titles[view];
    $('#page-title').innerHTML = `${title}<span class="heading-dot">.</span>`; $('#page-subtitle').textContent = subtitle; $('#breadcrumb').textContent = breadcrumb;
    document.querySelectorAll('[data-view]').forEach(button => { button.classList.toggle('active', button.dataset.view === view); if (button.dataset.view === view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  }
  function openPanel(mode, id) {
    try {
      const task = id ? api.get(id) : null;
      state.panelMode = mode; state.panelId = id || null;
      $('#panel-label').textContent = mode === 'details' ? 'TASK DETAILS' : mode === 'edit' ? 'A LITTLE UPDATE' : 'MAKE A LITTLE PLAN';
      if (mode === 'details') {
        $('#panel-content').innerHTML = `<h2 id="panel-title">${escape(task.title)}</h2><p class="detail-description">${escape(task.description || 'No description yet. Add a few details when you edit this task.')}</p><dl class="detail-meta"><div><dt>Status</dt><dd>${escape(task.status)}</dd></div><div><dt>Priority</dt><dd>${priorityBadge(task.priority)}</dd></div><div><dt>Assignee</dt><dd>${escape(task.assignee || 'Unassigned')}</dd></div><div><dt>Due date</dt><dd>${escape(dateLabel(task.dueDate))}${task.dueDate ? ` <small>(${escape(task.dueDate)})</small>` : ''}</dd></div></dl><div class="detail-timestamps"><span>Created ${escape(timeLabel(task.createdAt))}</span><span>Updated ${escape(timeLabel(task.updatedAt))}</span></div><div class="detail-actions"><button class="danger-text" data-panel-action="delete">Delete task</button><button class="primary" data-panel-action="edit">Edit task <span aria-hidden="true">↗</span></button></div>`;
      } else {
        const value = task || { title: '', description: '', priority: 'Medium', status: 'Todo', assignee: '', dueDate: '' };
        const selectOptions = (items, selected) => items.map(item => `<option${item === selected ? ' selected' : ''}>${item}</option>`).join('');
        const errorSlot = name => `<span class="field-error" id="error-${name}"></span>`;
        $('#panel-content').innerHTML = `<h2 id="panel-title">${task ? 'Edit your task.' : 'One thing at a time.'}</h2><p class="panel-intro">${task ? 'A change of plan? Make it yours.' : 'Give your next small step a name.'}</p><form id="task-form" class="task-form" novalidate><p id="form-error" class="form-error" role="alert" hidden></p><label class="field" for="field-title">Task title <input id="field-title" name="title" aria-label="Task title" maxlength="160" placeholder="What do you want to get done?" value="${escape(value.title)}" required aria-describedby="error-title">${errorSlot('title')}</label><label class="field" for="field-description">Description <small>A few details, if you need them</small><textarea id="field-description" name="description" aria-label="Description" maxlength="5000" placeholder="Notes, links, or a little context…" aria-describedby="error-description">${escape(value.description)}</textarea>${errorSlot('description')}</label><div class="field-row"><label class="field" for="field-priority">Priority<select id="field-priority" name="priority" aria-label="Priority" aria-describedby="error-priority">${selectOptions(PRIORITIES, value.priority)}</select>${errorSlot('priority')}</label><label class="field" for="field-status">Status<select id="field-status" name="status" aria-label="Status" aria-describedby="error-status">${selectOptions(STATUSES, value.status)}</select>${errorSlot('status')}</label></div><label class="field" for="field-assignee">Assignee <small>A name or email. Leave blank to keep it unassigned.</small><input id="field-assignee" name="assignee" aria-label="Assignee" maxlength="120" placeholder="You, a classmate, a collaborator…" value="${escape(value.assignee)}" aria-describedby="error-assignee">${errorSlot('assignee')}</label><label class="field" for="field-dueDate">Due date <input id="field-dueDate" name="dueDate" aria-label="Due date" type="date" value="${escape(value.dueDate)}" aria-describedby="error-dueDate">${errorSlot('dueDate')}</label><div class="form-actions"><button type="button" class="secondary" data-panel-action="cancel">Cancel</button><button type="submit" class="primary" id="save-task">${task ? 'Save changes' : 'Create task'}</button></div></form>`;
      }
      if (!panel.open) panel.showModal();
      if (mode !== 'details') $('#field-title').focus();
      else $('#close-panel').focus();
    } catch (error) { toast(errorMessage(error), true); render(); }
  }
  function closePanel() { panel.close(); state.panelMode = null; state.panelId = null; }
  async function saveForm(event) {
    event.preventDefault();
    const form = event.target; const button = $('#save-task');
    if (button.disabled) return;
    const input = Object.fromEntries(new FormData(form));
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
    $('#form-error').hidden = true;
    button.disabled = true; button.textContent = 'Saving…';
    const editing = state.panelMode === 'edit';
    try {
      await nextFrame();
      const task = editing ? api.update(state.panelId, input) : api.create(input);
      render(); openPanel('details', task.id); toast(editing ? 'Changes saved. Back to the next small step.' : 'Task added. You’ve got this.');
    } catch (error) {
      const errorEl = $('#form-error'); errorEl.textContent = errorMessage(error); errorEl.hidden = false;
      for (const [name, message] of Object.entries(error.fields || {})) {
        const field = form.elements.namedItem(name); if (field) field.setAttribute('aria-invalid', 'true');
        const slot = $(`#error-${name}`); if (slot) slot.textContent = message;
      }
      const invalid = form.querySelector('[aria-invalid=true]'); if (invalid) invalid.focus();
    } finally { if (button.isConnected) { button.disabled = false; button.textContent = editing ? 'Save changes' : 'Create task'; } }
  }
  function askDelete() {
    try {
      const task = api.get(state.panelId); state.deleteId = task.id;
      $('#delete-copy').textContent = `“${task.title}” will be removed from your desk.`;
      $('#delete-error').hidden = true; deleteDialog.showModal();
    } catch (error) { toast(errorMessage(error), true); }
  }
  async function confirmDelete() {
    const button = $('#confirm-delete'); if (button.disabled || !state.deleteId) return;
    button.disabled = true; button.textContent = 'Deleting…';
    try {
      await nextFrame(); api.remove(state.deleteId); deleteDialog.close(); closePanel(); state.deleteId = null; render(); toast('Task deleted. A little more room on your desk.'); $('#new-task').focus();
    } catch (error) { $('#delete-error').textContent = errorMessage(error); $('#delete-error').hidden = false; }
    finally { button.disabled = false; button.textContent = 'Delete task'; }
  }
  async function changeStatus(id, status, control) {
    control.disabled = true;
    try { await nextFrame(); api.setStatus(id, status); toast(status === 'Done' ? 'One more done. Nicely done!' : `Moved to ${status.toLowerCase()}.`); }
    catch (error) { toast(errorMessage(error), true); }
    finally { render(); const action = control.dataset.action; document.querySelector(`[data-action="${action}"][data-id="${CSS.escape(id)}"]`)?.focus(); }
  }
  $('#new-task').addEventListener('click', () => openPanel('new'));
  $('#close-panel').addEventListener('click', closePanel);
  panel.addEventListener('close', () => { state.panelMode = null; state.panelId = null; });
  $('#panel-content').addEventListener('submit', saveForm);
  $('#panel-content').addEventListener('click', event => {
    const button = event.target.closest('[data-panel-action]'); if (!button) return;
    const action = button.dataset.panelAction;
    if (action === 'edit') openPanel('edit', state.panelId);
    if (action === 'delete') askDelete();
    if (action === 'cancel') { if (state.panelId) openPanel('details', state.panelId); else closePanel(); }
  });
  $('#cancel-delete').addEventListener('click', () => { deleteDialog.close(); state.deleteId = null; });
  deleteDialog.addEventListener('cancel', () => { state.deleteId = null; });
  $('#confirm-delete').addEventListener('click', confirmDelete);
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  $('#status-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-status]'); if (!button) return;
    state.status = button.dataset.status; render(); [...$('#status-tabs').children].find(el => el.dataset.status === state.status)?.focus();
  });
  $('#search').addEventListener('input', event => { state.search = event.target.value; render(); });
  for (const [id, key] of [['priority-filter', 'priority'], ['assignee-filter', 'assignee'], ['sort', 'sort']]) $("#" + id).addEventListener('change', event => { state[key] = event.target.value; render(); });
  $('#clear-filters').addEventListener('click', clearFilters); $('#retry').addEventListener('click', render);
  $('#task-list').addEventListener('click', event => {
    const button = event.target.closest('[data-action]'); if (!button || button.tagName === 'SELECT') return;
    const { action, id } = button.dataset;
    if (action === 'new') openPanel('new');
    if (action === 'clear') clearFilters();
    if (action === 'details') openPanel('details', id);
    if (action === 'complete') {
      try { changeStatus(id, api.get(id).status === 'Done' ? 'Todo' : 'Done', button); }
      catch (error) { toast(errorMessage(error), true); render(); }
    }
  });
  $('#task-list').addEventListener('change', event => { if (event.target.matches('[data-action=status]')) changeStatus(event.target.dataset.id, event.target.value, event.target); });
  window.addEventListener('storage', event => { if (event.key === KEY || event.key === null) { render(); if (panel.open && state.panelMode === 'details') { try { api.get(state.panelId); openPanel('details', state.panelId); } catch { closePanel(); toast('This task changed in another tab. Your list has been refreshed.', true); } } } });
  $('#today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  requestAnimationFrame(render);
})();
