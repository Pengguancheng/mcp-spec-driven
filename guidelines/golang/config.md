# Config

配置处理位于 `config` 目录，负责加载和管理应用配置。

## 配置结构

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

## 配置加载

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

## 配置文件分离

配置文件应根据环境分离：

- `config.develop.json` - 开发环境
- `config.prod.json` - 生产环境

## 常量定义

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

## 最佳实践

1. 所有环境相关配置均应外部化，不要硬编码
2. 使用结构化配置，便于类型检查和自动补全
3. 提供默认值，确保应用在配置缺失时仍能正常运行
4. 敏感信息（如密码、密钥）应通过环境变量或安全存储提供
5. 配置加载失败应提供明确的错误信息
6. 配置结构应有清晰的文档说明每个字段的用途
7. 常量应按功能分组，并提供有意义的名称