# 資料存取（Repository）規範

- 所有 Repository 方法應返回 `(Exception? ex, T? record)` 格式，以強制呼叫端顯式處理錯誤。
- 介面與實作請遵循清晰的命名與分層原則，Domain 層定義介面，Persistent 層提供實作。

> 更多 MongoDB 具體實作建議，請參閱 `persistent_mongo.md`。
