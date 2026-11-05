/*
 * 场景：一条 SELECT 的旅程（单步演示）
 * 用途: 验证单步引擎与场景数据格式的示例场景；对应大纲 0.1/0.2/1.1-1.3
 * 格式: 见 ../README.md「场景数据格式」；本文件只放数据，不写渲染逻辑
 * 日期: 2026-11-05
 */
window.LAB_SCENE = {
  id: "sql-journey-select",
  title: "一条 SELECT 的旅程",
  outline: ["0.1", "0.2", "1.1", "1.2", "1.3"],
  version: "MySQL 8.0.x",
  engine: "InnoDB",
  assumptions: [
    "示例数据声明：场景中的表、数据、报错码均为教学示例，非真实业务数据",
    "省略的机制：简化掉权限校验、网络传输等细节；查询缓存在 8.0 已移除，全程不涉及",
    "节奏声明：单步为教学节奏，与实测耗时无关，画面不代表性能"
  ],
  layers: [
    { id: "conn", name: "连接层" },
    { id: "sql", name: "SQL 层（Server）" },
    { id: "innodb", name: "InnoDB（引擎层）" },
    { id: "file", name: "文件层（磁盘）" }
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
      highlight: ["client", "thread"],
      narration: "应用或客户端先和 MySQL 建立连接（TCP 或 Unix socket），完成认证后拿到一个会话。MySQL 8.0 默认一个连接由一个线程处理（一连接一线程）。",
      evidence: [
        { object: "连接线程", action: "建立连接并完成认证", result: "会话就绪，SHOW PROCESSLIST 中可见" }
      ]
    },
    {
      no: 2,
      title: "SQL 文本进入 SQL 层",
      layer: "conn",
      highlight: ["thread"],
      narration: "会话把 SQL 文本（示例：SELECT name FROM users WHERE id = 1）交给 Server 层，这条语句的旅程正式开始。",
      evidence: [
        { object: "连接线程", action: "提交 SQL 文本", result: "SQL 层接管，连接线程等待返回结果" }
      ]
    },
    {
      no: 3,
      title: "解析与预处理",
      layer: "sql",
      highlight: ["parser"],
      narration: "解析器做词法、语法分析，把文本变成解析树；预处理阶段检查表、列是否存在。语法写错的语句在这一步就直接报错，根本走不到执行。",
      evidence: [
        { object: "解析器", action: "词法 / 语法分析", result: "生成解析树；语法错误在此报错（ER_PARSE_ERROR）" }
      ]
    },
    {
      no: 4,
      title: "优化器制定执行计划",
      layer: "sql",
      highlight: ["optimizer"],
      narration: "优化器根据统计信息和成本估算，决定用哪个索引、按什么顺序取数据，生成执行计划。我们用 EXPLAIN 看到的，就是这一步的产物。",
      evidence: [
        { object: "优化器", action: "成本估算、选索引", result: "生成执行计划（EXPLAIN 的 type / key / rows 来自这里）" }
      ]
    },
    {
      no: 5,
      title: "执行器调用 InnoDB 取数据",
      layer: "innodb",
      highlight: ["executor", "bp", "disk"],
      narration: "执行器按计划逐行调用存储引擎接口；InnoDB 先在 Buffer Pool 里找数据页，不在就从表空间文件读入。如果走的是二级索引，还要回主键索引取整行（回表）。",
      evidence: [
        { object: "Buffer Pool", action: "查找 / 读入数据页", result: "命中则直接返回；未命中从磁盘读入缓冲池" },
        { object: "执行器", action: "按计划取行", result: "拿到满足条件的行（走二级索引时可能回表）" }
      ]
    },
    {
      no: 6,
      title: "结果返回客户端",
      layer: "conn",
      highlight: ["client"],
      narration: "结果集通过连接发回客户端，一条只读查询到此结束。示例是 autocommit 下的单条 SELECT；写语句涉及的日志与提交，留到后面的日志实验再展开。",
      evidence: [
        { object: "客户端", action: "接收结果集", result: "查询结束；SHOW STATUS 的 Questions 计数 +1" }
      ]
    }
  ],
  challenge: {
    prompt: "如果把示例换成一条写语句（UPDATE users SET age = 25 WHERE id = 1），这个旅程里会多出什么？说出至少两处。",
    answer: "示例答案：多出 undo 日志（回滚与 MVCC）与 redo 日志（持久性）的写入、binlog 写入与两阶段提交、提交动作本身；执行阶段从读变为更新（含回表定位整行）。"
  }
};
