# 01 · SQL 层：解析、优化器、执行器与执行计划

Server 层如何处理一条 SQL：从文本到执行计划，再到逐行取数。

## 本章范围

- 解析器：词法 / 语法分析、AST、`sql_mode` 与保留字
- 预处理：名字解析、权限、语义检查、MDL
- 优化器：逻辑改写、基于成本的物理优化、统计信息、选错索引的治理
- 执行器：取数模型、8.0 迭代器模型
- 执行计划：`EXPLAIN` 各列、`FORMAT=JSON / TREE`、`EXPLAIN ANALYZE`
- 常见执行方式：回表与覆盖索引、ICP、MRR、Hash Join / BNL / BKA、Filesort、临时表

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| [sql-execution-and-explain.html](sql-execution-and-explain.html) | 解析 / 预处理 / 优化器（成本模型、统计信息、直方图、选错索引）/ 执行器、EXPLAIN 全列详解、ICP / MRR / Hash Join / Filesort / 临时表（适用 8.0.x） | 2026-11-03 |

## 待补

- 优化器 hint 清单与 `optimizer_switch` 开关说明
- `optimizer_trace` 的实际案例分析

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。
