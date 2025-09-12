# 包之间的参考关系

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

## 依赖规则

1. 领域层（domain）是最基础的层，不依赖其他层
2. 持久化层（persistent）只依赖领域层
3. 过程层（procedure）依赖领域层和协议层
4. 处理器层（handler）依赖应用层、过程层和协议层
5. 应用层（app）可以依赖所有其他层，作为组装的入口

## 依赖方向

- 依赖应该始终从高层指向低层
- 避免循环依赖
- 使用接口隔离不同层之间的依赖
- 领域层作为核心层，不应该依赖任何其他层