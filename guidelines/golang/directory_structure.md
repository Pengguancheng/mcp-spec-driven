# 目录结构

## 标准目录结构

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

## 目录职责说明

- **app/**: 应用启动、配置和上下文管理
- **applibs/**: 独立于业务逻辑的通用基础设施代码
- **config/**: 集中管理配置信息
- **domain/**: 核心业务模型与接口定义
- **handler/**: 事件处理程序
- **persistent/**: 持久化实现
- **procedure/**: 业务流程实现
- **proto/**: 服务间通信协议定义
- **proto_service/**: gRPC服务具体实现