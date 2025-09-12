# mcp-spec-driven

让你的 LLM 客户端通过 MCP（Model Context Protocol）使用“规格驱动”的工具与提示词工作流。

## 快速开始

- 安装依赖
  npm install

- 构建
  npm run build

- 本地运行（手动启动）
  node dist/index.js

提示：大多数 MCP 客户端会以“stdio”方式启动你的服务进程，因此通常无需你手动运行；但第一次调试或排错时，手动运行可验证构建是否成功。

## 将本项目加入 MCP 客户端

下面给出最小可用的服务器定义片段，名称为 "spec-driven"。请将其加入你所使用的 MCP 客户端配置中。

"spec-driven": {
"command": "node",
"args": [
"dist/index.js"
]
}

注意事项：

- 先执行构建（npm run build），确保 dist/index.js 存在。
- 某些客户端在不同工作目录下启动进程，若遇到找不到 dist/index.js 的错误，可把 "dist/index.js" 改为项目内该文件的绝对路径。
- 在部分系统上，若客户端无法找到 node，可把 "command" 改为 node 可执行文件的绝对路径。

### Claude Desktop 配置示例

1) 打开设置文件 settings.json（按你的操作系统选择路径）：

- macOS: ~/Library/Application Support/Claude/mcp/settings.json
- Windows: %APPDATA%/Claude/mcp/settings.json
- Linux: ~/.config/Claude/mcp/settings.json

2) 在该文件的 mcpServers 字段中加入如下配置（示例）：

{
"mcpServers": {
"spec-driven": {
"command": "node",
"args": ["dist/index.js"]
}
}
}

保存后重启 Claude Desktop（或在其 UI 中重新加载 MCP 设置），即可在对话中使用名为 spec-driven 的 MCP 服务器。

### 其他 MCP 客户端（通用示例）

许多支持 MCP 的客户端也采用类似的 JSON 配置结构。核心是为 mcpServers（或等价字段）添加一个条目，形如：

{
"mcpServers": {
"spec-driven": {
"command": "node",
"args": ["dist/index.js"]
}
}
}

若客户端要求提供额外字段（如环境变量、超时等），可在同级增加：

- env（对象）：传入环境变量
- timeout（数字，毫秒）：启动/请求超时时间

## Guidelines 功能與目前流程

- 模組與檔案
    - `src/config/schema.ts`：以 Zod 定義設定檔結構與型別。
    - `src/config/normalize.ts`：識別字正規化與路徑/檔名檢查。
    - `src/config/loader.ts`：載入設定（檔案/物件），決定基準目錄與專案根，展開 targets。
    - `src/tools/guidelines-placer.ts`：安全寫入執行器（dry-run/backup/force/受管標記+checksum）。
    - `src/tools/guidelines-apply-config.ts`：批次執行（串接 loader + placer）並彙總結果。
  - `src/server.ts`：已註冊 MCP 工具 `guidelines.applyGolang`。

- 流程總覽
    1) 準備設定檔（建議：`docs/examples/.guidelinesrc.sample.json` 為參考）。
    2) 以 `applyConfig` 載入設定 → 解析相對路徑基準（設定檔所在目錄或 `process.cwd()`）。
    3) 解析專案根目錄優先序：`absoluteProjectDir` > `packages/<name>` > repo 根。
    4) 展開 `projects[].targets[]` → 逐一呼叫 `placeGuidelines` 寫入（或 dry-run）。
    5) 回傳 per-target 與 overall 統計（`added/updated/skipped/conflict`）。
    6) 建議先以 `dryRun: true` 驗證，必要時開啟 `backup: true` 再配合 `force: true` 覆寫。

- MCP 工具：`guidelines.applyGolang`
    - Input（Zod schema）：
        - `projectPath: string`（必須為絕對路徑）
        - `overrides?: { addManagedHeader?: boolean; dryRun?: boolean; backup?: boolean; force?: boolean }`
    - 行為：讀取 `settings/guidelines-golang.json`，為每個 project 注入 `absoluteProjectDir=projectPath`，再呼叫內部的
      `applyConfig` runner。
    - Output：結構同 `apply-config` 模組回傳（overall 與 per-target 統計）。

- 程式內呼叫範例（TypeScript/ESM）
  ```ts
  import { applyConfig } from './src/tools/guidelines-apply-config.js';

  const result = await applyConfig({
    tool: 'codex-cli',
    configObject: {
      version: 1,
      defaults: { addManagedHeader: true, dryRun: true },
      projects: [
        { name: 'p1', targets: [{ language: 'typescript', category: 'project', sourcePath: 'docs/guide.md' }] }
      ],
    },
  });
  console.log(result.overall);
  ```

- 安全寫入策略（placer）
    - 新檔：`added`（dry-run 不落盤）。
    - 內容相同：`skipped`（reason=`identical`）。
    - 內容不同：預設 `conflict`；若 `force=true` → `updated`（可配合 `backup=true`）。
    - 受管標記：`<!-- managed-by: mcp-spec-driven; checksum: <sha256> -->` 置於檔首（`addManagedHeader=true`）。

## 常见问题

- 启动失败：请确认已执行 npm run build，且 dist/index.js 存在。
- 找不到可执行文件：将 "command": "node" 或 "args" 中的路径改为绝对路径。
- 权限问题（Linux/macOS）：确认 node 与项目目录具有合适的执行/读取权限。
- 日志/排错：可先手动运行 node dist/index.js，观察控制台输出以定位问题。

## Guidelines 設定與驗證

- 範例設定檔：`docs/examples/.guidelinesrc.sample.json`
- 常見錯誤：`docs/guidelines-common-errors.md`
- 單元測試（建議在本機先跑）：
    - schema 驗證：`npm test -- __tests__/docs/sample-config.test.ts`
    - loader：`npm test -- __tests__/config/loader.test.ts`
    - placer：`npm test -- __tests__/tools/guidelines-placer.test.ts`
    - apply-config：`npm test -- __tests__/tools/guidelines-apply-config.test.ts`
  - （無）MCP 工具整合測試：目前未提供對 `guidelines.applyGolang` 的端對端測試。
