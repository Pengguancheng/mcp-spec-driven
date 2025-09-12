import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import logger from './utils/logger.js';

const promptCache = new Map<string, string>();

async function loadPromptTemplate(name: string): Promise<string> {
  if (promptCache.has(name)) return promptCache.get(name)!;
  const filePath = path.join(process.cwd(), 'prompts', `${name}.md`);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    promptCache.set(name, content);
    return content;
  } catch (err) {
    logger.error(
      `[prompt] failed to load template "${name}": ${(err as Error).message}`,
    );
    throw err;
  }
}

function renderTemplate(
  template: string,
  vars: Record<string, string | undefined>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => {
    const v = vars[key];
    return typeof v === 'string' ? v : '';
  });
}

export type ServerConfig = {
  name?: string;
  version?: string;
};

export class Server {
  public readonly name: string;
  public readonly version: string;
  private running = false;
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

    // 注册工具：specify（规格说明）
    this.mcp.registerTool(
      'specify',
      {
        title: 'Specify',
        description:
          'Elicit requirements and produce a clear, testable specification',
        inputSchema: {
          description: z.string(),
          context: z.string().optional(),
        },
      },
      async ({ description, context }) => {
        const template = await loadPromptTemplate('specify');
        const text = renderTemplate(template, {
          description,
          context_block: context ? `Context:\n${context}\n\n` : '',
        });
        return {
          content: [
            {
              type: 'text',
              text,
            },
          ],
        };
      },
    );

    // 注册工具：plan（实现计划）
    this.mcp.registerTool(
      'plan',
      {
        title: 'Plan',
        description: 'Create an implementation plan from the specification',
        inputSchema: { spec: z.string(), preferences: z.string().optional() },
      },
      async ({ spec, preferences }) => {
        const template = await loadPromptTemplate('plan');
        const text = renderTemplate(template, {
          spec,
          preferences_block: `Preferences:\n${preferences ?? '(none)'}\n\n`,
        });
        return {
          content: [
            {
              type: 'text',
              text,
            },
          ],
        };
      },
    );

    // 注册工具：tasks（任务分解）
    this.mcp.registerTool(
      'tasks',
      {
        title: 'Tasks',
        description: 'Break the plan into implementable, testable tasks',
        inputSchema: { spec: z.string(), plan: z.string() },
      },
      async ({ spec, plan }) => {
        const template = await loadPromptTemplate('tasks');
        const text = renderTemplate(template, { spec, plan });
        return {
          content: [
            {
              type: 'text',
              text,
            },
          ],
        };
      },
    );

    // 通过 stdio 连接
    this.transport = new StdioServerTransport();
    await this.mcp.connect(this.transport);

    // 处理宿主关闭管道导致的 EPIPE/写入已结束错误，平滑退出
    const handleStdIoError = (err: unknown) => {
      const e = err as NodeJS.ErrnoException;
      if (
        e &&
        (e.code === 'EPIPE' || e.code === 'ERR_STREAM_WRITE_AFTER_END')
      ) {
        logger.warn(
          `[${this.name}] stdio closed by host (${e.code}). Exiting gracefully.`,
        );
        process.exit(0);
      }
    };
    process.stdout.on('error', handleStdIoError);
    process.stderr.on('error', handleStdIoError);

    // 当宿主关闭 stdin 时退出
    const handleStdinClose = () => {
      logger.warn(`[${this.name}] stdin closed by host. Exiting gracefully.`);
      process.exit(0);
    };
    process.stdin.on('close', handleStdinClose);
    process.stdin.on('end', handleStdinClose);

    this.running = true;
    logger.info(`[${this.name}] MCP stdio server started.`);
  }

  stop(): void {
    if (!this.running) return;

    // 目前 StdioServerTransport 在大多数宿主环境下由宿主管理生命周期。
    // 这里标记停止并记录日志。
    this.running = false;
    logger.info(
      `[${this.name}] MCP stdio server stopped (transport lifecycle managed by host).`,
    );
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
