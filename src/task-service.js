(function (root) {
  'use strict';
  const STATUSES = ['Todo', 'In Progress', 'Under Review', 'Done'];
  const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
  const KEY = 'folio.tasks.v1';
  class TaskError extends Error {
    constructor(message, fields = {}) { super(message); this.name = 'TaskError'; this.fields = fields; }
  }
  function validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TaskError('Task input must be an object.');
    const fields = {};
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const description = typeof input.description === 'string' ? input.description.trim() : '';
    const assignee = typeof input.assignee === 'string' ? input.assignee.trim() : '';
    if (!title || title.length > 160) fields.title = 'Enter a title between 1 and 160 characters.';
    if ((input.description != null && typeof input.description !== 'string') || description.length > 5000) fields.description = 'Enter a description of 5,000 characters or fewer.';
    if ((input.assignee != null && typeof input.assignee !== 'string') || assignee.length > 120) fields.assignee = 'Enter a name or email of 120 characters or fewer.';
    if (!PRIORITIES.includes(input.priority)) fields.priority = 'Choose a valid priority.';
    if (!STATUSES.includes(input.status)) fields.status = 'Choose a valid status.';
    const dueDate = input.dueDate === '' || input.dueDate == null ? null : input.dueDate;
    if (dueDate !== null && (typeof dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !Number.isFinite(Date.parse(dueDate)) || new Date(dueDate).toISOString().slice(0, 10) !== dueDate)) fields.dueDate = 'Choose a valid calendar date.';
    if (Object.keys(fields).length) throw new TaskError('Please check the highlighted fields.', fields);
    return { title, description, assignee: assignee || null, priority: input.priority, status: input.status, dueDate };
  }
  function createTaskService(storage, options = {}) {
    function read() {
      let raw;
      try { raw = storage.getItem(KEY); } catch { throw new TaskError('Your browser could not read saved tasks. Check storage permissions and retry.'); }
      if (raw === null) {
        const seed = (options.seed || []).map(input => ({ ...validate(input), id: root.crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
        write(seed);
        return seed;
      }
      try {
        const tasks = JSON.parse(raw);
        if (!Array.isArray(tasks)) throw new Error();
        const ids = new Set();
        for (const task of tasks) {
          validate(task);
          if (typeof task.id !== 'string' || !task.id || ids.has(task.id) || typeof task.createdAt !== 'string' || typeof task.updatedAt !== 'string' || !Number.isFinite(Date.parse(task.createdAt)) || !Number.isFinite(Date.parse(task.updatedAt))) throw new Error();
          ids.add(task.id);
        }
        return tasks;
      } catch { throw new TaskError('Saved task data could not be opened. Your data has not been overwritten. Restore valid browser storage and retry.'); }
    }
    function write(tasks) {
      try { storage.setItem(KEY, JSON.stringify(tasks)); } catch { throw new TaskError('Your changes could not be saved. Browser storage may be full or blocked.'); }
    }
    function find(tasks, id) {
      if (typeof id !== 'string' || !id) throw new TaskError('A valid task identifier is required.');
      const task = tasks.find(t => t.id === id);
      if (!task) throw new TaskError('This task no longer exists. Refresh the task list.');
      return task;
    }
    return {
      list(query = {}) {
        let tasks = read();
        if (query.status) tasks = tasks.filter(t => t.status === query.status);
        if (query.priority) tasks = tasks.filter(t => t.priority === query.priority);
        if (query.assignee) tasks = tasks.filter(t => t.assignee === query.assignee);
        if (query.unassigned) tasks = tasks.filter(t => !t.assignee);
        if (query.view === 'completed') tasks = tasks.filter(t => t.status === 'Done');
        if (query.view === 'upcoming') tasks = tasks.filter(t => t.status !== 'Done' && t.dueDate && t.dueDate >= query.today && t.dueDate <= query.until);
        const search = (query.search || '').trim().toLowerCase();
        if (search) tasks = tasks.filter(t => `${t.title} ${t.description}`.toLowerCase().includes(search));
        const sort = query.sort || 'newest';
        tasks.sort((a, b) => {
          let result = 0;
          if (sort === 'priority') result = PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority);
          else if (sort === 'due') result = (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
          else if (sort === 'title') result = a.title.localeCompare(b.title);
          else result = b.createdAt.localeCompare(a.createdAt);
          return result || a.id.localeCompare(b.id);
        });
        return tasks;
      },
      get(id) { return find(read(), id); },
      create(input) {
        const data = validate(input); const tasks = read(); const now = new Date().toISOString();
        const task = { ...data, id: root.crypto.randomUUID(), createdAt: now, updatedAt: now };
        write([...tasks, task]); return task;
      },
      update(id, input) {
        const tasks = read(); const old = find(tasks, id);
        const task = { ...old, ...validate(input), updatedAt: new Date().toISOString() };
        write(tasks.map(t => t.id === id ? task : t)); return task;
      },
      setStatus(id, status) {
        const old = this.get(id); return this.update(id, { ...old, status });
      },
      remove(id) { const tasks = read(); find(tasks, id); write(tasks.filter(t => t.id !== id)); }
    };
  }
  function createBrowserTaskService(options) {
    return createTaskService({
      getItem(key) { return root.localStorage.getItem(key); },
      setItem(key, value) { root.localStorage.setItem(key, value); }
    }, options);
  }
  root.TaskService = { createTaskService, createBrowserTaskService, validate, STATUSES, PRIORITIES, KEY, TaskError };
  if (typeof module !== 'undefined') module.exports = root.TaskService;
})(globalThis);
