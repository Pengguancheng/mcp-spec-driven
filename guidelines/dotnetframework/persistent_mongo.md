# 持久層：MongoDB Repository 規範

- SaveMany 方法應使用 `UpdateManyModel` 進行批量更新，Id 使用外部傳入。

```csharp
public class VideoRepository : IVideoRepository
{
    public static readonly string CollectionName = "videos";
    private readonly IMongoCollection<Video> collection;
    static VideoRepository() { /* BsonClassMap ... */ }
    public VideoRepository(MongoClient mongoClient, string databaseName)
    {
        collection = mongoClient.GetDatabase(databaseName).GetCollection<Video>(CollectionName);
        collection.Indexes.CreateOne(new CreateIndexModel<Video>(Builders<Video>.IndexKeys.Descending(x => x.Code)));
    }
    public (Exception? ex, Video? record) Save(Video input)
    {
        try
        {
            var filter = Builders<Video>.Filter.Eq(x => x.Id, input.Id);
            var options = new FindOneAndReplaceOptions<Video> { IsUpsert = true, ReturnDocument = ReturnDocument.After };
            var result = collection.FindOneAndReplace(filter, input, options);
            return (null, result);
        }
        catch (Exception ex)
        {
            return (ex, null);
        }
    }
}
```
