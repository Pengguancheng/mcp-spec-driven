# Applibs

应用库提供通用功能和工具，位于 `applibs` 目录。这些库独立于业务逻辑，提供基础设施支持。

## 消息队列封装

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

## 事件分发

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

## 日志工具

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

## 最佳实践

1. 应用库应该是无状态的，便于测试和复用
2. 提供清晰的错误处理和日志记录
3. 使用依赖注入传递上下文和配置
4. 避免在应用库中包含业务逻辑
5. 为复杂操作提供重试和熔断机制
6. 使用接口隔离外部依赖，便于模拟测试
7. 提供合理的默认值和配置选项