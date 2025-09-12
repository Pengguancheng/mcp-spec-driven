# App Context

应用上下文整合了应用的各个组件，位于 `app` 目录。上下文作为依赖注入的容器，管理应用的生命周期和依赖关系。

## 上下文结构

```
// 示例：应用上下文
type Context struct {
    Config                   *config.Config
    Logger                   *zap.Logger
    OverviewRepository       repository.OverviewRepository
    OverviewSummaryRepository repository.OverviewSummaryRepository
    RmqPubSub                pubsub.IPubSub
    GrpcClient               struct {
        OverviewClient proto_agent.OverviewServiceClient
    }
}
```

## 上下文创建

```
// 创建上下文
func NewContext(cfg *config.Config) (*Context, error) {
    // 创建日志
    logger, err := applibs.NewLogger(cfg.LogPath)
    if err != nil {
        return nil, fmt.Errorf("failed to create logger: %w", err)
    }
    
    // 创建MongoDB客户端
    mongoClient, err := mongo.Connect(context.Background(), options.Client().ApplyURI(cfg.MongoUrl))
    if err != nil {
        return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
    }
    
    // 创建数据库
    db := mongoClient.Database("strategy_summary")
    
    // 创建仓储
    overviewRepo := persistent_mongo.NewOverviewRepository(db)
    overviewSummaryRepo := persistent_mongo.NewOverviewSummaryRepository(db)
    
    // 创建gRPC客户端
    grpcConn, err := grpc.Dial(cfg.GrpcUrl.Agent, grpc.WithInsecure())
    if err != nil {
        return nil, fmt.Errorf("failed to connect to gRPC server: %w", err)
    }
    
    // 创建上下文
    ctx := &Context{
        Config:                   cfg,
        Logger:                   logger,
        OverviewRepository:       overviewRepo,
        OverviewSummaryRepository: overviewSummaryRepo,
        GrpcClient: struct {
            OverviewClient proto_agent.OverviewServiceClient
        }{
            OverviewClient: proto_agent.NewOverviewServiceClient(grpcConn),
        },
    }
    
    return ctx, nil
}
```

## 上下文关闭

```
// 关闭上下文
func (ctx *Context) Close() {
    // 关闭日志
    _ = ctx.Logger.Sync()
    
    // 关闭其他资源
    // ...
}
```

## 最佳实践

1. 上下文应该包含所有应用依赖，避免使用全局变量
2. 使用构造函数创建上下文，确保所有依赖正确初始化
3. 提供关闭方法，确保资源正确释放
4. 使用接口而非具体实现，便于测试和替换
5. 错误处理应该清晰明确，避免部分初始化的上下文
6. 避免在上下文中包含业务逻辑
7. 上下文应该是线程安全的，可以在多个goroutine中使用