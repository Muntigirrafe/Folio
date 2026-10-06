const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTaskService, KEY } = require('../src/task-service.js');
const input = { title: 'Fix navigation', description: 'Mobile menu issue', priority: 'High', status: 'Todo', assignee: 'Rui', dueDate: '2026-10-01' };
function memory() { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }; }
test('CRUD persists across service instances and protects identifiers', () => {
  const storage = memory(); const api = createTaskService(storage);
  assert.deepEqual(api.list(), []);
  const task = api.create(input);
  assert.equal(createTaskService(storage).get(task.id).title, input.title);
  const edited = api.update(task.id, { ...input, title: 'New title', id: 'override', createdAt: 'override' });
  assert.equal(edited.id, task.id); assert.equal(edited.createdAt, task.createdAt);
  assert.equal(api.setStatus(task.id, 'Done').status, 'Done');
  api.remove(task.id); assert.deepEqual(api.list(), []);
  assert.throws(() => api.get(task.id), /no longer exists/);
});
test('search, combined filters, unassigned tasks, and sorting', () => {
  const api = createTaskService(memory()); api.create(input);
  api.create({ ...input, title: 'Accessibility', assignee: '', priority: 'Urgent', status: 'Done' });
  assert.equal(api.list({ search: 'MENU', status: 'Todo', priority: 'High', assignee: 'Rui' }).length, 1);
  assert.equal(api.list({ unassigned: true }).length, 1);
  assert.equal(api.list({ search: 'missing' }).length, 0);
  assert.equal(api.list({ sort: 'priority' })[0].priority, 'Urgent');
  assert.equal(api.list({ sort: 'title' })[0].title, 'Accessibility');
});
test('schema rejects invalid boundaries without persisting changes', () => {
  const api = createTaskService(memory());
  for (const invalid of [{ title: ' ' }, { title: 'a'.repeat(161) }, { status: 'Unknown' }, { priority: 'Critical' }, { dueDate: '2026-02-30' }, { dueDate: 'not-a-date' }, { dueDate: 0 }, { description: {} }, { assignee: 3 }, { description: 'a'.repeat(5001) }, { assignee: 'a'.repeat(121) }]) {
    assert.throws(() => api.create({ ...input, ...invalid }), /highlighted fields/);
  }
  assert.equal(api.list().length, 0);
  assert.equal(api.create({ ...input, title: 'a'.repeat(160), dueDate: '', assignee: '' }).dueDate, null);
  assert.throws(() => api.create(null), /must be an object/);
});
test('storage errors and corrupted data are surfaced without overwriting', () => {
  const blocked = createTaskService({ getItem() { throw Error(); } });
  assert.throws(() => blocked.list(), /read saved tasks/);
  const storage = memory(); const api = createTaskService(storage); api.list();
  storage.setItem = () => { throw Error(); };
  assert.throws(() => api.create(input), /could not be saved/);
  assert.equal(api.list().length, 0);
  const corrupt = memory(); corrupt.setItem(KEY, '{broken');
  assert.throws(() => createTaskService(corrupt).list(), /not been overwritten/);
  assert.equal(corrupt.getItem(KEY), '{broken');
});
test('sample tasks seed once and stay deleted after an empty list is saved', () => {
  const storage = memory(); const api = createTaskService(storage, { seed: [input] });
  const task = api.list()[0]; assert.equal(api.list().length, 1);
  api.remove(task.id);
  assert.deepEqual(createTaskService(storage, { seed: [input] }).list(), []);
});
test('all valid status transitions are allowed and invalid updates preserve state', () => {
  const api = createTaskService(memory()); const task = api.create(input);
  for (const status of ['In Progress', 'Under Review', 'Done', 'Todo']) assert.equal(api.setStatus(task.id, status).status, status);
  assert.throws(() => api.setStatus(task.id, 'Cancelled'), /highlighted fields/);
  assert.equal(api.get(task.id).status, 'Todo');
  assert.throws(() => api.update(task.id, { ...input, title: '' }), /highlighted fields/);
  assert.equal(api.get(task.id).title, input.title);
});
test('upcoming/completed views, due ordering, and a literal sentinel assignee', () => {
  const api = createTaskService(memory());
  api.create({ ...input, title: 'Upcoming', assignee: '__unassigned', dueDate: '2026-10-03' });
  api.create({ ...input, title: 'Finished', status: 'Done', dueDate: '2026-10-02' });
  api.create({ ...input, title: 'No date', assignee: null, dueDate: null });
  api.create({ ...input, title: 'Overdue', dueDate: '2026-09-30' });
  assert.deepEqual(api.list({ view: 'upcoming', today: '2026-10-01', until: '2026-10-07' }).map(t => t.title), ['Upcoming']);
  assert.equal(api.list({ view: 'completed' })[0].title, 'Finished');
  assert.equal(api.list({ sort: 'due' }).at(-1).title, 'No date');
  assert.equal(api.list({ assignee: '__unassigned' })[0].title, 'Upcoming');
  assert.equal(api.list({ unassigned: true })[0].title, 'No date');
});
