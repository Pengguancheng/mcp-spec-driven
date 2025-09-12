# Golang 微服务开发规范

本文档提供了 Golang 微服务开发的规范和最佳实践，包括目录结构、命名规则、包引用关系等方面的指导。

## 概述

本规范旨在提供一套一致的开发标准，帮助团队成员编写高质量、可维护的微服务代码。遵循这些规范可以：

- 提高代码质量和可维护性
- 减少开发过程中的常见错误
- 促进团队协作和知识共享
- 加速新成员的入职和学习
- 确保系统的可扩展性和可靠性

## 如何使用本规范

1. **新项目启动**：在启动新项目时，参考目录结构和包引用关系设计项目架构
2. **代码编写**：遵循命名规则和各组件的实现指南编写代码
3. **代码审查**：使用最佳实践作为代码审查的参考标准

## 规范更新

本规范将根据项目需求和团队反馈持续更新。如有建议或问题，请通过以下方式提出：

1. 提交 Issue 或 Pull Request
2. 在团队会议中讨论
3. 直接联系规范维护者

## 参考资源

- Effective Go
- Go Code Review Comments
- Standard Go Project Layout
- Clean Architecture
- Domain-Driven Design

## 1. 目录结构

### 标准目录结构

```
/project-name/
├── app/                  # 应用上下文和初始化
│   └── ctx.go            # 定义应用依赖注入与全局上下文
├── applibs/              # 通用应用库与基础设施组件
│   ├── dispatch.go       # 事件分发处理
│   └── rmq.go            # 消息队列封装
├── config/               # 配置文件与常量定义
│   ├── const.go          # 全局常量
│   └── json_config.go    # JSON配置加载
├── domain/               # 领域模型和接口定义（领域驱动设计核心）
│   ├── model/            # 领域实体与值对象
│   └── repository/       # 仓储接口定义
├── handler/              # 事件处理器
│   └── handler_{event}/  # 按事件类型组织的处理器
├── persistent/           # 仓储实现层
│   └── persistent_{db}/  # 按数据库类型组织的实现
├── procedure/            # 业务流程与用例实现
│   └── pro_{domain}/     # 按领域组织的业务流程
├── proto/                # 协议缓冲定义
│   ├── event_{domain}/   # 领域事件定义
│   └── proto_{service}/  # 服务接口定义
└── proto_service/        # 协议服务实现
    └── {service}.go      # 具体服务实现
```

### 目录职责说明

