# Procedure

`Procedure` 採用責任鏈模式（Chain of Responsibility）來構建複雜的業務流程。此模式將一系列處理單元（`IProcedureProcess`
）鏈接起來，並使用一個共享的上下文（`IProcedureContext`）來傳遞狀態。`BaseProcedure<TCtx>`
作為流程的起點與串聯者，確保每個單元依序執行，並在發生錯誤時自動中斷鏈式調用。

這種設計使得每個業務邏輯單元化、可重用，並簡化了錯誤處理流程，提高了程式碼的可讀性與可維護性。

## 核心組件

1. `IProcedureContext`: 定義了在整個流程中傳遞的共享資料上下文。`BaseProcedureContext` 為其基礎實作，包含了處理成功與否的狀態（
   `IsSuccess`）以及異常信息（`Exception`）。
2. `IProcedureProcess<TCtx>` / `IProcedureProcess<TCtx, TParam>`: 代表流程中的一個獨立處理步驟。每個 `Process`
   方法接收上下文，執行特定任務，然後返回更新後的上下文。
3. `IProcedure<TResultCtx>`: 定義了流程的執行契約，包含 `Execute` 方法用於串聯處理步驟。
4. `BaseProcedure<TResultCtx>`: `IProcedure` 的具體實作，通過靜態方法 `From(context)` 啟動一個新的流程。它會依序執行鏈中的每個
   `Process`，如果任何步驟將 `Exception` 設置到上下文中，後續的所有步驟將被自動跳過。

## Procedure 實作模式

以下是一個計算流程的範例，演示如何使用 `BaseProcedure` 進行鏈式操作與錯誤處理。

### 定義上下文（Context)

上下文應繼承 `BaseProcedureContext` 並包含流程所需的資料。

```csharp
// 計算流程上下文
   public class CalculationContext : BaseProcedureContext
   {
       public int Value { get; set; }
   }

   // 自定義異常
   public class CalculationException : BaseProcedureException<CalculationErrorCode>
   {
       public CalculationException(CalculationErrorCode code, string stage, string message)
           : base(code, stage, message) { }
   }

   public enum CalculationErrorCode { DivideByZero }
```

### 定義處理單元（Process）

每個處理單元實現 `IProcedureProcess`，專注於單一職責。

```csharp
// 初始化計算值
   public class InitCalculationProcess : IProcedureProcess<CalculationContext>
   {
       public CalculationContext Process(CalculationContext ctx)
       {
           ctx.Value = 10;
           return ctx;
       }
   }

   // 加法處理
   public class AddProcess : IProcedureProcess<CalculationContext, int>
   {
       public CalculationContext Process(CalculationContext ctx, int param)
       {
           ctx.Value += param;
           return ctx;
       }
   }

   // 除法處理（可能失敗）
   public class DivideProcess : IProcedureProcess<CalculationContext, int>
   {
       public CalculationContext Process(CalculationContext ctx, int param)
       {
           if (param == 0)
           {
               ctx.Exception = new CalculationException(
                   CalculationErrorCode.DivideByZero,
                   GetType().Name,
                   "除數不能為零"
               );
               return ctx;
           }
           ctx.Value /= param;
           return ctx;
       }
   }
```

### 鏈式執行 Procedure

使用 `BaseProcedure.From(ctx)` 開始，並通過 `Execute` 串聯所有操作。

成功流程範例：

```csharp
var ctx = new CalculationContext();
   var result = BaseProcedure<CalculationContext>.From(ctx)
       .Execute(new InitCalculationProcess())   // 初始值: 10
       .Execute(new AddProcess(), 20)           // 10 + 20 = 30
       .Execute(new DivideProcess(), 3)         // 30 / 3 = 10
       .GetResult();

   if (result.IsSuccess)
   {
       Console.WriteLine($"計算成功，結果: {result.Value}"); // 輸出: 計算成功，結果: 10
   }
```

失敗流程範例：

```csharp
var ctx = new CalculationContext();
   var result = BaseProcedure<CalculationContext>.From(ctx)
       .Execute(new InitCalculationProcess())   // 初始值: 10
       .Execute(new DivideProcess(), 0)         // 執行失敗，設置 Exception
       .Execute(new AddProcess(), 5)            // 此步驟將被自動跳過
       .GetResult();

   if (!result.IsSuccess)
   {
       // 嘗試獲取特定類型的異常
       if (result.TryGetException(out CalculationException ex))
       {
           Console.WriteLine($"計算失敗: {ex.Message}, Code: {ex.Code}");
           // 輸出: 計算失敗: [DivideProcess][DivideByZero]: 除數不能為零, Code: DivideByZero
       }
       Console.WriteLine($"最終數值: {result.Value}"); // 輸出: 最終數值: 10
   }
```

## 測試規範與實踐

### 單元測試規範

1. 單一職責：每個測試應該只測試一個功能點
2. 獨立性：測試之間不應有依賴關係
3. 可重複性：測試應能多次執行並產生相同結果
4. 高可讀性：測試名稱和結構應清晰表達測試意圖
5. 完整覆蓋：核心業務邏輯應有完整的測試覆蓋

命名採用：`方法名_測試場景_預期結果`，例如：`Process_ValidTranslationRequest_TranslatesSuccessfully`

遵循 AAA 模式（Arrange-Act-Assert）。

### 測試依賴注入示例

包含 Autofac 容器、Mock、與生命週期範圍管理的典型範例，詳見原始 Guidelines。

### 單元測試示例

完整測試範例展示如何測試翻譯流程的核心邏輯（含成功與失敗）。