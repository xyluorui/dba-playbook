# 交互实验室（labs）

把知识库里的机制类知识做成**可交互的学习实验**：单步执行、改条件、看结果变化。
方法与设计规范见 [docs/06-methodology/interactive-learning-design.html](../docs/06-methodology/interactive-learning-design.html)，
本文只讲 labs/ 目录本身的组织方式和场景数据格式。

> 状态：P0 基座。当前只有一个"无交互单步演示"用于验证引擎与数据格式，实验内容（索引实验室等）从 P1 开始。

## 目录结构

| 路径 | 放什么 |
|------|--------|
| `engine/step-player.js` | 单步引擎（雏形）：读取场景数据，渲染步骤列表、画面、证据表、播放控件 |
| `scenes/<场景 id>.js` | 场景数据（声明式，一个实验一份；实验设计卡存同名 `design-card.md`，用 [templates/experiment-card-template.md](../templates/experiment-card-template.md) 填写） |
| `*.html` | 演示页（站点内容页，进导航；每页挂一个场景） |

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| [demo-sql-journey.html](demo-sql-journey.html) | 演示：一条 SELECT 的旅程（单步）——验证单步引擎与场景数据格式 | 2026-11-05 |

## 场景数据格式（scenes/*.js）

场景是纯数据，不写渲染逻辑；引擎负责展示。一个场景一个文件，内容为给全局变量赋值：

```js
window.LAB_SCENE = { ... };
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | ✅ | 场景 id，英文小写 + 短横线，与文件名一致 |
| `title` | ✅ | 中文标题 |
| `outline` | ✅ | 对应大纲节点编号数组（可多个），回溯到 [docs/02-mysql/overview.html](../docs/02-mysql/overview.html) |
| `version` | ✅ | 适用版本，如 `MySQL 8.0.x` |
| `engine` | ✅ | 存储引擎 / 环境前提，如 `InnoDB` |
| `assumptions` | ✅ | 简化假设与边界声明数组，至少一条（见下方"边界标注规范"） |
| `layers` | | 画面的观察层次，如连接层 / SQL 层 / InnoDB / 文件层；`{id, name}` 数组 |
| `objects` | | 画面对象，`{id, layer, label}` 数组；`layer` 对应 `layers[].id` |
| `steps` | ✅ | 步骤数组（见下） |
| `challenge` | | 迁移挑战，`{prompt, answer}`；引擎预留字段，当前版本不渲染 |

### 步骤字段（steps[]）

| 字段 | 必填 | 说明 |
|------|------|------|
| `no` | ✅ | 序号，从 1 开始 |
| `title` | ✅ | 步骤小标题 |
| `layer` | ✅ | 所在层次（对应 `layers[].id`），画面高亮用 |
| `narration` | ✅ | 讲解：这一步发生了什么，两三句话 |
| `highlight` | | 当前步要高亮的对象 id 数组 |
| `evidence` | | 证据表行，`{object, action, result}` 数组；`result` 写学习者能指着说的证据 |

### 边界标注规范（红线配套）

`assumptions` 不是可选项，每个场景至少覆盖以下三类（没有的写"无"并说明）：

1. **示例数据声明**：数据是构造的示例，不代表真实业务（如"示例数据与示例耗时均为示意"）；
2. **省略的机制**：教学上简化掉了什么（如"省略权限校验、查询缓存（8.0 已移除）"）；
3. **节奏声明**：教学单步节奏与实测耗时无关。

另外 `version` / `engine` 会渲染成页面角标——版本差异是硬要求，改场景时不要删。

## 本地验证

演示页是普通内容页：`powershell -File scripts/site/serve.ps1` 后从导航进，
或直接双击 `demo-sql-journey.html`（场景与引擎是普通 `<script>` 引入，file:// 下可用）。
交互演示需要浏览器启用 JavaScript；不开 JS 时页面只剩静态说明。

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`，labs 专项规则见 [AGENTS.md](AGENTS.md)。
