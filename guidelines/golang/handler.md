# Handler

处理器负责处理事件，位于 `handler` 目录。每个处理器只处理一种类型的事件，遵循单一职责原则。

## 处理器结构

```
// 示例：符号任务完成事件处理器
type SymbolTaskFinishedEventHandler struct {
    *app.Context
}
```

## 事件名称方法

```
// 返回处理器处理的事件名称
func (h *SymbolTaskFinishedEventHandler) EventName() string {
    return event_symbol_task.SymbolTaskFinishedEvent{}.GetName()
}
```

## 处理方法

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

## 处理器注册

```
// 注册处理器
func RegisterHandlers(dispatcher *pubsub.EventDispatcher, ctx *app.Context) {
    // 创建并注册符号任务完成事件处理器
    symbolTaskFinishedHandler := &SymbolTaskFinishedEventHandler{Context: ctx}
    dispatcher.RegisterHandler(symbolTaskFinishedHandler)
    
    // 注册更多处理器...
}
```

## 最佳实践

1. 每个处理器只处理一种类型的事件
2. 处理器应该是无状态的，通过上下文获取依赖
3. 处理器应该将业务逻辑委托给过程层，自身只负责事件解析和调用
4. 处理器应该记录详细的日志，便于问题排查
5. 处理器应该处理所有可能的错误，避免崩溃
6. 处理器应该验证事件数据的有效性
7. 处理器应该有明确的命名，表明其处理的事件类型