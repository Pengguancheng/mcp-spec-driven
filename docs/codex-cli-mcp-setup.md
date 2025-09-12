# 使用 Codex CLI 配置本地 MCP Server（spec-driven）

以下步骤演示如何将本地的 MCP Server（spec-driven）接入到 Codex CLI，配置内容基于你提供的 JSON 片段。

## 前置条件

- 已安装 Node.js（建议 18+）。
- 你的 MCP Server 项目路径为：
  {git_project_path}/mcp-spec-driven
- 该项目已完成构建，并且存在可执行入口 dist/index.js。若未构建，请在该项目目录执行：
    - npm install
    - npm run build

## 在 Codex CLI 中添加 MCP Server 配置

将下面的配置段落加入到 Codex CLI 的配置文件中（例如 Codex CLI 的全局配置文件或你当前使用的配置文件中）。如果 Codex CLI
支持通过命令行参数指定配置文件（如 --config path/to/config.json），你也可以直接使用本仓库提供的 codex.mcp.config.json
作为基础，并与现有配置合并。

配置片段（按你提供的内容保持不变）：

```text
[mcp_servers.spec-driven]
command = "node"
args = ["/mcp_server/mcp-spec-driven/dist/index.js"]
```

```json
{
  "spec-driven": {
    "command": "node",
    "args": [
      "dist/index.js"
    ]
  }
}
```
