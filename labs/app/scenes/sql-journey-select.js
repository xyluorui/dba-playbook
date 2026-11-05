/*
 * 一条 SELECT 的旅程
 * 声明式场景。字段见 ../../README.md，核对方式见 ../../sql-journey-select/design-card.md。
 */
const selectSql = 'SELECT name\nFROM users\nWHERE id = 1;';

window.LAB_CATALOG = [
  { unit: 'U1 · 一条 SQL 的旅程', category: '基础', scenes: ['sql-journey-select'] },
  { unit: 'U2 · 索引实验室', category: '索引', scenes: [], planned: '查找路径、回表与覆盖、联合索引与 ICP' },
  { unit: 'U3 · 事务与 MVCC', category: '事务', scenes: [], planned: '隔离级别、版本链与 Read View' },
  { unit: 'U4 · 锁与死锁', category: '锁', scenes: [], planned: '加锁范围、死锁形成与检测' },
  { unit: 'U5 · 日志与崩溃恢复', category: '日志', scenes: [], planned: 'flush 参数、两阶段提交、崩溃点推演' }
];

window.LAB_SCENES = [
  {
    id: 'sql-journey-select',
    title: '一条 SELECT 的旅程',
    question: '一条 SELECT 从发出到返回，会经过哪些组件？怎么核对每一步？',
    input: { label: '示例 SQL', language: 'sql', text: selectSql },
    category: '基础',
    outline: ['0.1', '0.2', '1.1', '1.2', '1.3'],
    version: 'MySQL 8.0.x',
    engine: 'InnoDB',
    references: [
      { title: 'MySQL 分层架构', href: '../../docs/02-mysql/00-overview/mysql-layered-architecture.html#sec-8' },
      { title: 'SQL 层与执行计划', href: '../../docs/02-mysql/01-sql-layer/sql-execution-and-explain.html#sec-16' }
    ],
    assumptions: [
      '示例表、事件时间、图示和输出均为教学构造。示例查询按主键点查，教学图选择所需页未命中的路径。',
      '图中按职责分步，省略权限和网络协议细节。主键等值查询可能在优化期间读取 const 表。',
      '单步和自动播放只表示学习节奏。事件时间为示例。'
    ],
    layers: [
      { id: 'conn', name: '连接层', color: 'blue' },
      { id: 'sql', name: 'SQL 层', color: 'green' },
      { id: 'innodb', name: '引擎层', color: 'amber' },
      { id: 'file', name: '文件层', color: 'purple' }
    ],
    objects: [
      { id: 'client', layer: 'conn', label: '客户端' },
      { id: 'thread', layer: 'conn', label: '连接线程' },
      { id: 'parser', layer: 'sql', label: '解析器' },
      { id: 'optimizer', layer: 'sql', label: '优化器' },
      { id: 'executor', layer: 'sql', label: '执行器' },
      { id: 'bp', layer: 'innodb', label: 'Buffer Pool' },
      { id: 'disk', layer: 'file', label: '表空间文件' }
    ],
    sequenceActors: [
      { label: '客户端', objects: ['client'] },
      { label: '连接线程', objects: ['thread'] },
      { label: 'SQL 层', objects: ['parser', 'optimizer', 'executor'] },
      { label: 'InnoDB', objects: ['bp'] },
      { label: '文件层', objects: ['disk'] }
    ],
    steps: [
      {
        no: 1,
        title: '客户端发起连接',
        layer: 'conn',
        time: '0.000 s',
        links: [{ from: 'client', to: 'thread', label: '建立连接' }],
        narration: '客户端发起连接，完成认证后获得一个会话。连接保持打开时，服务器可以列出该会话。',
        highlight: ['client', 'thread'],
        check: {
          instruction: '在同一 MySQL 8.0 测试实例，用同账号打开第二个会话，执行下方命令查看第一个会话的 Id 和 Command。',
          command: 'SHOW FULL PROCESSLIST;',
          source: 'https://dev.mysql.com/doc/refman/8.0/en/show-processlist.html'
        },
        evidence: [
          { object: '连接线程', action: '建立连接并完成认证', result: '进程列表可看到已建立的会话' }
        ],
        inspector: {
          fields: [
            { name: 'Id', value: '服务端为此连接分配的标识' },
            { name: 'Command', value: 'Sleep 可表示会话正在等待下一条命令' }
          ],
          struct: { title: 'SHOW FULL PROCESSLIST · 字段片段', text: 'Id  User  Command\n 7  app   Sleep' }
        }
      },
      {
        no: 2,
        title: 'SQL 文本进入 SQL 层',
        layer: 'sql',
        time: '0.012 s',
        links: [{ from: 'thread', to: 'parser', label: '提交 SQL' }],
        narration: '客户端在会话上提交 SELECT 文本。SQL 层接收这条语句并进入解析处理。',
        highlight: ['thread', 'parser'],
        check: {
          instruction: '在 MySQL 8.0 测试库执行示例查询。启用 Performance Schema 语句历史采集时，可对照该会话的 events_statements_history.SQL_TEXT。',
          source: 'https://dev.mysql.com/doc/refman/8.0/en/performance-schema-events-statements-history-table.html'
        },
        evidence: [
          { object: 'SQL 层', action: '接收 SELECT 文本', result: '可通过客户端输入或已采集的 SQL_TEXT 核对语句' }
        ],
        inspector: {
          fields: [
            { name: '输入', value: '客户端提交的 SQL 文本' },
            { name: '观察字段', value: 'Performance Schema 语句历史的 SQL_TEXT', note: '需要启用相应语句历史采集' }
          ],
          struct: { title: '本次查询的 SQL 文本', text: selectSql }
        }
      },
      {
        no: 3,
        title: '解析与预处理',
        layer: 'sql',
        time: '0.014 s',
        links: [],
        narration: '解析器识别语句结构，后续解析名称引用。SQL 关键字拼错时，服务器可以在语法检查阶段返回错误。',
        highlight: ['parser'],
        check: {
          instruction: '在 MySQL 8.0 测试会话执行拼错关键字的语句，核对 ER_PARSE_ERROR（1064）。下面的解析树只用来说明语句结构。',
          command: 'SELEC name FROM users WHERE id = 1;',
          source: 'https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html#error_er_parse_error'
        },
        evidence: [
          { object: '解析器', action: '识别 SELECT、表名和谓词', result: '语法写错时返回 ER_PARSE_ERROR' }
        ],
        inspector: {
          fields: [
            { name: '投影', value: 'name' },
            { name: '来源', value: 'users' },
            { name: '谓词', value: 'id = 1' }
          ],
          struct: { title: '概念解析树', text: 'SELECT\n├─ 列    name\n├─ 表    users\n└─ 条件  id = 1' }
        }
      },
      {
        no: 4,
        title: '优化器制定执行计划',
        layer: 'sql',
        time: '0.016 s',
        links: [],
        narration: '优化器决定用什么方式访问表。本例按主键等值查找，EXPLAIN 可以展示访问类型、所用索引与估计扫描行数。',
        highlight: ['optimizer'],
        check: {
          instruction: '在 MySQL 8.0 测试库对示例查询执行 EXPLAIN，观察 type、key 和 rows。',
          command: 'EXPLAIN FORMAT=TRADITIONAL\n' + selectSql,
          example: { title: 'EXPLAIN · 字段片段', text: 'table  type   key      rows\nusers  const  PRIMARY     1' },
          source: 'https://dev.mysql.com/doc/refman/8.0/en/explain-output.html'
        },
        evidence: [
          { object: '优化器', action: '确定主键访问方式', result: 'EXPLAIN 的 type、key、rows 给出计划信息' }
        ],
        inspector: {
          fields: [
            { name: 'type', value: 'const', note: '按主键等值匹配，最多一行' },
            { name: 'key', value: 'PRIMARY', note: '选中的索引名' },
            { name: 'rows', value: '1', note: '优化器估计的检查行数' }
          ]
        }
      },
      {
        no: 5,
        title: 'InnoDB 读取所需数据页',
        layer: 'innodb',
        time: '0.024 s',
        links: [
          { from: 'executor', to: 'bp', label: '按计划取数' },
          { from: 'bp', to: 'disk', label: '未命中 · 读页' }
        ],
        narration: 'InnoDB 先在 Buffer Pool 查找所需的数据页。本图选择未命中路径，因此还显示从表空间文件读入的一段。命中时直接使用内存里的页。',
        highlight: ['executor', 'bp', 'disk'],
        check: {
          instruction: '在隔离的 MySQL 8.0 测试实例观察两项全局计数。它们可帮助区分逻辑读请求与 Buffer Pool 未满足的读请求，单次变化无法归因给某条查询。',
          command: "SHOW GLOBAL STATUS\nWHERE Variable_name IN (\n  'Innodb_buffer_pool_read_requests',\n  'Innodb_buffer_pool_reads'\n);",
          source: 'https://dev.mysql.com/doc/refman/8.0/en/server-status-variables.html#statvar_Innodb_buffer_pool_reads'
        },
        evidence: [
          { object: 'Buffer Pool', action: '查找所需页', result: '命中走内存，本图示例走未命中分支' },
          { object: '表空间文件', action: '读入所需数据页', result: '图中额外的读页连线对应未命中路径' }
        ],
        inspector: {
          fields: [
            { name: '读请求', value: 'Innodb_buffer_pool_read_requests', note: '全局逻辑读请求计数' },
            { name: '未命中读', value: 'Innodb_buffer_pool_reads', note: '全局未能由 Buffer Pool 满足的读请求计数' }
          ],
          struct: { title: '数据页读取路径', text: '数据页请求\n├─ 命中      从 Buffer Pool 取页\n└─ 未命中    从表空间读入缓冲池' }
        }
      },
      {
        no: 6,
        title: '结果返回客户端',
        layer: 'conn',
        time: '0.041 s',
        links: [{ from: 'thread', to: 'client', label: '返回结果集' }],
        narration: '服务器将结果集发给客户端。这个示例只请求 name 列，示例表里有一行满足主键条件。',
        highlight: ['client', 'thread'],
        check: {
          instruction: '在建好示例表的 MySQL 8.0 测试库执行查询，核对客户端显示的列名与结果行。',
          command: selectSql,
          source: 'https://dev.mysql.com/doc/refman/8.0/en/select.html'
        },
        evidence: [
          { object: '客户端', action: '接收结果集', result: '显示 name 列及符合 id = 1 的行' }
        ],
        inspector: {
          fields: [
            { name: '结果列', value: 'name' },
            { name: '示例行', value: '示例' }
          ],
          struct: { title: '客户端结果集', text: '+------+\n| name |\n+------+\n| 示例 |\n+------+' }
        }
      }
    ],
    challenge: {
      prompt: '如果再次执行同一条查询时，所需页已在 Buffer Pool 里，画面上哪条连线会省掉？单凭 EXPLAIN 能判断这次是否读盘吗？',
      answer: '省掉从表空间读取所需页的那一段。EXPLAIN 展示访问计划，所需页当时是否在缓冲池里属于另一个观察维度。'
    }
  }
];
