# Hard boundaries

This repository had no established stack at setup time. The subsequently authorized mockup establishes HTML/CSS/JavaScript, the task service with local storage, and Node's built-in test runner. Reinspect before further implementation and preserve these conventions.

- Do not modify or swap the established language, framework, styling system, backend, persistence layer, or testing framework. The absence of a stack is not permission to install one during this documentation setup.
- Do not add external packages without explicit justification tied to the assigned feature and consideration of existing alternatives.
- Do not bypass the service/API layer. Presentation components must not contain direct database access, storage operations, or raw fetch logic.
- Do not duplicate existing UI elements. Reuse shared components, form inputs, modal dialogs, and utilities when available.
- Never expose environment secrets, tokens, credentials, or privileged configuration in client code, documentation, logs, test fixtures, or error messages.
- Do not perform unrelated refactoring or change files outside the assigned feature's required scope.
- Maintain existing public APIs and naming, folder, styling, and error-handling conventions. Document any necessary contract change within the authorized scope before implementing it.
- Do not bypass schema validation or business rules for task creation, editing, or status changes.
- Do not delete a task without explicit user confirmation in a modal/dialog. Keep cancellation safe and report deletion failures.
- Do not claim that a backend, database, framework, component, endpoint, or test suite exists until repository inspection confirms it.
- Keep Kilo agent files under `.kilo/agent/`, not `.kilo/modes/`. Preserve `kilo.json` exactly as supplied for this setup, including its literal schema value.
- During the initial documentation setup phase, do not create or modify application code, install dependencies, or scaffold source folders. That phase is complete; the subsequent user-authorized local-storage mockup is in scope.
