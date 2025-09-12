# Guidelines 放置功能規格（多程式語言 × 多工具）

## Overview

- 目的：提供一個安全、可自動化的「guidelines 放置」能力，將使用者提供的 Markdown 文件，依照「程式語言（例如 C#、Go、TypeScript…）×
  AI coding tool（例如 Codex CLI、JetBrains AI…）× 類別（project/repository/handler/domain-model）」的維度，放置到正確的目錄結構中。
- MVP 範圍：僅負責「放置」與「安全更新」；不自動產生內容、不從既有文件抽取/合成內容。
- 支援單一倉庫與 monorepo（packages/*）。
- 提供 MCP tool：`guidelines.applyGolang`、`guidelines.applyDotnetframework`。

## Goals

- 支援多種「程式語言」與「AI coding tool」的目錄落盤策略（tool 由客戶端請求時帶入）。
- 提供 MCP tool 操作介面（無 CLI），可用於互動與自動化。
- 提供安全機制（dry-run、backup、force、受管標記 + checksum）避免誤覆寫。
- 產出結構清晰，便於人與 AI coding tool 消費。

## Non-Goals

- 不進行內容自動生成（無模板渲染、無內容拼裝）。
- 不進行從 AGENTS.md/README/docs 的內容抽取與合成（後續可擴充）。
- 不處理人類語言 i18n（本規格中的「語言」係指程式語言）。
- 不生成可執行範例專案（僅放置使用者提供之 Markdown）。

## Scope and Constraints

- 技術棧：TypeScript（ESM/NodeNext）、Jest（ts-jest, ESM）、ESLint + Prettier。
- 目錄：src/, __tests__/, dist/；禁止直接編輯 dist/。
- 中文註解與文件敘述；Log/Exception 使用英文；命名/API 維持英文化慣例。
- 路徑規則：
    - 單一專案：`guidelines/<language>/<tool>/<category>/...`
    - monorepo：`packages/<pkg>/guidelines/<language>/<tool>/<category>/...`
- 類別（category）預設值：`project`、`repository`、`handler`、`domain-model`；允許擴充任意字串。

## Functional Requirements

1) 資料模型（放置請求）

- 欄位：
    - `packageName?: string` — 指定 monorepo 的目標 package；未指定時預設當前 repo 根目錄。
    - `language: string` — 程式語言（例如 `csharp`、`golang`、`typescript`、`python`）。
    - `tool: string` — AI coding tool（例如 `codex-cli`、`jetbrains-ai`）。
    - `category: string` — 類別（`project`/`repository`/`handler`/`domain-model` 或自定）。
    - `files: Array<{ sourcePath?: string; content?: string; targetFileName?: string }>` — 檔案來源二擇一（`content` 優先於
      `sourcePath`）；未提供 `targetFileName` 則取 `sourcePath` 之 basename，皆無則預設 `README.md`。
    - `dryRun?: boolean` — 僅輸出結果與差異摘要，不落盤。
    - `backup?: boolean` — 寫入前備份既有檔至 `.backups/guidelines-<timestamp>/`。
    - `force?: boolean` — 內容不同時允許覆寫；預設遇到差異即視為衝突並跳過。
    - `addManagedHeader?: boolean` — 在 Markdown 開頭寫入 `managed-by` 與 `checksum` 標記，利於後續檢測。

3) 安全更新策略

- 若目標檔不存在：狀態 `added`（dry-run 時不落盤）。
- 若目標檔存在且與新內容相同：狀態 `skipped`（reason=`identical`）。
- 若目標檔存在且不同：
    - 預設：狀態 `conflict`，不覆寫；回傳差異摘要（描述層級）。
    - `force=true`：狀態 `updated`；如 `backup=true` 先備份，再寫入。
- 受管標記：
    - 於 Markdown 首行加入 `<!-- managed-by: mcp-spec-driven; checksum: <sha256> -->`（可由 `addManagedHeader` 控制）。

4) 設定檔（config）

- 目的：以設定檔驅動「放置」操作，支援動態新增類別，並清楚指定「專案位置、目錄絕對路徑、guideline 類別、guidelines Markdown 檔路徑」。
- 檔名建議：`.guidelinesrc.json`（亦可以 `--config` 指定任意路徑）。
- 結構（Zod 風格示意）：
    - `version: number` — 設定檔版本（例如 1）。
    - `defaults?: { addManagedHeader?: boolean; dryRun?: boolean; backup?: boolean; force?: boolean }`
    - `projects: Array<{
      name: string;
      // 「專案位置」定義（二擇一或同時提供，以 absoluteProjectDir 優先）
      packageName?: string;            // monorepo 下的套件名稱 => packages/<name>
      absoluteProjectDir?: string;     // 專案目錄的絕對路徑（可覆寫 packageName 推導）
      targets: Array<{
        language: string;              // 例如 csharp / golang / typescript
        category: string;              // 「guideline 類別」可動態新增，例如 project/repository/.../自定
        targetDirAbs?: string;         // 「目錄的絕對路徑」；若提供則直接寫入此目錄（覆寫預設路徑）
        targetDirRel?: string;         // 「相對於專案根的目錄路徑」；若提供則寫入 <projectRoot>/<targetDirRel>
        sourcePath: string;            // 單一 Markdown 來源檔（相對或絕對）
        fileNameByTool?: Record<string, string>; // 依 tool 指定檔名（例如 { "codex-cli": "AGENTS.md" }）
        defaultFileName?: string;      // 未匹配 tool 時的預設檔名（預設 README.md）
      }>;
    }>`
- 預設寫入目錄：若 `targetDirAbs` 未提供，則：
    - 根據 `absoluteProjectDir`（若提供）或 `packages/<packageName>`（若提供）或 repo 根目錄，推導 `projectRoot`。
  - 如提供 `targetDirRel`，目標目錄：`<projectRoot>/<targetDirRel>`；否則為
    `<projectRoot>/guidelines/<language>/<tool>/<category>`（tool 由客戶端請求帶入，例如 `codex-cli`）。
- 範例：
  ```json
  {
    "version": 1,
    "defaults": { "addManagedHeader": true, "backup": true },
    "projects": [
      {
        "name": "repo-root",
        "absoluteProjectDir": "/abs/path/to/this-repo",
        "targets": [
          {
            "language": "golang",
            "category": "repository",
            "sourcePath": "guidelines/golang/domain_repository.md",
            "fileNameByTool": { "codex-cli": "AGENTS.md" },
            "defaultFileName": "README.md"
          },
          {
            "language": "golang",
            "category": "rules",
            "sourcePath": "guidelines/golang/rule.md",
            "fileNameByTool": { "codex-cli": "AGENTS.md" },
            "defaultFileName": "README.md"
          }
        ]
      }
    ]
  }
  ```

5) Config Domain Model（定義與驗證）
   （更新）依據最新決策：

- 設定檔每個 target 僅對應「單一來源檔」：用 `sourcePath` 表示，移除 `files` 陣列。
- 設定檔不包含 `tool` 欄位；`tool` 由客戶端於請求時提供，用以決定最終輸出路徑中的 `<tool>` 與檔名。
- 新增 `fileNameByTool` 與 `defaultFileName`：
    - 例如：`fileNameByTool = { "codex-cli": "AGENTS.md" }`，其餘工具用 `defaultFileName`（預設 `README.md`）。
    - 如提供 `targetDirAbs` 則忽略 `<tool>/<category>` 目錄規則，直接落至該目錄，僅檔名仍依工具對應。
- 命名與正規化：
    - `language`/`tool`/`category` 僅允許 `[a-z0-9-]`，寫入前一律轉為小寫並將空白轉為 `-`（kebab-case）。
    - `targetFileName` 不得包含路徑分隔符（`/`、`\`），僅檔名（建議 `[A-Za-z0-9._-]`）。
- 解析基準：
    - `absoluteProjectDir` 與 `targetDirAbs` 必須為絕對路徑；
    - `sourcePath` 可相對或絕對；相對路徑以「設定檔所在目錄」為基準（若以 MCP 傳 `configObject`，則以 `process.cwd()` 為基準）。
- 專案位置優先序：`absoluteProjectDir` > `packageName` > repo 根目錄。
- 目標目錄優先序：`targetDirAbs` > `targetDirRel` > `<projectRoot>/guidelines/<language>/<tool>/<category>`。
- 必填驗證：
    - `projects` 非空；每個 `project.targets` 非空；每個 target 的 `sourcePath` 必填；
    - `language`/`category` 不可為空字串；
    - `fileNameByTool`（若提供）之 key 需符合 `^[a-z0-9-]+$`，值為合法檔名（不可含分隔符）。
- Zod Schema（概念）：
    - `ConfigRoot`：`version: number`、`defaults?: Defaults`、`projects: ProjectConfig[]`
    - `Defaults`：`addManagedHeader?`、`dryRun?`、`backup?`、`force?`
    - `ProjectConfig`：`name: string`、`packageName?: string`、`absoluteProjectDir?: string`、`targets: TargetConfig[]`
  - `TargetConfig`：`language: string`、`category: string`、`sourcePath: string`、`targetDirAbs?: string`、
    `targetDirRel?: string`、
      `fileNameByTool?: Record<string, string>`、`defaultFileName?: string`
- JSON Schema（簡化草案）：
    - `$schema: https://json-schema.org/draft/2020-12/schema`；
    - 於 `language`、`category` 加上 `pattern: "^[a-z0-9-]+$"`；`fileNameByTool` 的 key 亦同；
    - `targetDirAbs`/`absoluteProjectDir` 加 `format: "uri-reference"`（約定為絕對路徑，實作時再做 `path.isAbsolute` 驗證）。
- 常見錯誤與訊息（英文）：
    - `Invalid category: must match /^[a-z0-9-]+$/`；
    - `Source path must be provided`；
    - `absoluteProjectDir must be an absolute path`；
    - `Invalid target file name for tool '<id>'`；
    - `Either packageName or absoluteProjectDir is required`（若策略要求至少一者）。

- 與寫入引擎（placer）的契合：
    - 寫入引擎以「專案絕對路徑 + 檔案相對路徑」定位目標檔；
    - expandConfig 會把設定轉為 placer 需要的 `targetRelPath`：
        - 先決定 `projectRootDir`（依專案位置優先序），再決定 `targetBaseDir`（依目標目錄優先序）；
        - 檔名：以 `fileNameByTool[tool]` 優先，否則 `defaultFileName`，預設 `README.md`；
        - `targetRelPath = relative(projectRootDir, join(targetBaseDir, targetFileName))`；
        - 呼叫 placer 時傳入：`{ targetProjectDirAbs: projectRootDir, targetRelPath }`。

-
    6) MCP tools

- `guidelines.applyGolang`
    - 目的：僅需提供「目標專案路徑」，即套用 Golang 的預設 guidelines 設定。
    - 預設設定檔位置：`settings/guidelines-golang.json`。
    - Input：
        - `projectPath: string` — 目標專案路徑（必須為絕對路徑；若為相對路徑，將回報錯誤）。
        - `overrides?: { addManagedHeader?: boolean; dryRun?: boolean; backup?: boolean; force?: boolean }`
    - 行為：載入 Golang 預設設定，將其中每個 project 注入 `absoluteProjectDir=projectPath`（並清空 `packageName` 以避免歧義），再呼叫
      內部的 `apply-config` runner。
    - Output：等同 `apply-config` 模組輸出結構（overall 與 per-target 統計）。

- `guidelines.applyDotnetframework`
    - 目的：僅需提供「專案名稱」與「目標專案路徑」，即套用 .NET Framework 的預設 guidelines 設定，並依名稱置換相對路徑。
    - 預設設定檔位置：`settings/guidelines-dotnetframework.json`。
    - Input：
        - `projectName: string` — 專案名稱；將置換設定中的 `{{projectName}}` 佔位符。
        - `projectPath: string` — 目標專案路徑（必須為絕對路徑；若為相對路徑，將回報錯誤）。
        - `overrides?: { addManagedHeader?: boolean; dryRun?: boolean; backup?: boolean; force?: boolean }`
    - 行為：載入預設設定，將其中每個 project 注入 `absoluteProjectDir=projectPath`（並清空 `packageName` 以避免歧義），
      並將所有 `targets[].targetRelPath` 的 `{{projectName}}` 佔位符替換為 `projectName` 後，呼叫內部的 `apply-config`
      runner。
    - Output：等同 `apply-config` 模組輸出結構（overall 與 per-target 統計）。

6) 回報與可觀測性

- dry-run：彙總各檔狀態與將進行之操作，必要時提供精簡 diff 摘要（截斷）。
- 實際寫入：回傳與 dry-run 一致的統計，並標示備份位置（若啟用）。

## Non-Functional Requirements

- Idempotent：同一請求在無內容變更時不得產生新寫入。
- 可擴充：新增語言/工具/類別不需改動核心流程（擴充僅影響路徑與檔名）。
- 效能：本地 I/O 為主；100 檔以內操作在一般開發機上 < 3s。
- 可讀性：Markdown 內容不主動重寫或格式化（交由使用者/CI 處理）。
- 錯誤處理：區分「使用者錯誤」（路徑/參數/不存在）與「系統錯誤」（I/O、權限），回傳具體 actionable 訊息（英文）。

## Risks & Mitigations

- 誤覆寫手動修改：預設不覆寫（conflict），提供 `--backup` 與 `--force` 選項；支援受管標記與 checksum。
- 目錄結構不一致（單倉/monorepo）：以 `packageName` 明確指定；未指定則寫入 repo 根。
- 大量檔案導致操作時間過久：先行 dry-run；可分批提交；後續可加入並行與節流。

## Acceptance Criteria

- SPEC.md 包含設定檔 Domain Model 的完整定義：欄位、正規化規則、路徑解析基準、驗證條件與常見錯誤訊息。
- 設定檔結構可支援：
    - 動態類別 category；
    - 指定專案位置（`packageName` 或 `absoluteProjectDir`）；
    - 覆寫目標目錄絕對路徑（`targetDirAbs`）；
    - 指定單一 guidelines Markdown 檔案路徑（`sourcePath`）。
- PLAN.md 與 SPEC.md 與實作一致，文件包含 `guidelines.applyGolang` 的 `projectPath` 與 `guidelines.applyDotnetframework`
  的 `projectName`/`projectPath` 參數定義與行為說明。

## Open Questions

- 類別（category）是否需要預設更多項目（例如 `service`、`use-case`、`controller`）？
- 是否需要提供「批次多組（language × tool × category）」的單一請求支援（一次投遞多個目標）？
- 是否需要提供 per-file 自訂子路徑（例如 `project/architecture.md` 與 `project/README.md`）？
- 是否需要在回傳中提供更完整的 diff（例如 unified diff），或以目前的摘要級就足夠？
- 後續是否需要加入「來源抽取/模板合成」為可選功能？如需，何者為優先目標？
