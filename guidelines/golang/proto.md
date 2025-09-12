# Proto

协议缓冲定义位于 `proto` 目录，包括消息定义、服务定义和事件定义。

## 消息定义

```
// 示例：OverviewSummary 消息
message OverviewSummary {
    string id = 1;
    int32 symbol_count = 2;
    StatisticValue profit_percent = 3;
    StatisticValue profit_value = 4;
    google.protobuf.Timestamp created_at = 5;
}

// 统计值消息
message StatisticValue {
    double avg = 1;
    double min = 2;
    double max = 3;
    double median = 4;
}
```

## 服务定义

```
// 示例：OverviewSummary 服务
service OverviewSummaryService {
    // 根据ID查询
    rpc FindById(FindByIdRequest) returns (FindByIdResponse);
    
    // 按创建时间排序查询
    rpc SortByCreatedAt(SortByCreatedAtRequest) returns (SortByCreatedAtResponse);
    
    // 删除所有数据
    rpc DeleteAll(google.protobuf.Empty) returns (google.protobuf.Empty);
}

// 请求和响应消息
message FindByIdRequest {
    string id = 1;
}

message FindByIdResponse {
    OverviewSummary summary = 1;
}

message SortByCreatedAtRequest {
    int32 page = 1;
    int32 page_size = 2;
    bool ascending = 3;
}

message SortByCreatedAtResponse {
    repeated OverviewSummary summaries = 1;
    int32 total = 2;
}
```

## 事件定义

```
// 示例：符号任务完成事件
type SymbolTaskFinishedEvent struct {
    MainId string `json:"main_id"`
}

// 获取事件名称
func (e SymbolTaskFinishedEvent) GetName() string {
    return "SymbolTaskFinishedEvent"
}

// 获取事件版本
func (e SymbolTaskFinishedEvent) GetVersion() string {
    return "v1"
}
```

## 服务实现

服务实现位于 `proto_service` 目录：

```
// 示例：OverviewSummary 服务实现
type OverviewSummaryServiceImpl struct {
    proto_overview_summary.UnimplementedOverviewSummaryServiceServer
    ctx *app.Context
}

// 创建服务
func NewOverviewSummaryService(ctx *app.Context) *OverviewSummaryServiceImpl {
    return &OverviewSummaryServiceImpl{
        ctx: ctx,
    }
}

// 根据ID查询实现
func (s *OverviewSummaryServiceImpl) FindById(ctx context.Context, req *proto_overview_summary.FindByIdRequest) (*proto_overview_summary.FindByIdResponse, error) {
    // 参数验证
    if req.Id == "" {
        return nil, status.Error(codes.InvalidArgument, "id is required")
    }
    
    // 查询数据
    summary, err := s.ctx.OverviewSummaryRepository.FindById(req.Id)
    if err != nil {
        s.ctx.Logger.Error("Failed to find summary", 
            zap.String("id", req.Id),
            zap.Error(err))
        return nil, status.Error(codes.Internal, "internal error")
    }
    
    // 数据不存在
    if summary == nil {
        return nil, status.Error(codes.NotFound, "summary not found")
    }
    
    // 转换为Proto
    protoSummary := summary.ToProto()
    
    return &proto_overview_summary.FindByIdResponse{
        Summary: protoSummary,
    }, nil
}
```

## 最佳实践

1. 使用明确的字段编号，避免冲突
2. 使用适当的字段类型，考虑性能和兼容性
3. 服务接口应该简洁明了，遵循RESTful风格
4. 请求和响应消息应该有明确的命名和结构
5. 使用嵌套消息组织复杂数据结构
6. 考虑向后兼容性，避免删除或修改已有字段
7. 使用注释说明字段和服务的用途
8. 事件定义应包含版本信息，便于演化