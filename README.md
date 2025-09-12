# mcp-spec-driven
use spec driven in llm coding cli

# mcp-spec-driven

Initial scaffold for an MCP server project. This repository currently provides a minimal, buildable skeleton that you can extend with the real Model Context Protocol SDK when needed.

## Features
- Minimal Server class with start/stop hooks (placeholder implementation)
- TypeScript ESM configuration (NodeNext)
- Linting and formatting via ESLint + Prettier
- Jest + ts-jest test setup (ESM)

## Install

npm install

## Build

npm run build

## Run (placeholder)

node dist/index.js

This will start a placeholder server and log that it has started. Replace the placeholder with real MCP wiring when you are ready to integrate @modelcontextprotocol/sdk.

## API

- createServer(config?): returns a Server instance
- startServer(config?): creates and starts a Server
- Server methods: start(), stop(), isRunning()

## Notes
- The runtime does not yet depend on @modelcontextprotocol/sdk to keep builds simple. You can introduce it and wire stdio/websocket endpoints in src/server.ts later.
