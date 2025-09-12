# Domain Model

领域模型是业务实体的抽象表示，位于 `domain/model` 目录。

## 模型定义规范

```
// 示例：Overview 模型
type Overview struct {
    Id                 string    `json:"id" bson:"_id"`
    SummaryId          string    `json:"summary_id" bson:"summary_id"`
    Symbol             string    `json:"symbol" bson:"symbol"`
    ProfitPercent      float64   `json:"profitPercent" bson:"profit_percent"`
    ProfitValue        float64   `json:"profitValue" bson:"profit_value"`
    // ... 其他字段
    CreatedAt          time.Time `json:"createdAt" bson:"created_at"`
}
```

## Proto 转换方法

每个模型应提供与 Protocol Buffers 消息之间的转换方法：

```
// 从 Proto 转换到模型
func FromAgentOverviewProto(protoData *pb.Overview) *Overview {
    // 转换逻辑
    return &Overview{
        // 字段映射
    }
}

// 从模型转换到 Proto
func (o *Overview) ToProto() *pb.Overview {
    // 转换逻辑
    return &pb.Overview{
        // 字段映射
    }
}
```

## 最佳实践

1. 模型应该是纯粹的数据结构，不包含业务逻辑
2. 使用适当的标签来支持序列化和反序列化
3. 提供清晰的转换方法，确保数据一致性
4. 遵循命名规范，确保字段名称的一致性
5. 为复杂模型提供构造函数或工厂方法