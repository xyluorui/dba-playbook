# MySQL

MySQL 体系化知识。目录按「一条 SQL 的旅程」组织成 12 章，每章一个子目录，章内文档放在一起。

> 学习地图与进度见 [overview.html](overview.html)。

## 章节

| 章 | 目录 | 主题 | 状态 |
|------|------|------|------|
| 00 | [00-overview/](00-overview/) | 总览：分层架构与一条 SQL 的旅程 | 已成文 |
| 01 | [01-sql-layer/](01-sql-layer/) | Server 层（连接管理与 SQL 处理） | 已成文 |
| 02 | [02-innodb/](02-innodb/) | InnoDB 架构：内存、磁盘、后台线程 | 待撰写 |
| 03 | [03-index/](03-index/) | 索引：B+ Tree 与索引设计 | 待撰写 |
| 04 | [04-transaction-mvcc/](04-transaction-mvcc/) | 事务与 MVCC | 待撰写 |
| 05 | [05-lock/](05-lock/) | 锁与死锁 | 待撰写 |
| 06 | [06-log/](06-log/) | 日志体系：redo / undo / binlog | 待撰写 |
| 07 | [07-replication-ha/](07-replication-ha/) | 复制与高可用 | 待撰写 |
| 08 | [08-query-optimization/](08-query-optimization/) | 查询优化方法论 | 待撰写 |
| 09 | [09-schema-design/](09-schema-design/) | 数据类型与表设计 | 待撰写 |
| 10 | [10-ops/](10-ops/) | 运维与管理：部署、备份、监控、安全、升级 | 待撰写 |
| 11 | [11-algorithms/](11-algorithms/) | 核心算法索引 | 待撰写 |

## 文档总索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| [overview.html](overview.html) | 知识总览与章节进度 | 2026-11-03 |
| [00-overview/mysql-layered-architecture.html](00-overview/mysql-layered-architecture.html) | 分层架构、各层职责、Server 层与引擎层分界、SELECT / UPDATE 的执行旅程（适用 8.0.x） | 2026-11-03 |
| [01-sql-layer/sql-execution-and-explain.html](01-sql-layer/sql-execution-and-explain.html) | 优化器原理与 EXPLAIN 详解、ICP / MRR / Hash Join / Filesort / 临时表（适用 8.0.x） | 2026-11-03 |

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。