- **app/**: 应用启动、配置和上下文管理
- **applibs/**: 独立于业务逻辑的通用基础设施代码
- **config/**: 集中管理配置信息
- **domain/**: 核心业务模型与接口定义
- **handler/**: 事件处理程序
- **persistent/**: 持久化实现
- **procedure/**: 业务流程实现
- **proto/**: 服务间通信协议定义
- **proto_service/**: gRPC服务具体实现

## 2. 命名规则

### 包命名

- 使用小写单词，不使用下划线或驼峰命名
- 包名应简洁且能表达其内容
- 示例：`model`, `repository`, `persistent_mongo`

### 文件命名

- 使用小写单词，可使用下划线分隔
- 文件名应反映其主要内容
- 示例：`overview.go`, `overview_summary.go`, `handler_symbolTaskFinish.go`

### 结构体命名

- 使用大驼峰命名法（PascalCase）
- 示例：`Overview`, `OverviewSummary`, `SymbolTaskFinishedEventHandler`

### 接口命名

- 使用大驼峰命名法
- 通常以功能命名，而不是以 "I" 前缀
- 示例：`OverviewRepository`, `OverviewSummaryRepository`

### 方法命名

- 使用大驼峰命名法
- 动词开头，清晰表达功能
- 示例：`FindById`, `UpsertBatch`, `DeleteAll`

### 变量命名

- 使用小驼峰命名法（camelCase）
- JSON 标签使用小驼峰
- MongoDB 标签使用下划线命名法（snake_case）
- 示例：

```
Id string `json:"id" bson:"_id"`
ProfitPercent float64 `json:"profitPercent" bson:"profit_percent"`
```

### 过程命名

- 过程结构体以 `Pro` 前缀命名
- 示例：`ProSummary`, `ProFlush`, `ProGetOverviewData`

## 3. 包之间的参考关系

Strategy Summary 项目遵循清晰的依赖方向，避免循环依赖：

```
app → applibs, persistent, proto_service, handler
     ↑
handler → app, procedure, proto
     ↑
procedure → domain, proto
     ↑
persistent → domain
     ↑
proto_service → domain, persistent
     ↑
domain (最底层，不依赖其他包)
```

### 依赖规则

1. 领域层（domain）是最基础的层，不依赖其他层
2. 持久化层（persistent）只依赖领域层
3. 过程层（procedure）依赖领域层和协议层
4. 处理器层（handler）依赖应用层、过程层和协议层
5. 应用层（app）可以依赖所有其他层，作为组装的入口

### 依赖方向

- 依赖应该始终从高层指向低层
- 避免循环依赖
- 使用接口隔离不同层之间的依赖
- 领域层作为核心层，不应该依赖任何其他层

  ## 4. 领域模型

领域模型是业务实体的抽象表示，位于 `domain/model` 目录。

### 模型定义规范

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

### Proto 转换方法

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

### 最佳实践

1. 模型应该是纯粹的数据结构，不包含业务逻辑
2. 使用适当的标签来支持序列化和反序列化
3. 提供清晰的转换方法，确保数据一致性
4. 遵循命名规范，确保字段名称的一致性
5. 为复杂模型提供构造函数或工厂方法

## 5. 领域仓储

领域仓储接口定义了对领域模型的持久化操作，位于 `domain/repository` 目录。

### 接口定义规范

```
// 示例：OverviewRepository 接口
type OverviewRepository interface {
    UpsertBatch(overview []*model.Overview) error
    FindBySummaryId(summaryId string) ([]*model.Overview, error)
    DeleteAll() error
}
```

### 接口方法命名规范

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

### 最佳实践

1. 接口应该定义在领域层，实现在持久化层
2. 方法命名应清晰表达其功能和参数
3. 返回适当的错误信息，不要吞掉错误
4. 接口方法应该是原子操作
5. 复杂查询应该有明确的方法名和参数
6. 批量操作应该提供事务支持
7. 避免在接口中暴露底层数据库细节

## 6. 配置管理

配置处理位于 `config` 目录，负责加载和管理应用配置。

### 配置结构

```
// 示例：配置结构
type Config struct {
    LogPath     string `json:"logPath"`
    RedisUrl    string `json:"redisUrl"`
    RmqUrl      string `json:"rmqUrl"`
    MongoUrl    string `json:"mongoUrl"`
    ServicePort int    `json:"servicePort"`
    GrpcUrl     struct {
        Agent string `json:"agent"`
    } `json:"grpcUrl"`
}
```

### 配置加载

```
// 加载配置
func LoadConfig(env string) (*Config, error) {
    // 根据环境变量选择配置文件
    configFile := fmt.Sprintf("config.%s.json", env)
    
    // 读取配置文件
    data, err := ioutil.ReadFile(configFile)
    if err != nil {
        return nil, err
    }
    
    // 解析配置
    config := &Config{}
    err = json.Unmarshal(data, config)
    if err != nil {
        return nil, err
    }
    
    return config, nil
}
```

### 配置文件分离

配置文件应根据环境分离：

- `config.develop.json` - 开发环境
- `config.prod.json` - 生产环境

### 常量定义

常量应集中定义在 `const.go` 文件中：

```
// 系统常量
const (
    DefaultPageSize = 20
    MaxPageSize     = 100
    DefaultTimeout  = 30 * time.Second
)

// 业务常量
const (
    StatusActive   = "active"
    StatusInactive = "inactive"
    StatusDeleted  = "deleted"
)
```

### 最佳实践

1. 所有环境相关配置均应外部化，不要硬编码
2. 使用结构化配置，便于类型检查和自动补全
3. 提供默认值，确保应用在配置缺失时仍能正常运行
4. 敏感信息（如密码、密钥）应通过环境变量或安全存储提供
5. 配置加载失败应提供明确的错误信息
6. 配置结构应有清晰的文档说明每个字段的用途
7. 常量应按功能分组，并提供有意义的名称

## 7. 应用库

应用库提供通用功能和工具，位于 `applibs` 目录。这些库独立于业务逻辑，提供基础设施支持。

### 消息队列封装

```
// 示例：RabbitMQ 订阅
func RmqSubscribe(ctx *app.Context) {
    // 创建连接
    conn, err := amqp.Dial(ctx.Config.RmqUrl)
    if err != nil {
        ctx.Logger.Error("Failed to connect to RabbitMQ", zap.Error(err))
        return
    }
    defer conn.Close()
    
    // 创建通道
    ch, err := conn.Channel()
    if err != nil {
        ctx.Logger.Error("Failed to open a channel", zap.Error(err))
        return
    }
    defer ch.Close()
    
    // 声明队列
    q, err := ch.QueueDeclare(
        "task_queue", // 队列名
        true,         // 持久化
        false,        // 自动删除
        false,        // 排他性
        false,        // 非阻塞
        nil,          // 参数
    )
    
    // 消费消息
    msgs, err := ch.Consume(
        q.Name, // 队列
        "",     // 消费者
        false,  // 自动确认
        false,  // 排他性
        false,  // 非本地
        false,  // 非阻塞
        nil,    // 参数
    )
    
    // 处理消息
    for msg := range msgs {
        // 处理逻辑
        msg.Ack(false) // 确认消息
    }
}
```

### 事件分发

```
// 示例：事件分发器构建
func BuildDispatch(ctx *app.Context) *pubsub.EventDispatcher {
    dispatcher := pubsub.NewEventDispatcher()
    
    // 注册处理器
    symbolTaskFinishedHandler := &handler.SymbolTaskFinishedEventHandler{Context: ctx}
    dispatcher.RegisterHandler(symbolTaskFinishedHandler)
    
    // 注册更多处理器...
    
    return dispatcher
}

// 示例：事件处理
func HandleEvent(dispatcher *pubsub.EventDispatcher, event pubsub_core.IDomainEvent) {
    err := dispatcher.Dispatch(event)
    if err != nil {
        // 错误处理
    }
}
```

### 日志工具

```
// 示例：创建结构化日志
func NewLogger(logPath string) (*zap.Logger, error) {
    // 配置
    cfg := zap.Config{
        Level:            zap.NewAtomicLevelAt(zap.InfoLevel),
        Encoding:         "json",
        OutputPaths:      []string{logPath, "stdout"},
        ErrorOutputPaths: []string{logPath, "stderr"},
        EncoderConfig: zapcore.EncoderConfig{
            TimeKey:        "time",
            LevelKey:       "level",
            NameKey:        "logger",
            CallerKey:      "caller",
            MessageKey:     "msg",
            StacktraceKey:  "stacktrace",
            LineEnding:     zapcore.DefaultLineEnding,
            EncodeLevel:    zapcore.LowercaseLevelEncoder,
            EncodeTime:     zapcore.ISO8601TimeEncoder,
            EncodeDuration: zapcore.SecondsDurationEncoder,
            EncodeCaller:   zapcore.ShortCallerEncoder,
        },
    }
    
    // 创建日志
    return cfg.Build()
}
```

### 最佳实践

1. 应用库应该是无状态的，便于测试和复用
2. 提供清晰的错误处理和日志记录
3. 使用依赖注入传递上下文和配置
4. 避免在应用库中包含业务逻辑
5. 为复杂操作提供重试和熔断机制
6. 使用接口隔离外部依赖，便于模拟测试
7. 提供合理的默认值和配置选项

## 8. 应用上下文

应用上下文整合了应用的各个组件，位于 `app` 目录。上下文作为依赖注入的容器，管理应用的生命周期和依赖关系。

### 上下文结构

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

### 上下文创建

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

### 上下文关闭

```
// 关闭上下文
func (ctx *Context) Close() {
    // 关闭日志
    _ = ctx.Logger.Sync()
    
    // 关闭其他资源
    // ...
}
```

### 最佳实践

1. 上下文应该包含所有应用依赖，避免使用全局变量
2. 使用构造函数创建上下文，确保所有依赖正确初始化
3. 提供关闭方法，确保资源正确释放
4. 使用接口而非具体实现，便于测试和替换
5. 错误处理应该清晰明确，避免部分初始化的上下文
6. 避免在上下文中包含业务逻辑
7. 上下文应该是线程安全的，可以在多个goroutine中使用

## 10. 事件处理器

处理器负责处理事件，位于 `handler` 目录。每个处理器只处理一种类型的事件，遵循单一职责原则。

### 处理器结构

```
// 示例：符号任务完成事件处理器
type SymbolTaskFinishedEventHandler struct {
    *app.Context
}
```

### 事件名称方法

```
// 返回处理器处理的事件名称
func (h *SymbolTaskFinishedEventHandler) EventName() string {
    return event_symbol_task.SymbolTaskFinishedEvent{}.GetName()
}
```

### 处理方法

```
// 处理事件
func (h *SymbolTaskFinishedEventHandler) Handle(event pubsub_core.IDomainEvent) error {
    // 类型断言
    e, ok := event.(*event_symbol_task.SymbolTaskFinishedEvent)
    if !ok {
        return fmt.Errorf("invalid event type: %T", event)
    }
    
    // 日志记录
    h.Logger.Info("Handling SymbolTaskFinishedEvent", 
        zap.String("main_id", e.MainId))
    
    // 创建处理上下文
    ctx := &procedure.Context{
        Context: h.Context,
        MainId:  e.MainId,
    }
    
    // 调用业务流程
    pro := &procedure.ProSummary{}
    err := pro.Process(ctx, nil)
    if err != nil {
        h.Logger.Error("Failed to process summary", 
            zap.String("main_id", e.MainId),
            zap.Error(err))
        return err
    }
    
    return nil
}
```

### 处理器注册

```
// 注册处理器
func RegisterHandlers(dispatcher *pubsub.EventDispatcher, ctx *app.Context) {
    // 创建并注册符号任务完成事件处理器
    symbolTaskFinishedHandler := &SymbolTaskFinishedEventHandler{Context: ctx}
    dispatcher.RegisterHandler(symbolTaskFinishedHandler)
    
    // 注册更多处理器...
}
```

### 最佳实践

1. 每个处理器只处理一种类型的事件
2. 处理器应该是无状态的，通过上下文获取依赖
3. 处理器应该将业务逻辑委托给过程层，自身只负责事件解析和调用
4. 处理器应该记录详细的日志，便于问题排查
5. 处理器应该处理所有可能的错误，避免崩溃
6. 处理器应该验证事件数据的有效性
7. 处理器应该有明确的命名，表明其处理的事件类型

## 11. 持久化实现

MongoDB 持久化实现位于 `persistent/persistent_mongo` 目录，负责实现领域仓储接口。

### 仓储结构

```
// 示例：Overview 仓储实现
type OverviewRepo struct {
    collection *mongo.Collection
}
```

### 仓储创建

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

### 批量更新实现

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

### 查询实现

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

### 删除实现

```
// 删除所有数据
func (r *OverviewRepo) DeleteAll() error {
    _, err := r.collection.DeleteMany(context.Background(), bson.M{})
    return err
}
```

### 最佳实践

1. 为每个集合创建适当的索引，提高查询性能
2. 使用TTL索引自动清理过期数据
3. 批量操作使用BulkWrite，提高性能
4. 使用上下文控制操作超时
5. 正确处理MongoDB错误，提供有意义的错误信息
6. 使用事务保证数据一致性（MongoDB 4.0+）
7. 避免在仓储层进行业务逻辑处理

## 12. 业务流程

过程封装了业务逻辑，位于 `procedure` 目录。过程是无状态的业务流程实现，通过上下文传递数据。

### 过程上下文

```
// 过程上下文
type Context struct {
    *app.Context
    MainId string
    // 其他业务相关字段
}
```

### 过程接口

```
// 过程接口
type Process interface {
    // 获取过程ID
    GetProcessId() string
    
    // 执行过程
    Process(ctx *Context, eventFunc AddEventFunc) error
}

// 事件添加函数类型
type AddEventFunc func(event pubsub_core.IDomainEvent) error
```

### 摘要计算过程

```
// 摘要计算过程
type ProSummary struct {}

// 获取过程ID
func (p *ProSummary) GetProcessId() string {
    return "ProSummary"
}

// 执行过程
func (p *ProSummary) Process(ctx *Context, eventFunc AddEventFunc) error {
    // 参数验证
    if ctx.MainId == "" {
        return errors.New("main_id is required")
    }
    
    // 日志记录
    ctx.Logger.Info("Processing summary", 
        zap.String("main_id", ctx.MainId))
    
    // 查询数据
    overviews, err := ctx.OverviewRepository.FindBySummaryId(ctx.MainId)
    if err != nil {
        return fmt.Errorf("failed to find overviews: %w", err)
    }
    
    // 业务逻辑处理
    summary := &model.OverviewSummary{
        Id:          ctx.MainId,
        SymbolCount: len(overviews),
        CreatedAt:   time.Now(),
    }
    
    // 计算统计值
    if len(overviews) > 0 {
        var totalProfitPercent float64
        var totalProfitValue float64
        
        for _, overview := range overviews {
            totalProfitPercent += overview.ProfitPercent
            totalProfitValue += overview.ProfitValue
        }
        
        avgProfitPercent := totalProfitPercent / float64(len(overviews))
        avgProfitValue := totalProfitValue / float64(len(overviews))
        
        summary.ProfitPercent = &model.StatisticValue{
            Avg: avgProfitPercent,
            // 其他统计值...
        }
        
        summary.ProfitValue = &model.StatisticValue{
            Avg: avgProfitValue,
            // 其他统计值...
        }
    }
    
    // 保存结果
    err = ctx.OverviewSummaryRepository.Save(summary)
    if err != nil {
        return fmt.Errorf("failed to save summary: %w", err)
    }
    
    // 发布事件（如果需要）
    if eventFunc != nil {
        event := &event_summary.SummaryCompletedEvent{
            SummaryId: ctx.MainId,
        }
        
        err = eventFunc(event)
        if err != nil {
            ctx.Logger.Error("Failed to publish event", 
                zap.String("event", event.GetName()),
                zap.Error(err))
        }
    }
    
    return nil
}
```

### 过程组合

```
// 过程链
type ProcessChain struct {
    processes []Process
}

// 创建过程链
func NewProcessChain(processes ...Process) *ProcessChain {
    return &ProcessChain{
        processes: processes,
    }
}

// 执行过程链
func (c *ProcessChain) Execute(ctx *Context, eventFunc AddEventFunc) error {
    for _, process := range c.processes {
        err := process.Process(ctx, eventFunc)
        if err != nil {
            return fmt.Errorf("process %s failed: %w", process.GetProcessId(), err)
        }
    }
    
    return nil
}
```

### 最佳实践

1. 过程应该是无状态的，通过上下文传递数据
2. 过程应该有明确的职责，遵循单一职责原则
3. 过程应该可组合，支持复杂业务流程的构建
4. 过程应该处理所有可能的错误，提供清晰的错误信息
5. 过程应该记录关键操作的日志
6. 过程应该验证输入参数的有效性
7. 过程可以发布事件，但不应该直接处理事件

## 13. 协议缓冲

协议缓冲定义位于 `proto` 目录，包括消息定义、服务定义和事件定义。

### 消息定义

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

### 服务定义

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

### 事件定义

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

### 服务实现

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