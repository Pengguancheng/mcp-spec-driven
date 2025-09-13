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

## 功能說明

- 本專案提供透過 MCP（stdio）啟動的伺服器與三個文本導向工具：`specify`、`plan`、`tasks`。
- 支援以 Node 18+ 執行，並提供 Jest 測試、ESLint 與 Prettier 設定。

## 常见问题

- 启动失败：请确认已执行 npm run build，且 dist/index.js 存在。
- 找不到可执行文件：将 "command": "node" 或 "args" 中的路径改为绝对路径。
- 权限问题（Linux/macOS）：确认 node 与项目目录具有合适的执行/读取权限。
- 日志/排错：可先手动运行 node dist/index.js，观察控制台输出以定位问题。

## 測試與疑難排解

- 先執行建置再啟動：`npm run build && node dist/index.js`。
- 若 MCP 客戶端啟動失敗，確認 `dist/index.js` 路徑或使用絕對路徑。
- 日誌輸出在 `logs/app.log`，有助於排查問題（英文訊息）。
