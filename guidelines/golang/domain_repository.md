# Domain Repository

领域仓储接口定义了对领域模型的持久化操作，位于 `domain/repository` 目录。

## 接口定义规范

```
// 示例：OverviewRepository 接口
type OverviewRepository interface {
    UpsertBatch(overview []*model.Overview) error
    FindBySummaryId(summaryId string) ([]*model.Overview, error)
    DeleteAll() error
}
```

## 接口方法命名规范

- **查询方法**：以 `Find`, `Get`, `Query` 等开头
    - `FindById(id string) (*model.Entity, error)`
    - `FindAll() ([]*model.Entity, error)`
    - `FindByField(value string) ([]*model.Entity, error)`

- **更新方法**：以 `Update`, `Upsert`, `Save` 等开头
    - `Update(entity *model.Entity) error`
    - `UpsertBatch(entities []*model.Entity) error`
    - `Save(entity *model.Entity) error`

- **删除方法**：以 `Delete`, `Remove` 等开头
    - `DeleteById(id string) error`
    - `DeleteAll() error`
    - `DeleteByField(value string) error`

## 最佳实践

1. 接口应该定义在领域层，实现在持久化层
2. 方法命名应清晰表达其功能和参数
3. 返回适当的错误信息，不要吞掉错误
4. 接口方法应该是原子操作
5. 复杂查询应该有明确的方法名和参数
6. 批量操作应该提供事务支持
7. 避免在接口中暴露底层数据库细节