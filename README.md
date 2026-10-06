# Folio — a little space for your big plans

A working personal/student Task & Issue Tracking mockup. Built with plain HTML, CSS, and JavaScript; tasks are saved in this browser's local storage. No packages need to be installed.

## Run locally

With Node.js 20 or newer:

```sh
npm start
```

Or run `node server.cjs`. Open **http://localhost:3000**. Keep the same browser and address to access your saved tasks. Set `PORT` to use another port if needed.

## What works

- Create tasks and view/edit their details using a shared form.
- Search titles and descriptions; combine status, priority, and assignee filters.
- Sort by creation time, due date, priority, or title.
- Change status inline, complete tasks, and reopen completed tasks.
- Delete tasks through an explicit confirmation dialog; cancellation leaves them intact.
- View tasks due in the next seven days and completed tasks.
- Keep tasks after reloading; sample tasks appear on first use only.
- See validation, empty, success, and storage error states.
- Use the interface on mobile and with a keyboard.

Data stays on the current browser/device. This mockup has no login, application backend, or cross-device sync. Browser storage removal also removes saved tasks.

## Test

```sh
npm test
```

The tests use Node's built-in test runner and exercise the task service with isolated in-memory storage. See `ARCHITECTURE.md` for file responsibilities and service contracts.

`tests/browser-smoke.cjs` is an optional end-to-end check for an environment with Playwright already installed. Run it against the local server with `node tests/browser-smoke.cjs`; set `PLAYWRIGHT_MODULE` to the installed module's absolute path if it is outside this project, and `PLAYWRIGHT_BROWSERS_PATH` if needed. It uses isolated browser data and writes desktop/mobile screenshots to `artifacts/`. It is separate from the dependency-free native tests.

## Kilo setup

`AGENTS.md`, `ARCHITECTURE.md`, and `CONSTRAINTS.md` define governance. The six primary agents are in `.kilo/agent/`: Ask, Plan, Code, Debug, Review, and Test. `kilo.json` retains the literal schema value requested during setup.
