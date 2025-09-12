# 常見錯誤訊息與排查

> 文件使用中文；錯誤訊息使用英文，便於檢索。

- Invalid category: must match /^[a-z0-9-]+$/
    - 說明：`category` 僅允許小寫英數與連字號；請改成如 `project/repository/handler/domain-model` 或自定小寫識別字。

- Invalid language: must match /^[a-z0-9-]+$/
    - 說明：`language` 僅允許小寫英數與連字號，例如 `golang`、`typescript`、`python`。

- Source path must be provided
    - 說明：`targets[].sourcePath` 必填，填入 Markdown 檔案相對或絕對路徑。

- absoluteProjectDir must be an absolute path
    - 說明：`absoluteProjectDir` 必須為絕對路徑（以 `/` 或磁碟代號開頭）。

- targetDirAbs must be an absolute path
    - 說明：`targetDirAbs` 為覆寫目標目錄時，必為絕對路徑。

- Invalid tool id: must match /^[a-z0-9-]+$/
    - 說明：`fileNameByTool` 的 key（tool id）僅允許小寫英數與連字號，例如 `codex-cli`。

- Invalid target file name for tool '<id>'
    - 說明：目標檔名不可包含路徑分隔符（不可含 `/` 或 `\\`）。

建議排查步驟：

- 先以 `dryRun: true` 驗證設定；
- 使用 `docs/examples/.guidelinesrc.sample.json` 作為參考；
- 若仍有疑問，請縮小設定檔至最小案例後逐步擴充。

