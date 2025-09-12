# Handler（訊息處理）

## RabbitMQ Handler 規範

```csharp
public class VideoUploadEventHandler : IRabbitMqPubSubHandler
{
    public bool Handle(string message)
    {
        try
        {
            var eventData = JsonConvert.DeserializeObject<VideoUploadEvent>(message);
            using var lck = videoLocker.GrabLock(eventData.VideoId);
            using var scope = serviceProvider.CreateScope();
            var ctx = BaseProcedure<CtxVideo>
                .From(new CtxVideo())
                .Execute(scope.ServiceProvider.GetRequiredService<IProResolve>(), new IProResolve.Request { VideoId = eventData.VideoId })
                .Execute(scope.ServiceProvider.GetRequiredService<IProUpdate>(), new IProUpdate.Request { /* 更新參數 */ })
                .GetResult();
            if (ctx.TryGetException(out var exception)) throw exception!;
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, $"處理影片上傳事件失敗: {ex.Message}");
            return false;
        }
    }
}
```
