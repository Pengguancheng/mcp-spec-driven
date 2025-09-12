# Config Domain Model 與 MCP Tools 實作計畫

## Architecture and Components

- 模組分工
    - `src/config/schema.ts`
        - 定義設定檔 Zod schema 與 TypeScript 型別（ConfigRoot/Defaults/ProjectConfig/TargetConfig/FileSpec）。
    - `src/config/normalize.ts`
        - 正規化與驗證輔助：`normalizeId`（toLowerCase + 空白→- + pattern 檢查），`assertAbsolute`，`validateTargetFileName`。
    - `src/config/loader.ts`
        - 載入設定檔（`configPath` 或 `configObject`）；
        - 決定相對路徑基準（設定檔所在目錄或 `process.cwd()`）；
        - 解析專案根目錄優先序（`absoluteProjectDir` > `packages/<packageName>` > repo 根）；
        - 展開 `projects[].targets[]` 並產生可直接呼叫 `placeGuidelines` 的請求。
    - `src/tools/guidelines-placer.ts`
        - 既有放置器（安全寫入、dry-run、backup、force、checksum 標記）。
    - `src/tools/guidelines-apply-config.ts`
        - 依設定檔呼叫 `placeGuidelines`，彙總多個 target 的結果；
        - 回傳總結（per-target 與 overall）。
    - `src/server.ts`
        - 註冊 MCP tools：`guidelines.place`（既有）、`guidelines.applyConfig`（新增）。

## Technology Choices (with rationale)

- Zod：單一來源驗證與推導 TS 型別，錯誤訊息清楚；不新增 JSON Schema 產生器套件以避免相依膨脹。
- Node 標準模組（fs/promises、path、crypto）：檔案 I/O、路徑、checksum。
- Jest（ts-jest, ESM）：針對 schema/loader/placer 進行單元測試與 dry-run/backup 行為驗證。

## Data Model / API Contracts

- 設定檔（ConfigRoot）
    - `version: number`
    - `defaults?: { addManagedHeader?: boolean; dryRun?: boolean; backup?: boolean; force?: boolean }`
    - `projects: Array<{
      name: string;
      packageName?: string;
      absoluteProjectDir?: string; // 必為絕對路徑（若提供）
      targets: Array<{
        language: string; // [a-z0-9-]
        category: string; // 動態，允許 [a-z0-9-]
        sourcePath: string; // 單一檔案來源
        targetDirAbs?: string; // 覆寫目標根目錄，必為絕對路徑（若提供）
        fileNameByTool?: Record<string, string>; // 例如 { "codex-cli": "AGENTS.md" }
        defaultFileName?: string; // 未匹配 tool 的預設檔名（預設 README.md）
      }>;
    }>`
- MCP tool：`guidelines.place`
    - Input：沿用 `PlaceGuidelinesInput`（language/tool/category/source 等）。
    - Output：`{ baseDir, results[], added, updated, skipped, conflict }`。
- MCP tool：`guidelines.applyConfig`
    - Input：
      `{ tool: string; configPath?: string; configObject?: unknown; overrides?: { addManagedHeader?: boolean; dryRun?: boolean; backup?: boolean; force?: boolean } }`
    - Output：
        - `{
        configBaseDir: string;
        targets: Array<{
          projectName: string;
          language: string;
          tool: string;
          category: string;
          targetBaseDir: string;
          summary: { added: number; updated: number; skipped: number; conflict: number };
        }>;
        overall: { added: number; updated: number; skipped: number; conflict: number };
      }`

## Integration Points and External Dependencies

- 與 `src/server.ts` 整合：
    - 新增 `guidelines.applyConfig` 註冊與 Zod input schema；
    - 工具執行期間，Log 使用英文，錯誤以 actionable 訊息回傳。
- 依賴 `guidelines-placer.ts` 作為唯一寫入執行器，避免重複邏輯。
- AGENTS.md 約束：ESM、嚴格型別、命名匯出、中文註解/英文 Log 與 Conventional Commits。

## Milestones and Sequencing

1. schema 與型別
    - 建立 `src/config/schema.ts`（Zod + TS 型別）；
    - 單元測試：合法/不合法案例、錯誤訊息。
2. 正規化與驗證輔助
    - 建立 `src/config/normalize.ts`（normalizeId/assertAbsolute/validateTargetFileName）；
    - 測試：大小寫、空白→-、非法字元、路徑判斷。
3. 設定檔 loader
    - 建立 `src/config/loader.ts`：解析 `configPath` 或 `configObject`、決定基準目錄、展開 targets；
    - 測試：相對路徑基準、project root 優先序、targetDirAbs 覆寫。
4. apply-config 工具
    - 建立 `src/tools/guidelines-apply-config.ts`：呼叫 `placeGuidelines`，彙總輸出；
    - 測試：dry-run/backup/force 聚合統計。
5. 伺服器整合
    - `src/server.ts` 註冊 `guidelines.applyConfig`；
    - 基本回歸測試（工具可被呼叫、輸入/輸出符合 schema）。
6. 文件與範例
    - SPEC.md 已更新 Domain Model；
    - 新增 `docs/examples/.guidelinesrc.sample.json` 與常見錯誤清單。

## Testing & Validation Strategy

- 單元測試覆蓋：
    - schema 解析（有效與失敗）與錯誤訊息；
    - normalize 與路徑絕對性檢查；
    - loader 的相對路徑解析、優先序、空清單錯誤；
    - apply-config 的 dry-run、backup（備份存在）、force（覆寫行為）與統計彙總；
    - placer 的既有路徑覆寫/衝突/跳過（可寫最小白箱測試）。
- 不做整合端到端（E2E）測試，避免環境相依；以單測與小型臨時目錄為主。

## Rollout and Backout Plan

- Rollout：
    - 合併後直接可用（MCP tool）；
    - 提供 sample 設定檔；
    - 建議先以 dry-run 驗證。
- Backout：
    - 工具為新增功能，若需回退可在 `src/server.ts` 停用註冊；
    - 寫入檔案可用 `.backups/` 目錄快速還原。

## Risks and Mitigations

- 誤覆寫現有檔案
    - 預設不覆寫（conflict），需 `force=true`；提供 `backup=true`。
- 路徑解析歧異（相對/絕對）
    - 明確規範基準；loader 嚴格檢查並在 Log 說明。
- 非法識別字（language/tool/category）
    - normalize + Zod pattern；失敗時回報清楚訊息。
- 大型設定檔執行時間
    - 先 dry-run；後續可加入批次與節流（非 MVP）。
- 跨平台差異（Windows 分隔符）
    - 使用 `path` API 與 `path.sep`，禁止 `targetFileName` 含分隔符。
