# Implementation standards

This repository began as an empty starting point for a Task & Issue Tracking web application. The authorized mockup now uses plain HTML, CSS, and JavaScript, a local-storage task service, and Node's built-in test runner. Read `ARCHITECTURE.md` for actual file paths and the distinction between implemented mockup behavior and future backend responsibilities.

Before any work, read `ARCHITECTURE.md` and `CONSTRAINTS.md`, inspect the current repository, and identify relevant code, configuration, dependencies, and tests. Recheck the repository when implementation begins; these setup observations may become outdated.

- Reuse existing UI components, form inputs, modal dialogs, validation schemas, and utilities once they exist. Before creating an element, search for an equivalent implementation.
- Keep changes strictly scoped to the assigned feature. Do not touch unrelated files or perform incidental refactoring.
- Avoid new dependencies without clear justification. Explain the need, existing alternatives, and impact before introducing a package.
- Follow established naming, folder conventions, file structures, and styling patterns: browser files in `src/`, tests in `tests/`, kebab-case filenames, and the CSS variables in `src/styles.css`.
- Route presentation-layer data operations through a service/API client. Keep transport, business rules, and persistence concerns out of UI components.
- Enforce schema validation on task inputs at the service boundary and, when applicable, on the backend. UI validation supports usability but does not replace boundary validation.
- Provide clear user-facing validation and operation errors; preserve form input on failure and never display secrets or raw internal traces.
- Include Loading, Empty, Success, and Error states for relevant task flows. Require explicit confirmation in a modal/dialog before deletion.
- Use the repository's native Node test runner: `npm test` or `node --test tests/*.test.cjs`. Report actual results and identify any browser checks that could not be executed.
- Update architecture documentation when authorized implementation establishes or changes documented conventions, public contracts, or feature flows.

## Setup scope

This setup adds only root governance/configuration and agent instructions under `.kilo/agent/`. It does not scaffold an application, select a technology stack, install packages, or implement task features. Agent frontmatter contains `description` and `mode: primary`. A warning such as "Failed to parse frontmatter: No context found for instance" is a known false positive when the YAML is valid and the agent files exist under `.kilo/agent/`.

The initial setup phase is complete. The user subsequently authorized a working local-storage mockup. The implementation follows that authorization; future work must preserve the established service boundary and remain within its assigned scope.
