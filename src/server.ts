import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

export type ServerConfig = {
  name?: string;
  version?: string;
};

export class Server {
  private running = false;
  public readonly name: string;
  public readonly version: string;

  private mcp?: McpServer;
  private transport?: StdioServerTransport;

  constructor(config: ServerConfig = {}) {
    this.name = config.name ?? 'mcp-stdio-server';
    this.version = config.version ?? '1.0.0';
  }

  async start(): Promise<void> {
    if (this.running) return;

    // 初始化 MCP 服务器
    this.mcp = new McpServer({
      name: this.name,
      version: this.version,
    });

    // 注册加法工具：add
    this.mcp.registerTool(
      'add',
      {
        title: 'Addition Tool',
        description: 'Add two numbers',
        inputSchema: { a: z.number(), b: z.number() },
      },
      async ({ a, b }) => ({
        content: [{ type: 'text', text: String(a + b) }],
      })
    );

    // 注册动态问候资源：greeting
    this.mcp.registerResource(
      'greeting',
      new ResourceTemplate('greeting://{name}', { list: undefined }),
      {
        title: 'Greeting Resource',
        description: 'Dynamic greeting generator',
      },
      async (uri, { name }) => ({
        contents: [
          {
            uri: uri.href,
            text: `Hello, ${name}!`,
          },
        ],
      })
    );

    // 通过 stdio 连接
    this.transport = new StdioServerTransport();
    await this.mcp.connect(this.transport);

    this.running = true;
    // eslint-disable-next-line no-console
    console.log(`[${this.name}] MCP stdio server started.`);
  }

  stop(): void {
    if (!this.running) return;

    // 目前 StdioServerTransport 在大多数宿主环境下由宿主管理生命周期。
    // 这里标记停止并记录日志。
    this.running = false;
    // eslint-disable-next-line no-console
    console.log(`[${this.name}] MCP stdio server stopped (transport lifecycle managed by host).`);
  }

  isRunning(): boolean {
    return this.running;
  }
}

export function createServer(config: ServerConfig = {}): Server {
  return new Server(config);
}

export async function startServer(config: ServerConfig = {}): Promise<Server> {
  const server = new Server(config);
  await server.start();
  return server;
}
