import { type ServerConfig, startServer } from './server.js';

// Helper to run stdio MCP server with provided config
export async function runStdioServer(config: ServerConfig = {}): Promise<void> {
  await startServer({
    name: config.name ?? process.env.MCP_SERVER_NAME ?? 'demo-server',
    version: config.version ?? process.env.MCP_SERVER_VERSION ?? '1.0.0'
  });
}

await runStdioServer();