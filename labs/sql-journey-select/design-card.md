# 一条 SELECT 的旅程 · 实验设计卡

## 基本信息

| 字段 | 内容 |
| --- | --- |
| 对应大纲节点 | [MySQL 知识地图](../../docs/02-mysql/overview.html) 0.1、0.2、1.1–1.3 |
| 所属教学单元 | U1 · 一条 SQL 的旅程 |
| 适用范围与假设 | MySQL 8.0.x / InnoDB。单客户端、单条 autocommit 查询、无并发干扰。示例表、输出与时间均为教学构造。分层图将 Server 层的连接管理和 SQL 处理分开呈现，省略权限细节、执行器迭代器与网络协议细节。时间为播放参考。 |
| 验证方式 | 按下方核对表对照 MySQL 8.0 官方手册，并在本地隔离的 MySQL Community Server 8.0.46 实例复现。 |

## 学习设计

| 字段 | 内容 |
| --- | --- |
| 学习目标 | 给出一条主键点查，能按客户端、Server 层和 InnoDB 区分职责，用会话、执行计划、缓冲池指标和结果集解释各自可观察的现象。 |
| 实验问题 | 一条 SELECT 从发出到返回，会经过哪些组件？怎么核对每一步？ |
| 主要理解障碍 | 容易把执行计划当作真实调用或磁盘读写记录，或将 Server 层和存储引擎视为同一个组件。 |
| 最小场景 | 隔离测试库中的 InnoDB 示例表 `users`，主键 `id`，查询 `name`。教学图选择所需数据页未命中 Buffer Pool 的路径。 |
| 可修改变量 | 当前为固定场景。学习挑战仅改变所需页是否已经在 Buffer Pool 内。 |
| 主要观察对象 | 客户端、连接线程、解析器、优化器、执行器、Buffer Pool、表空间文件。 |
| 可见证据 | 单步高亮当前节点和数据方向。同一步展示可核对的字段、命令或示例结构，解释拓扑位置与可观察现象之间的关系。 |
| 迁移挑战 | 预测所需页命中 Buffer Pool 时哪段连线消失，并解释为何 `EXPLAIN` 无法确认这一次是否读盘。 |

## 实现要点

| 字段 | 内容 |
| --- | --- |
| 呈现形式 | 单步、拓扑与时序切换，当前解释同步，事件和检查器按需展开。 |
| 需要的共用能力 | 单步推进、回看、重置、变速播放、事件检查器、主题、键盘、静态阅读。 |
| 场景数据文件 | [sql-journey-select.js](../app/scenes/sql-journey-select.js) |
| 演示页 | [实验应用](../app/index.html) · [静态步骤](../demo-sql-journey.html#sec-4) |
| 当前状态 | 教学场景。已在 MySQL 8.0.46 核对连接、语句历史、解析错误、执行计划、全局指标与返回结果。 |

## 核对表

| 步骤 | 在本地 MySQL 8.0.x 隔离实例核对 | 官方来源 |
| --- | --- | --- |
| 连接 | 会话 A 保持连接，在同账号的会话 B 执行 `SHOW FULL PROCESSLIST`，观察 A 的 Id 与 Command。 | [SHOW PROCESSLIST](https://dev.mysql.com/doc/refman/8.0/en/show-processlist.html) |
| 提交 SQL | 会话 A 执行示例查询。启用 Performance Schema 语句历史采集时，对照该会话的 `events_statements_history.SQL_TEXT`。 | [语句历史表](https://dev.mysql.com/doc/refman/8.0/en/performance-schema-events-statements-history-table.html) · [语句事件字段](https://dev.mysql.com/doc/refman/8.0/en/performance-schema-events-statements-current-table.html) |
| 解析 | 在会话 A 单独执行拼错关键字的 `SELEC name FROM users WHERE id = 1;`，核对语法错误号。图中解析树为概念示意。 | [ER_PARSE_ERROR](https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html#error_er_parse_error) |
| 计划 | 在会话 A 对示例查询执行 `EXPLAIN FORMAT=TRADITIONAL`，核对 `type`、`key`、`rows` 的含义。 | [EXPLAIN](https://dev.mysql.com/doc/refman/8.0/en/explain.html) · [输出格式](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html) |
| 读页 | 在隔离实例查看 `Innodb_buffer_pool_read_requests`、`Innodb_buffer_pool_reads` 的全局计数。差值用于理解实例读页行为，无法单独归因给此查询。 | [Buffer Pool](https://dev.mysql.com/doc/refman/8.0/en/innodb-buffer-pool.html) · [状态变量](https://dev.mysql.com/doc/refman/8.0/en/server-status-variables.html#statvar_Innodb_buffer_pool_reads) |
| 返回结果 | 在会话 A 执行示例 `SELECT`，核对客户端显示的列名和结果行。 | [SELECT](https://dev.mysql.com/doc/refman/8.0/en/select.html) |

复现准备。在本地 MySQL 8.0.x 隔离实例的空白测试库内执行以下 SQL，创建教学表并插入一行示例数据。

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

INSERT INTO users (id, name) VALUES (1, '示例');
```

## 复现结果

个人实验验证环境为本地 MySQL Community Server 8.0.46 / InnoDB，通过 Unix socket 连接，已启用 Performance Schema 语句历史采集。

- `SHOW FULL PROCESSLIST` 能看到另一个连接正在执行的语句，当前会话的查询文本也出现在 `events_statements_history.SQL_TEXT` 中。
- 拼错关键字的语句返回 `ERROR 1064 (42000)`。示例查询返回一行 `name`，值为 `示例`。
- `EXPLAIN FORMAT=TRADITIONAL` 返回 `type=const`、`key=PRIMARY`、`rows=1`。
- 实例可读取两个 Buffer Pool 全局计数。实验画面采用教学用的未命中路径，这次复现核对的是计数的可观察性。
