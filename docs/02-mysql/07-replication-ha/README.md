# 07 · 复制与高可用

主从复制原理、复制模式、并行复制与切换方案。

## 本章范围

- 复制原理：binlog dump 线程 → IO 线程 → relay log → SQL 线程
- 复制模式：异步、半同步、组复制（MGR）
- 基于位点与基于 GTID 的复制
- 并行复制：基于库、LOGICAL_CLOCK、WRITESET
- 复制延迟的成因与治理
- 高可用方案：MHA / Orchestrator、MGR / InnoDB Cluster、中间件（ProxySQL / MySQL Router）
- 读写分离与一致性

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| _待补充_ | | |

## 待补

- 主从延迟的定位链路（`SHOW SLAVE STATUS`、`performance_schema.replication_*`）
- 切换演练与数据一致性校验
- 半同步的 `after_sync` 与 `after_commit` 区别

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。涉及复制的内容必须注明 `binlog_format` 与 GTID 模式。
