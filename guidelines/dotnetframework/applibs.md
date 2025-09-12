# Applibs / Application Layer Guidelines (.NET Framework)

## Controller（Ap 層）

Controller 是微服務的入口，負責接收並處理 HTTP 請求。它應保持輕薄，主要職責是協調與委派，而非實作核心業務邏輯。

- 端點定義：使用 `[RoutePrefix]`、`[Route]`
- 請求綁定：使用 `[FromBody]` 或 `[FromUri]`
- 邏輯委派：
    - 複雜多步驟 → 調用 `Procedure`
    - 單一簡單 → 直接調用 `Repository` 或 `Action`
- 依賴注入：透過建構子注入 Service/Repository/ProcedureProcess
- 回應生成：回傳標準 `HttpResponseMessage` 與正確狀態碼

範例：

```csharp
[RoutePrefix("api/gift-check")]
public class GiftCheckController : ApiController
{
    private readonly IUserInfoService userInfoSvc;
    private readonly IGiftSettingService giftSettingSvc;
    private readonly IAnchorInfoService anchorInfoSvc;

    public GiftCheckController(IUserInfoService userInfoSvc, IGiftSettingService giftSettingSvc, IAnchorInfoService anchorInfoSvc)
    {
        this.userInfoSvc = userInfoSvc;
        this.giftSettingSvc = giftSettingSvc;
        this.anchorInfoSvc = anchorInfoSvc;
    }

    [HttpPost]
    public HttpResponseMessage Post([FromBody]GiftCheckDto input)
    {
        try
        {
            var checkPro = new BasicGiftCheckProcedure(
                    input,
                    this.userInfoSvc,
                    this.giftSettingSvc,
                    this.anchorInfoSvc);

            checkPro.SetProcedure(new UserInfoProcedure());
            checkPro.SetProcedure(new GiftSettingProcedure());
            checkPro.SetProcedure(new AnchorProcedure());
            checkPro.SetProcedure(new OrderProcedure());

            var response = checkPro.GetResponse();

            var result = new HttpResponseMessage(HttpStatusCode.OK);
            result.Content = new ByteArrayContent(response.ToProto());
            result.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

            return result;
        }
        catch (Exception ex)
        {
            this.logger.Error(ex, "An error occurred.");
            return this.Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex);
        }
    }
}
```

## Domain Service（Domain 層外部呼叫封裝）

- 封裝通訊細節（HttpWebRequest/HttpClient 等）
- 序列化處理（JSON/Protobuf）
- 強型別介面（如 `IGiftMenuService`）
- 錯誤處理模式：回傳 `(Exception exception, TResult result)`，成功時 `exception=null`，錯誤時填入 `Exception` 並將
  `result=null`

## 開發注意事項

### 分布式鎖的使用模式

所有控制器方法都應使用以下模式獲取鎖：

```csharp
using (var redLock = translationLocker.GrabLock(taskId, 10))
  { 
      // 業務邏輯實現
  }
```

### 錯誤處理規範

業務邏輯錯誤應使用 `TranslationException` 並附帶相應的 `TranslationStatusCode`：

```csharp
public class TranslationException : BaseProcedureException<TranslationStatusCode>
  {
      public TranslationException(TranslationStatusCode code, string stage, string message) 
          : base(code, stage, message) { }
  }

  public enum TranslationStatusCode
  {
      TaskNotFound = 1001,
      InvalidLanguagePair = 1002,
      EmptySourceText = 1003,
      ServiceUnavailable = 1004,
      TranslationFailed = 1005,
      TaskAlreadyCompleted = 1006
  }
```

業務邏輯錯誤應返回 HTTP 200 + 錯誤狀態碼：

```csharp
[HttpPost]
  [Route("translate")]
  public HttpResponseMessage Translate([FromBody] TranslateDto input)
  {
      try
      {
          // 業務邏輯處理...
          return Request.CreateResponse(HttpStatusCode.OK, result);
      }
      catch (TranslationException ex)
      {
          var errorResponse = new {
              Success = false,
              ErrorCode = (int)ex.Code,
              Message = ex.Message
          };
          return Request.CreateResponse(HttpStatusCode.OK, errorResponse);
      }
      catch (Exception ex)
      {
          _logger.Error(ex, "翻譯處理失敗");
          return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, "系統處理錯誤");
      }
  }
```

## 程式碼品質規範

- 註解：所有公開屬性與方法須有 XML 文件註解
- 錯誤處理：使用 try/catch 並記錄錯誤至 logger，並設置上下文異常
- 日誌與錯誤訊息使用英文
- 屬性初始化：必須有預設值（如字串為 `""`，列表為 `new List<>()`）