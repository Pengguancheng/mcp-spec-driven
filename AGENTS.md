# Repository Guidelines

## Project Structure & Module Organization

- `src/`: TypeScript source (ESM, NodeNext). Example: `src/server.ts`, `src/index.ts`.
- `__tests__/`: Jest tests, name as `*.test.ts`.
- `dist/`: Compiled output (generated). Do not edit; add to `.gitignore`.
- ESM import style: when importing local TS, include the `.js` extension in paths (e.g., `import './server.js'`).

## Build, Test, and Development Commands

- `npm install` — install dependencies (Node >= 18.17).
- `npm run dev` — run from TS using `ts-node` ESM loader.
- `npm run build` — compile TypeScript to `dist/`.
- `npm start` — run compiled server from `dist/`.
- `npm test` — run Jest tests (ts-jest, ESM).
- `npm run test:inspector` — build and launch with MCP Inspector.
- `npm run lint` / `npm run lint:fix` — ESLint check/fix.
- `npm run format:check` / `npm run format` — Prettier check/format.

## Coding Style & Naming Conventions

- TypeScript strict mode; prefer async/await and named exports.
- Files: kebab-case (e.g., `resource-registry.ts`). Classes: PascalCase. Functions/vars: camelCase.
- Prettier: single quotes, semicolons, trailing commas `all`, width 100, tabs 2, LF EOL.
- ESLint: `@typescript-eslint` + Prettier integration. Keep code free of `any` unless justified.

## Testing Guidelines

- Framework: Jest with `ts-jest` (ESM). Tests in `__tests__/` and named `*.test.ts`.
- Example: `__tests__/server.test.ts` for `src/server.ts`.
- Run locally with `npm test`. For coverage use `npx jest --coverage` (optional).
- Keep tests isolated, fast, and deterministic; avoid I/O where possible.

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- PRs must include: concise description, linked issues, what/why, and test evidence (logs or screenshots). Ensure `build`, `lint`, and `test` all pass.

## Security & Configuration Tips

- Environment: `MCP_SERVER_NAME`, `MCP_SERVER_VERSION` used by `src/index.ts`.
- Do not commit secrets. Keep `dist/` and logs out of VCS. Validate inputs for any new MCP tools/resources.

## Agent-Specific Notes (MCP)

- Server runs via stdio using `@modelcontextprotocol/sdk`. Add tools/resources in `src/server.ts` and follow clear, zod-validated schemas and stable URIs.
