# Procedure

过程封装了业务逻辑，位于 `procedure` 目录。过程是无状态的业务流程实现，通过上下文传递数据。

## 过程上下文

```
// 过程上下文
type Context struct {
    *app.Context
    MainId string
    // 其他业务相关字段
}
```

## 过程接口

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

## 摘要计算过程

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

## 过程组合

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

## 最佳实践

1. 过程应该是无状态的，通过上下文传递数据
2. 过程应该有明确的职责，遵循单一职责原则
3. 过程应该可组合，支持复杂业务流程的构建
4. 过程应该处理所有可能的错误，提供清晰的错误信息
5. 过程应该记录关键操作的日志
6. 过程应该验证输入参数的有效性
7. 过程可以发布事件，但不应该直接处理事件