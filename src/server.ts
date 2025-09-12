import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import logger from './utils/logger.js';

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
      }),
    );

    // 注册提示词：specify（规格说明）
    this.mcp.registerPrompt(
      'specify',
      {
        title: 'Specify',
        description:
          'Elicit requirements and produce a clear, testable specification',
        argsSchema: { description: z.string(), context: z.string().optional() },
      },
      ({ description, context }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text:
                `You are assisting with Spec-Driven Development. Based on the following description and context, produce a crisp, testable specification.\n\n` +
                `Description:\n${description}\n\n` +
                (context ? `Context:\n${context}\n\n` : '') +
                `If there are any uncertainties or missing details, ask targeted clarifying questions and discuss with the user. Iterate until all major doubts are resolved. Only then write the final specification suitable for saving to: SPEC.md\n\n` +
                `Output sections:\n` +
                `- Overview\n` +
                `- Goals\n` +
                `- Non-Goals\n` +
                `- Scope and Constraints\n` +
                `- Functional Requirements\n` +
                `- Non-Functional Requirements\n` +
                `- Risks & Mitigations\n` +
                `- Acceptance Criteria (bullet points)\n` +
                `- Open Questions (list to clarify with the user)\n` +
                `Keep it concise and actionable.`,
            },
          },
        ],
      }),
    );

    // 注册提示词：plan（实现计划）
    this.mcp.registerPrompt(
      'plan',
      {
        title: 'Plan',
        description: 'Create an implementation plan from the specification',
        argsSchema: { spec: z.string(), preferences: z.string().optional() },
      },
      ({ spec, preferences }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text:
                `Create a pragmatic implementation plan from the specification below.\n\n` +
                `Specification:\n${spec}\n\n` +
                `Preferences:\n${preferences ?? '(none)'}\n\n` +
                `If there are any ambiguities, risks, or missing information, ask concise clarifying questions and discuss with the user. Iterate until all concerns are addressed. Once clarified, write the final plan suitable for saving to: PLAN.md\n\n` +
                `Include sections:\n` +
                `- Architecture and Components\n` +
                `- Technology Choices (with rationale)\n` +
                `- Data Model / API Contracts\n` +
                `- Integration Points and External Dependencies\n` +
                `- Milestones and Sequencing\n` +
                `- Testing & Validation Strategy\n` +
                `- Rollout and Backout Plan\n` +
                `- Risks and Mitigations\n` +
                `Use clear headings and keep it implementation-oriented.`,
            },
          },
        ],
      }),
    );

    // 注册提示词：tasks（任务分解）
    this.mcp.registerPrompt(
      'tasks',
      {
        title: 'Tasks',
        description: 'Break the plan into implementable, testable tasks',
        argsSchema: { spec: z.string(), plan: z.string() },
      },
      ({ spec, plan }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text:
                `Using the specification and plan below, produce a tasks breakdown as JSON ONLY (no prose).\n\n` +
                `Specification:\n${spec}\n\n` +
                `Plan:\n${plan}\n\n` +
                `The JSON will be written to: TASKS.json\n\n` +
                `Output an array of task objects with the following fields:\n` +
                `- id (e.g., "T1")\n` +
                `- title\n` +
                `- summary\n` +
                `- rationale\n` +
                `- steps (array of concise steps)\n` +
                `- files (paths or patterns; include new files if needed)\n` +
                `- acceptance_tests (clear, executable checks)\n` +
                `- dependencies (array of task ids)\n` +
                `- estimate (e.g., "1-2h")\n` +
                `- risk ("low" | "medium" | "high")\n` +
                `- validation (how this task will be verified; see guidance below)\n` +
                `- status ("todo" | "in_progress" | "blocked" | "done")\n` +
                `Status meanings:\n` +
                `- todo: not started yet\n` +
                `- in_progress: currently being worked on\n` +
                `- blocked: waiting on a dependency or external factor\n` +
                `- done: completed and passes acceptance tests\n` +
                `Validation guidance:\n` +
                `- Specify method: "unit" | "integration" | "e2e" | "manual"\n` +
                `- Provide exact procedure/commands and required environment setup\n` +
                `- Define expected outputs, pass criteria, and any artifacts (e.g., test reports)\n` +
                `Each task should be independently testable and scoped for a single focused change. Respond with valid JSON only.`,
            },
          },
        ],
      }),
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
