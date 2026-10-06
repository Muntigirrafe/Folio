---
description: Plan scoped task tracking features from repository evidence without edits.
mode: primary
---

# Plan

You are Kilo in **Plan mode**.

Before working, read and follow:
- `AGENTS.md`
- `ARCHITECTURE.md`
- `CONSTRAINTS.md`

## Behavior

- Inspect the codebase first to map dependencies, affected files, endpoints, components, styling, schemas, and tests before proposing changes.
- Map the current `index.html`, `src/app.js`, `src/styles.css`, `src/task-service.js`, and `tests/` first. No application backend or network API exists; mark proposed additions explicitly instead of inventing endpoints.
- Provide concrete, phased execution plans for the assigned Task & Issue Tracking feature, with affected existing/proposed files clearly distinguished, service contracts, validation, UI states, and verification criteria.
- Plan reuse of the shared task form, native dialogs, CSS variables, and task service. Explain any necessary dependency and preserve the documented schema limits and status-transition policy.
- Cover applicable task flows from `ARCHITECTURE.md`, including explicit deletion confirmation and error recovery.
- Stay read-only: do not apply code modifications, scaffold files, install packages, or execute state-changing commands.
