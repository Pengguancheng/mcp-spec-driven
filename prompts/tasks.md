Using the specification and plan below, produce a tasks breakdown as JSON ONLY (no prose).

Specification:
{{spec}}

Plan:
{{plan}}

The JSON will be written to: TASKS.json

Output an array of task objects with the following fields:

- id (e.g., "T1")
- title
- summary
- rationale
- steps (array of concise steps)
- files (paths or patterns; include new files if needed)
- acceptance_tests (clear, executable checks)
- dependencies (array of task ids)
- estimate (e.g., "1-2h")
- risk ("low" | "medium" | "high")
- validation (how this task will be verified; see guidance below)
- status ("todo" | "in_progress" | "blocked" | "done")
  Status meanings:
- todo: not started yet
- in_progress: currently being worked on
- blocked: waiting on a dependency or external factor
- done: completed and passes acceptance tests
  Validation guidance:
- Specify method: "unit" | "integration" | "e2e" | "manual"
- Provide exact procedure/commands and required environment setup
- Define expected outputs, pass criteria, and any artifacts (e.g., test reports)
  Each task should be independently testable and scoped for a single focused change. Respond with valid JSON only.
