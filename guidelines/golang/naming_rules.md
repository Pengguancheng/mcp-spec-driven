# 命名规则

## 包命名

- 使用小写单词，不使用下划线或驼峰命名
- 包名应简洁且能表达其内容
- 示例：`model`, `repository`, `persistent_mongo`

## 文件命名

- 使用小写单词，可使用下划线分隔
- 文件名应反映其主要内容
- 示例：`overview.go`, `overview_summary.go`, `handler_symbolTaskFinish.go`

## 结构体命名

- 使用大驼峰命名法（PascalCase）
- 示例：`Overview`, `OverviewSummary`, `SymbolTaskFinishedEventHandler`

## 接口命名

- 使用大驼峰命名法
- 通常以功能命名，而不是以 "I" 前缀
- 示例：`OverviewRepository`, `OverviewSummaryRepository`

## 方法命名

- 使用大驼峰命名法
- 动词开头，清晰表达功能
- 示例：`FindById`, `UpsertBatch`, `DeleteAll`

## 变量命名

- 使用小驼峰命名法（camelCase）
- JSON 标签使用小驼峰
- MongoDB 标签使用下划线命名法（snake_case）
- 示例：

```
Id string `json:"id" bson:"_id"`
ProfitPercent float64 `json:"profitPercent" bson:"profit_percent"`
```

## 过程命名

- 过程结构体以 `Pro` 前缀命名
- 示例：`ProSummary`, `ProFlush`, `ProGetOverviewData`