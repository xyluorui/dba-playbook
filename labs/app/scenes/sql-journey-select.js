/*
 * 场景数据 v2 —— 一条 SELECT 的旅程（含目录、时间轴、检查器、时序数据）
 * 用途: labs/app 的数据源；只放数据，不写渲染逻辑
 * 格式: 见 ../../README.md「场景数据格式」
 * 日期: 2026-11-05
 */

/* 课程目录：分类 + 单元 + 场景；planned 为 P1 起开发中的占位 */
window.LAB_CATALOG = [
  {
    unit: "U1 · 一条 SQL 的旅程",
    category: "基础",
    scenes: ["sql-journey-select"]
  },
  {
    unit: "U2 · 索引实验室",
    category: "索引",
    scenes: [],
    planned: "E1 查找路径 · E2 回表与覆盖 · E3 联合索引与 ICP"
  },
  {
    unit: "U3 · 事务与 MVCC",
    category: "事务",
    scenes: [],
    planned: "隔离级别交错 · 版本链与 Read View"
  },
  {
    unit: "U4 · 锁与死锁",
    category: "锁",
    scenes: [],
    planned: "加锁范围预测 · 死锁形成与检测"
  },
  {
    unit: "U5 · 日志与崩溃恢复",
    category: "日志",
    scenes: [],
    planned: "flush 参数对照 · 两阶段提交 · 崩溃点推演"
  }
];

