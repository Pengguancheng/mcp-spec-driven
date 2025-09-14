使用下方「規格與計畫」生成任務清單。輸出「僅 JSON」陣列，不含解說文字。

Specification:
{{spec}}

Plan:
{{plan}}

產出將寫入：TASKS.json

原則
- 測試優先：先產生契約與測試任務，再產生實作任務。
- 獨立可測：每一任務聚焦一件事，可單獨驗證與交付。
- 可追蹤：盡量在任務中標註 REQ/NFR/AC 映射（trace）。

輸出格式（請回傳 JSON 陣列；每個任務物件包含）
- id（例如 "T1"）
- title
- summary
- rationale
- steps（簡潔步驟陣列）
- files（路徑或模式；含新檔）
- acceptance_tests（清楚、可執行的檢查；如能，引用 AC-xxx）
- dependencies（任務 id 陣列）
- estimate（例如 "1-2h"）
- risk（"low" | "medium" | "high"）
- validation（驗證方式與步驟："unit" | "integration" | "e2e" | "manual"；列出指令/期望輸出/通過準則/產物）
- status（"todo" | "in_progress" | "blocked" | "done"）

狀態語意
- todo：尚未開始
- in_progress：進行中
- blocked：受依賴或外部因素阻擋
- done：已完成且通過驗收測試

處理不確定性的方式
- 若存在重大不確定，請將第一個任務設為「Clarify requirements」，status 設為 "blocked"，在 steps 中列出具體澄清問題；其餘任務以其為 dependencies，保持有效 JSON 輸出。

校驗指引
- 指定驗證方法（unit/integration/e2e/manual），並提供確切流程/指令與環境需求。
- 定義預期輸出、通過標準與產物（例如測試報告）。
- 每個任務需有可執行的驗收檢查與明確通過條件。
- 合理拆分與依賴；優先產生契約與測試任務，並標註 trace 至 AC-xxx。

回應務必為有效 JSON，且僅包含任務陣列。
