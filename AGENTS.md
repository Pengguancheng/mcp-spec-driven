# Repository Guidelines

## Project Structure & Module Organization

- `src/`: TypeScript source (ESM/NodeNext). Examples: `src/index.ts`, `src/server.ts`, `src/utils/logger.ts`.
- `__tests__/`: Jest tests named `*.test.ts`.
- `dist/`: Compiled output (generated). Do not edit.
- Docs: `README.md`, `SPEC.md`, `PLAN.md`, `docs/`; guidelines in `guidelines/`.
- ESM imports: include `.js` in relative paths (e.g., `import './server.js'`).

## Build, Test, and Development Commands

- `npm install` — install deps (Node >= 18.17).
- `npm run dev` — start in dev via `ts-node` ESM loader.
- `npm run build` — compile TS to `dist/`.
- `npm start` — run compiled output.
- `npm test` — run Jest (ts-jest, ESM).
- `npm run test:inspector` — build then attach MCP Inspector to `dist/index.js`.
- `npm run lint` / `npm run lint:fix` — ESLint check/fix.
- `npm run format:check` / `npm run format` — Prettier check/format.

## Coding Style & Naming Conventions

- TypeScript strict; prefer async/await, named exports.
- Names: Classes/Types `PascalCase`; vars/functions `camelCase`; constants `UPPER_SNAKE_CASE`.
- Files: lower-case; use hyphen when needed; keep consistent with existing files.
- Prettier: single quotes; semicolons; trailing commas `all`; width 100; tab width 2; EOL LF.
- ESLint: `@typescript-eslint` + Prettier; avoid `any` unless justified.
- Language rule: communication/comments in Chinese; logs/exceptions in English; API/naming in English style.

## Testing Guidelines

- Framework: Jest with `ts-jest` ESM preset.
- Location: `__tests__/**/*.test.ts` (e.g., `__tests__/index.test.ts`).
- Focus on pure logic and edge cases; keep tests fast/deterministic.
- Run `npm test`; for coverage, `npx jest --coverage` (optional).

## Commit & Pull Request Guidelines

- Conventional Commits（中文摘要推荐）: `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`, `test: ...`, `chore: ...`。
- PRs: describe motivation and changes, link issues, include run/test steps; ensure build/lint/tests pass.

## Agent-Specific Notes (MCP)

- Server uses `@modelcontextprotocol/sdk` over stdio. Add tools/resources in `src/server.ts` with zod-validated schemas
  and stable URIs.
