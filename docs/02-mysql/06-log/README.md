# 06 · 日志体系

redo / undo / binlog 如何协作，保证崩溃安全与复制。

## 本章范围

- 各类日志一览：redo log、undo log、binlog、relay log、错误 / 慢查询 / 通用日志
- WAL、LSN、Checkpoint、`innodb_flush_log_at_trx_commit`
- binlog 格式（STATEMENT / ROW / MIXED）、`sync_binlog`、GTID
- 两阶段提交与组提交
- 崩溃恢复流程

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| _待补充_ | | |

## 待补

- 两阶段提交的异常场景推演（prepare 后崩溃、binlog 写完崩溃）
- 双 1 配置的含义与取舍
- redo 日志大小与写性能的关系（8.0.30+ 动态调整）

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。
