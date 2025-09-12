# MicroService 通用開發 Guidelines

## 專案結構與職責

每個微服務應採用以下分層架構，並在專案目錄中清楚標註各層職責：

#### 分層架構與路徑職責

```
{ServiceName}/
├── {ServiceName}.Domain/           # 領域層：
│   ├── Model/                      #   業務實體定義
│   ├── Dto/                        #   資料傳輸物件
│   ├── Repository/                 #   倉儲介面
│   ├── Action/                     #   核心業務動作
│   └── Service                     #   封裝 Controller 提供給外部參考 nuget package 使用 HTTP 呼叫服務
├── {ServiceName}.Persistent/      # 持久層：
│   ├── Mongo/                      #   MongoDB 實作
│   ├── Redis/                      #   Redis 實作
│   └── Sql/                        #   SQL 實作
├── {ServiceName}.Ap/              # 應用層：
│   ├── Service/                    #   gRPC/API 服務實作
│   ├── Handler/                    #   訊息與事件處理
│   │   ├── Rmq/                    #   RabbitMQ 訊息處理：訂閱並處理隊列消息
│   │   ├── MinIO/                  #   MinIO 事件處理：處理對象存儲相關事件
│   │   ├── Ms/                     #   微服務通信處理：協調微服務間消息
│   │   └── {ServiceName}/          #   服務專屬事件處理
│   ├── Procedure/                  #   業務流程實作
│   │   └── {EntityName}Procedure/  #   特定實體流程實作
│   └── Model/                      #   應用層專用模型
└── {ServiceName}.Ap.Tests/        # 測試層：
    └── 測試專案（單元與整合測試）
```

### 依賴層次結構與規則

* Domain 層不依賴其他專案
* Persistent 可依賴 Domain
* Ap 可依賴 Domain, Persistent
* Tests 只依賴對應被測試專案
* 禁止循環依賴與 Tests 交叉引用

## 命名規範

| 類型    | 規則                      | 範例                    |
|-------|-------------------------|-----------------------|
| 實體    | PascalCase              | `Video`, `VideoFile`  |
| DTO   | 名稱 + `Dto`              | `VideoFilterDto`      |
| 倉儲介面  | `I` + 名稱 + `Repository` | `IVideoRepository`    |
| 倉儲實作  | 名稱 + `Repository`       | `VideoRepository`     |
| 服務    | 名稱 + `Service`          | `VideoProcessService` |
| 訊息處理器 | 名稱 + `Handler`          | `VideoUploadHandler`  |
| 事件    | 名稱 + `Event`            | `VideoPresentedEvent` |
| 私有屬性  | camelCase（無底線）          | `videoId`, `userName` |

## Procedure

`Procedure` 採用責任鏈模式（Chain of Responsibility）來構建複雜的業務流程。此模式將一系列處理單元（`IProcedureProcess`
）鏈接起來，並使用一個共享的上下文（`IProcedureContext`）來傳遞狀態。`BaseProcedure<TCtx>`
作為流程的起點與串聯者，確保每個單元依序執行，並在發生錯誤時自動中斷鏈式調用。

這種設計使得每個業務邏輯單元化、可重用，並簡化了錯誤處理流程，提高了程式碼的可讀性與可維護性。

#### 核心組件

1. **`IProcedureContext`**: 定義了在整個流程中傳遞的共享資料上下文。`BaseProcedureContext` 為其基礎實作，包含了處理成功與否的狀態（
   `IsSuccess`）以及異常信息（`Exception`）。
2. **`IProcedureProcess<TCtx>` / `IProcedureProcess<TCtx, TParam>`**: 代表流程中的一個獨立處理步驟。每個 `Process`
   方法接收上下文，執行特定任務，然後返回更新後的上下文。
3. **`IProcedure<TResultCtx>`**: 定義了流程的執行契約，包含 `Execute` 方法用於串聯處理步驟。
4. **`BaseProcedure<TResultCtx>`**: `IProcedure` 的具體實作，通過靜態方法 `From(context)` 啟動一個新的流程。它會依序執行鏈中的每個
   `Process`，如果任何步驟將 `Exception` 設置到上下文中，後續的所有步驟將被自動跳過。

#### Procedure 實作模式

以下是一個計算流程的範例，演示如何使用 `BaseProcedure` 進行鏈式操作與錯誤處理。

##### 定義上下文（Context)

上下文應繼承 `BaseProcedureContext` 並包含流程所需的資料。

## 依賴層次（Dependencies）

- Domain 不依賴其他層。
- Persistent 可依賴 Domain。
- Ap 可依賴 Domain、Persistent。
- Tests 只依賴被測專案；禁止循環依賴與交叉引用。

## 命名規範（Naming）

- 實體：PascalCase（例：Video, VideoFile）
- DTO：名稱 + Dto（例：VideoFilterDto）
- Repository 介面：I + 名稱 + Repository（例：IVideoRepository）
- Repository 實作：名稱 + Repository（例：VideoRepository）
- 服務：名稱 + Service（例：VideoProcessService）
- Handler：名稱 + Handler（例：VideoUploadHandler）
- 私有屬性：camelCase（無底線）

## Procedure（流程）

- 採用 Chain of Responsibility 將多個處理步驟串接，使用共享 Context 傳遞狀態/錯誤。
- 原則：單一步驟單一職責、流程可中斷、錯誤集中於 Context。
- 控制器僅協調並呼叫對應 Procedure 完成複雜業務。

## 測試（Testing）

- 單元測試遵循 AAA（Arrange-Act-Assert）。
- 測試名稱清晰可讀，單測只覆蓋一個行為；核心邏輯需有覆蓋。
- 依賴以 DI/容器注入（可用 Mock）確保可重複且獨立。

## Repository（資料存取）

- 優先以介面定義（在 Domain），實作放 Persistent。
- 回傳值一律採 `(Exception? ex, T? record)` 或 `(Exception? ex, IEnumerable<T> records)` 風格。
- Mongo 批量操作使用 UpdateMany/FindOneAndReplace 等具體能力，索引於初始化建立。

## Handler（訊息與事件）

- 僅負責解析訊息、取得鎖、建立 scope、委派 Procedure，錯誤記錄並回傳處理結果。

## Controller（API）

- 輕薄：定義路由、參數綁定、委派 Procedure 或簡單呼叫 Repository/Action。
- 回應統一：成功以 200 回傳資料；業務錯誤以 200 + 業務錯誤碼；系統錯誤回 500。

## Domain Service（跨服務呼叫）

- 封裝 HTTP/gRPC 細節，提供強型別方法。
- 回傳 `(Exception ex, TResult result)`；成功 ex 為 null，失敗帶 Exception，呼叫端必須顯式處理。

## 開發注意事項（Notes）

- 分布式鎖：需於關鍵路徑/Controller 取得鎖後再執行流程。
- 錯誤處理：業務錯誤以自定義 Exception（含 Code）放入 Context；系統錯誤記錄並回 500。

## 程式碼品質（Code Quality）

- 公開屬性/方法需有註解；日誌與錯誤訊息使用英文。
- 屬性初始化有預設值（如字串為 ""，列表為 new List<>()）。
- 嚴格 try/catch 並紀錄錯誤；避免過度耦合與跨層依賴。
