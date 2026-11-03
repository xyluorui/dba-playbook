# 11 · 核心算法

散落在各章中的算法集中索引，便于单独复习和对比。

## 本章范围

| 分类 | 算法 |
|------|------|
| 存储与索引 | B+ Tree、页分裂与页合并、自适应哈希索引、改进 LRU、预读、脏页刷新、Doublewrite |
| 事务与并发 | Read View 可见性判定、两阶段提交、组提交、WAL、Next-Key 加锁规则、死锁检测、Purge |
| 优化与执行 | CBO、Nested Loop、Block NL、Hash Join、BKA、外部排序、ICP、MRR、Online DDL 算法 |
| 复制与高可用 | GTID 定位、并行复制（LOGICAL_CLOCK / WRITESET）、Paxos（XCom） |

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| _待补充_ | | |

## 待补

- 每个算法写清：解决什么问题、时间复杂度 / 代价、对应参数、观测方式
- 算法之间的依赖关系（如 Read View → purge → undo 回收）

> 本章是索引性质的，详细内容优先写在各自主题章节，这里做汇总与对比。
>
> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。