window.LAB_SCENES = [
  {
    id: "sql-journey-select",
    title: "一条 SELECT 的旅程",
    subtitle: "从客户端发出到结果返回，分 6 步观察",
    category: "基础",
    status: "学习中",
    outline: ["0.1", "0.2", "1.1", "1.2", "1.3"],
    version: "MySQL 8.0.x",
    engine: "InnoDB",
    description:
      "一条 SELECT 语句从客户端发出，穿过连接层、SQL 层、InnoDB，最终把结果带回来。" +
      "跟着 6 个步骤走一遍，看清每一层各自做了什么、留下了什么可观察的证据。",
    meta: [
      { k: "适用版本", v: "MySQL 8.0.x" },
      { k: "存储引擎", v: "InnoDB（默认）" },
      { k: "涉及层次", v: "连接层 → SQL 层 → InnoDB → 文件层" },
      { k: "主要观察对象", v: "SQL 文本、解析树、执行计划、数据页" },
      { k: "对应大纲", v: "0.1 / 0.2 / 1.1–1.3" },
      { k: "参考文档", v: "《MySQL 分层架构》", href: "../../docs/02-mysql/00-overview/mysql-layered-architecture.html" }
    ],
    assumptions: [
      "示例数据声明：表数据、时间戳、报文与输出均为教学示例，非真实执行采集",
      "省略的机制：权限校验、网络传输细节、查询缓存（8.0 已移除）等一律从略",
      "节奏声明：单步为教学节奏，时间轴与画面均不代表实测耗时"
    ],
    layers: [
      { id: "conn", name: "连接层", color: "blue" },
      { id: "sql", name: "SQL 层（Server）", color: "green" },
      { id: "innodb", name: "InnoDB（引擎层）", color: "amber" },
      { id: "file", name: "文件层（磁盘）", color: "purple" }
    ],
    objects: [
      { id: "client", layer: "conn", label: "客户端" },
      { id: "thread", layer: "conn", label: "连接线程" },
      { id: "parser", layer: "sql", label: "解析器" },
      { id: "optimizer", layer: "sql", label: "优化器" },
      { id: "executor", layer: "sql", label: "执行器" },
      { id: "bp", layer: "innodb", label: "Buffer Pool" },
      { id: "disk", layer: "file", label: "表空间文件" }
    ],
    steps: [
      {
        no: 1,
        title: "客户端发起连接",
        layer: "conn",
        time: "0.000s",
        stage: "conn",
        flow: "client-server",
        seq: { from: "client", to: "thread", label: "TCP 连接 · 认证" },
        narration:
          "应用或客户端先和 MySQL 建立连接（TCP 或 Unix socket），完成认证后拿到一个会话。" +
          "MySQL 8.0 默认一个连接由一个线程处理（一连接一线程）。",
        highlight: ["client", "thread"],
        evidence: [
          { object: "连接线程", action: "建立连接并完成认证", result: "会话就绪，SHOW PROCESSLIST 中可见" }
        ],
        inspector: {
          fields: [
            { name: "对象", value: "连接线程（一连接一线程）" },
            { name: "输入", value: "TCP 连接请求（示例：10.0.0.5:52344 → 3306）", note: "IP 与端口为示例值" },
            { name: "处理", value: "认证（8.0 默认 caching_sha2_password）", note: "简化：认证细节从略" },
            { name: "输出", value: "会话建立，等待 SQL" }
          ],
          struct: {
            title: "示意 · SHOW PROCESSLIST 的一行",
            text:
`+----+------+----------------+------+---------+------+-------+------------------+
| Id | User | Host           | db   | Command | Time | State | Info             |
+----+------+----------------+------+---------+------+-------+------------------+
|  7 | app  | 10.0.0.5:52344 | NULL | Query   |    0 | init  | SELECT ...       |
+----+------+----------------+------+---------+------+-------+------------------+`
          }
        }
      },
      {
        no: 2,
        title: "SQL 文本进入 SQL 层",
        layer: "conn",
        time: "0.012s",
        stage: "sql",
        flow: "client-server",
        seq: { from: "thread", to: "parser", label: "提交 SQL 文本" },
        narration:
          "会话把 SQL 文本交给 Server 层，这条语句的旅程正式开始。连接线程接下来就等结果，" +
          "真正的处理由 SQL 层的各个模块接力完成。",
        highlight: ["thread", "parser"],
        evidence: [
          { object: "连接线程", action: "提交 SQL 文本", result: "SQL 层接管，连接线程进入等待" }
        ],
        inspector: {
          fields: [
            { name: "对象", value: "会话 / 连接线程" },
            { name: "输入", value: "SQL 文本" },
            { name: "处理", value: "移交给 Server 层处理管线" },
            { name: "输出", value: "SQL 层开始解析" }
          ],
          struct: {
            title: "示意 · 本次旅程的 SQL",
            text:
`SELECT name
  FROM users
 WHERE id = 1;`
          }
        }
      },
      {
        no: 3,
        title: "解析与预处理",
        layer: "sql",
        time: "0.014s",
        stage: "sql",
        flow: null,
        seq: null,
        narration:
          "解析器做词法、语法分析，把文本变成解析树；预处理阶段检查表、列是否存在。" +
          "语法写错的语句在这一步就直接报错，根本走不到执行。",
        highlight: ["parser"],
        evidence: [
          { object: "解析器", action: "词法 / 语法分析 + 语义检查", result: "生成解析树；语法错误在此报错（ER_PARSE_ERROR）" }
        ],
        inspector: {
          fields: [
            { name: "对象", value: "解析器 → 预处理器" },
            { name: "输入", value: "SQL 文本" },
            { name: "处理", value: "词法分析 → 语法分析 → 解析树；检查表 / 列存在性" },
            { name: "输出", value: "解析树（Parse Tree）" },
            { name: "报错点", value: "语法错误：ER_PARSE_ERROR（1064）", note: "错误码为示例" }
          ],
          struct: {
            title: "示意 · 解析树",
            text:
`Select
 ├─ 列:   name
 ├─ 表:   users
 └─ 条件:  id = 1`
          }
        }
      },
      {
        no: 4,
        title: "优化器制定执行计划",
        layer: "sql",
        time: "0.016s",
        stage: "sql",
        flow: null,
        seq: null,
        narration:
          "优化器根据统计信息和成本估算，决定用哪个索引、按什么顺序取数据，生成执行计划。" +
          "我们用 EXPLAIN 看到的，就是这一步的产物。",
        highlight: ["optimizer"],
        evidence: [
          { object: "优化器", action: "成本估算、选索引", result: "生成执行计划（EXPLAIN 的 type / key / rows 来自这里）" }
        ],
        inspector: {
          fields: [
            { name: "对象", value: "优化器（CBO）" },
            { name: "输入", value: "解析树 + 统计信息（索引基数）" },
            { name: "处理", value: "按成本比较候选计划，选索引与访问顺序" },
            { name: "输出", value: "执行计划" },
            { name: "证据", value: "EXPLAIN 的 type / key / rows / Extra" }
          ],
          struct: {
            title: "示意 · EXPLAIN 输出（示例值）",
            text:
`+----+---------+-------+------+---------------+---------+---------+-------+------+----------+-------+
| id | type    | table | key  | possible_keys | key_len | ref     | rows  | filt | Extra    |
+----+---------+-------+------+---------------+---------+---------+-------+------+----------+
|  1 | const   | users | PRI  | PRIMARY       | 4       | const   |     1 | 100% |          |
+----+---------+-------+------+---------------+---------+---------+-------+------+----------+`
          }
        }
      },
      {
        no: 5,
        title: "执行器调用 InnoDB 取数据",
        layer: "innodb",
        time: "0.024s",
        stage: "innodb",
        flow: "server-disk",
        seq: { from: "executor", to: "bp", label: "按计划读行 / 读页" },
        narration:
          "执行器按计划逐行调用存储引擎接口；InnoDB 先在 Buffer Pool 里找数据页，不在就从表空间文件读入。" +
          "如果走的是二级索引，还要回主键索引取整行（回表）。",
        highlight: ["executor", "bp", "disk"],
        evidence: [
          { object: "Buffer Pool", action: "查找 / 读入数据页", result: "命中则直接返回；未命中从磁盘读入缓冲池" },
          { object: "执行器", action: "按计划取行", result: "拿到满足条件的行（走二级索引时可能回表）" }
        ],
        inspector: {
          fields: [
            { name: "对象", value: "执行器 → 存储引擎接口（handler）" },
            { name: "输入", value: "执行计划" },
            { name: "处理", value: "逐行 read；Buffer Pool 查页，未命中从表空间读入" },
            { name: "输出", value: "满足条件的行" },
            { name: "注意", value: "走二级索引时会回表", note: "展开见 P1 索引实验室" }
          ],
          struct: {
            title: "示意 · 数据页（16KB，简化）",
            text:
`┌────────── Page Header ──────────┐
│ 页号 · 页类型(索引页) · LSN       │
├────────── Infimum/Supremum ─────┤
│ 记录槽 slot[]（页目录）           │
│ 用户记录（行数据）                │
├────────── Page Trailer ─────────┤
简化：仅展示概念结构，字段从略`
          }
        }
      },
      {
        no: 6,
        title: "结果返回客户端",
        layer: "conn",
        time: "0.041s",
        stage: "conn",
        flow: "server-client",
        seq: { from: "thread", to: "client", label: "结果集 + OK" },
        narration:
          "结果集通过连接发回客户端，一条只读查询到此结束。示例是 autocommit 下的单条 SELECT；" +
          "写语句涉及的日志与提交，留到后面的日志实验再展开。",
        highlight: ["client", "thread"],
        evidence: [
          { object: "客户端", action: "接收结果集", result: "查询结束；SHOW STATUS 的 Questions 计数 +1" }
        ],
        inspector: {
          fields: [
            { name: "对象", value: "客户端" },
            { name: "输入", value: "结果集（1 行）" },
            { name: "处理", value: "结果集经连接发回" },
            { name: "输出", value: "查询完成" },
            { name: "证据", value: "SHOW STATUS 的 Questions +1" }
          ],
          struct: {
            title: "示意 · 客户端看到的输出",
            text:
`+------+
| name |
+------+
| 示例 |
+------+
1 row in set (0.00 sec)`
          }
        }
      }
    ],
    challenge: {
      prompt: "如果把示例换成一条写语句（UPDATE users SET age = 25 WHERE id = 1），这个旅程里会多出什么？说出至少两处。",
      answer: "示例答案：多出 undo 日志（回滚与 MVCC）与 redo 日志（持久性）的写入、binlog 写入与两阶段提交、提交动作本身；执行阶段从读变为更新（含回表定位整行）。"
    }
  }
];
