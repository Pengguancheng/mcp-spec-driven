# Persistent_mongo

MongoDB 持久化实现位于 `persistent/persistent_mongo` 目录，负责实现领域仓储接口。

## 仓储结构

```
// 示例：Overview 仓储实现
type OverviewRepo struct {
    collection *mongo.Collection
}
```

## 仓储创建

```
// 创建 Overview 仓储
func NewOverviewRepository(db *mongo.Database) repository.OverviewRepository {
    collection := db.Collection("overview")
    
    // 创建索引
    indexModel := mongo.IndexModel{
        Keys: bson.D{
            {Key: "summary_id", Value: 1},
            {Key: "symbol", Value: 1},
        },
        Options: options.Index().SetUnique(true),
    }
    
    _, err := collection.Indexes().CreateOne(context.Background(), indexModel)
    if err != nil {
        panic(fmt.Sprintf("Failed to create index for overview collection: %v", err))
    }
    
    // 创建TTL索引（如需要）
    ttlIndexModel := mongo.IndexModel{
        Keys: bson.D{{Key: "created_at", Value: 1}},
        Options: options.Index().SetExpireAfterSeconds(60 * 60 * 24 * 7), // 7天后过期
    }
    
    _, err = collection.Indexes().CreateOne(context.Background(), ttlIndexModel)
    if err != nil {
        panic(fmt.Sprintf("Failed to create TTL index for overview collection: %v", err))
    }
    
    return &OverviewRepo{
        collection: collection,
    }
}
```

## 批量更新实现

```
// 批量更新或插入
func (r *OverviewRepo) UpsertBatch(overviews []*model.Overview) error {
    if len(overviews) == 0 {
        return nil
    }
    
    // 准备批量写入操作
    var operations []mongo.WriteModel
    for _, overview := range overviews {
        // 设置创建时间
        if overview.CreatedAt.IsZero() {
            overview.CreatedAt = time.Now()
        }
        
        // 创建更新模型
        operation := mongo.NewUpdateOneModel().
            SetFilter(bson.M{
                "summary_id": overview.SummaryId,
                "symbol":     overview.Symbol,
            }).
            SetUpdate(bson.M{"$set": overview}).
            SetUpsert(true)
        
        operations = append(operations, operation)
    }
    
    // 执行批量写入
    _, err := r.collection.BulkWrite(
        context.Background(),
        operations,
        options.BulkWrite().SetOrdered(false),
    )
    
    return err
}
```

## 查询实现

```
// 根据摘要ID查询
func (r *OverviewRepo) FindBySummaryId(summaryId string) ([]*model.Overview, error) {
    // 创建过滤器
    filter := bson.M{"summary_id": summaryId}
    
    // 执行查询
    cursor, err := r.collection.Find(context.Background(), filter)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(context.Background())
    
    // 解码结果
    var results []*model.Overview
    err = cursor.All(context.Background(), &results)
    if err != nil {
        return nil, err
    }
    
    return results, nil
}
```

## 删除实现

```
// 删除所有数据
func (r *OverviewRepo) DeleteAll() error {
    _, err := r.collection.DeleteMany(context.Background(), bson.M{})
    return err
}
```

## 最佳实践

1. 为每个集合创建适当的索引，提高查询性能
2. 使用TTL索引自动清理过期数据
3. 批量操作使用BulkWrite，提高性能
4. 使用上下文控制操作超时
5. 正确处理MongoDB错误，提供有意义的错误信息
6. 使用事务保证数据一致性（MongoDB 4.0+）
7. 避免在仓储层进行业务逻辑处理