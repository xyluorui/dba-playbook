# 交互实验室

在浏览器里单步观察数据库机制，从拓扑、时序和可核对的证据理解每一步。教学方法见 [交互式学习体验设计](../docs/06-methodology/interactive-learning-design.html)。

## 索引

| 内容 | 说明 |
| --- | --- |
| [一条 SELECT 的旅程](demo-sql-journey.html) | MySQL 8.0.x / InnoDB，含无 JavaScript 时可读的静态步骤 |
| [交互实验应用](app/index.html) | 拓扑、时序、逐步证据、事件流和检查器 |
| `sql-journey-select/design-card.md` | 学习目标、示例范围与在隔离测试实例核对的方法 |

## 使用

- 打开 [实验应用](app/index.html) 后，从示例 SQL 下方的播放栏开始。点编号或时序图的行，可跳转到对应步骤。
- 每一步的高亮、说明和证据同步更新。展开「完整事件流」可查看各步的对象、动作和证据，选中一行可打开该步的检查器。
- `←` / `→` 上一步 / 下一步，`空格` 播放 / 暂停，`Esc` 关闭检查器。播放速度和事件时间为教学示意。
- `app/index.html` 可通过 `file://` 直接打开。应用使用原生 JavaScript 和本地资源，主题样式来自站点共享的 [tokens.css](../assets/site/tokens.css)。

## 实验结构

| 路径 | 职责 |
| --- | --- |
| `app/index.html` | 实验外壳和静态说明入口 |
| `app/scenes/<id>.js` | 声明式场景、步骤和证据 |
| `<id>/design-card.md` | 用模板填写的设计卡与核对方式 |
| `app/js/` | 播放器、拓扑、时序与检查器渲染 |

每个实验先写 [设计卡](../templates/experiment-card-template.md)，再添加场景和静态入口。使用 `LAB_CATALOG` 将实验 `id` 放入相应教学单元，`LAB_SCENES` 提供实验内容。

| 场景字段 | 内容 |
| --- | --- |
| `id`、`title`、`category`、`outline` | 标识、中文标题、分类与对应大纲节点 |
| `question`、`input` | 首屏要观察的问题和示例输入。输入含 `label`、`language` 和 `text` |
| `version`、`engine`、`assumptions` | 适用版本、引擎和边界。边界需写明数据是否为示例、省略的细节、播放时间的含义 |
| `layers`、`objects` | 拓扑分层与对象，`layers[].color` 可用 `blue`、`green`、`amber`、`purple`。当前布局每层最多三个对象 |
| `sequenceActors` | 时序图参与者，每项提供 `label` 和关联的对象 ID 数组 `objects` |
| `steps` | 依次呈现的步骤 |
| `references`、`challenge` | 关联知识链接及迁移挑战，挑战含 `prompt` 和 `answer` |

| 步骤字段 | 内容 |
| --- | --- |
| `no`、`title`、`layer`、`time` | 从 1 连续编号、标题、主要层和教学时间 |
| `links`、`highlight` | 本步连线和高亮对象。连线含 `from`、`to` 对象 ID 及 `label`。组件内部步骤的连线可以为空 |
| `narration`、`check` | 当前解释和核对方式。核对含 `instruction`，可选的 `command`、`example: {title, text}` 和官方 `source` |
| `evidence` | 事件记录，每条含 `object`、`action` 和 `result` |
| `inspector` | 字段 `{name, value, note?}` 和可选的示意片段 `{title, text}`，示意片段自动标记为「示例」 |

合入前核对版本、边界和官方来源，实际验证设计卡所述的核对方式，并在浏览器点通单步、回看、重置、播放、切换视图、事件检查器与明暗主题。
