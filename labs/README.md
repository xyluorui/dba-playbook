# 交互实验室（labs）

把知识库里的机制类知识做成**可交互的学习实验**：单步执行、改条件、看结果变化。
方法与设计规范见 [docs/06-methodology/interactive-learning-design.html](../docs/06-methodology/interactive-learning-design.html)，
本文只讲 labs/ 目录本身的组织方式和场景数据格式。

> 状态：P0 基座已就位——全屏实验应用（对齐 Protocol Explorer 的界面形态）+ 第一个场景《一条 SELECT 的旅程》。
> "改条件对比"等实验交互从 P1 开始。

## 目录结构

| 路径 | 放什么 |
|------|--------|
| `app/index.html` | 全屏实验应用外壳：顶栏（进度/主题）、课程目录、画面、概览、事件流 |
| `app/css/app.css` | 设计系统：配色（明/暗）、版式、组件、动效 |
| `app/js/` | 渲染模块：`app.js`（状态与面板）、`topology.js`（网络视图）、`sequence.js`（时序视图）、`inspector.js`（检查器） |
| `app/scenes/<场景 id>.js` | 场景数据（声明式，一个实验一份；实验设计卡存同名 `design-card.md`，用 [templates/experiment-card-template.md](../templates/experiment-card-template.md) 填写） |
| `*.html` | 知识入口页（站点内容页，进导航；链接到 `app/`） |

> `app/` 是独立全屏应用：**不参与站点外壳同步**（无 shell 标记块），`app/index.html` 也不会被 `build.py` 的目录页生成覆盖（工具跳过 index.html）。
> 它只是被知识入口页和文档链接引用，`build.py --check` 不校验其内部脚本，改完请自己在浏览器点一遍。

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| [demo-sql-journey.html](demo-sql-journey.html) | 知识入口：一条 SELECT 的旅程（含静态步骤一览，Obsidian 可读） | 2026-11-05 |
| [app/index.html](app/index.html) | 交互应用：网络/时序双视图 + 事件流 + 步骤检查器 + 明暗主题 | 2026-11-05 |

## 场景数据格式（app/scenes/*.js）

场景是纯数据，不写渲染逻辑；应用负责展示。一个场景一个文件，内容为给全局变量赋值：

```js
window.LAB_CATALOG = [ ... ];   // 课程目录：单元 → 场景
window.LAB_SCENES   = [ ... ];  // 场景本体（数组，便于后续多场景）
```

### 目录条目（LAB_CATALOG[]）

| 字段 | 必填 | 说明 |
|------|------|------|
| `unit` | ✅ | 教学单元名，如 `U2 · 索引实验室` |
| `category` | ✅ | 分类（左侧筛选标签）：基础 / 索引 / 事务 / 锁 / 日志 / 运维 |
| `scenes` | ✅ | 该单元已上线的场景 id 数组 |
| `planned` | | 开发中的实验清单（渲染为"开发中（P1 起）"占位） |

### 场景字段（LAB_SCENES[]）

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | ✅ | 场景 id，英文小写 + 短横线，与文件名一致 |
| `title` / `subtitle` | ✅ | 中文标题 / 一句话副标题 |
| `category` / `status` | ✅ | 分类；状态角标（学习中 / 未开始 / 已完成） |
| `outline` | ✅ | 对应大纲节点编号数组（可多个），回溯到 [docs/02-mysql/overview.html](../docs/02-mysql/overview.html) |
| `version` | ✅ | 适用版本，如 `MySQL 8.0.x` |
| `engine` | ✅ | 存储引擎 / 环境前提，如 `InnoDB` |
| `assumptions` | ✅ | 简化假设与边界声明数组（见下方"边界标注规范"） |
| `description` | ✅ | 概览卡里的一段介绍 |
| `meta` | ✅ | 概览卡元信息行，`{k, v, href?}` 数组（`href` 有值时渲染为链接） |
| `layers` | ✅ | 观察层次，`{id, name, color}` 数组；`color` 取 blue / green / amber / purple |
| `objects` | ✅ | 画面对象，`{id, layer, label}` 数组；`layer` 对应 `layers[].id` |
| `steps` | ✅ | 步骤数组（见下） |
| `challenge` | ✅ | 迁移挑战，`{prompt, answer}`（answer 收在"看提示答案"里） |

### 步骤字段（steps[]）

| 字段 | 必填 | 说明 |
|------|------|------|
| `no` | ✅ | 序号，从 1 开始 |
| `title` | ✅ | 步骤小标题 |
| `layer` | ✅ | 所在层次（对应 `layers[].id`），决定事件流圆点与图例颜色 |
| `time` | ✅ | 时间戳（**示例值**，如 `0.012s`），渲染进事件流与时序视图 |
| `stage` | | 网络视图要高亮的层带（`layers[].id`） |
| `flow` | | 网络视图要点亮的轨道：`client-server` / `server-disk` / null |
| `seq` | | 时序视图箭头 `{from, to, label}`（对象 id 对应参与者列）；组件内部步骤写 `null`（画成注记框） |
| `narration` | ✅ | 讲解：这一步发生了什么，两三句话 |
| `highlight` | | 当前步要高亮的对象 id 数组 |
| `evidence` | ✅ | 事件流行，`{object, action, result}` 数组；`result` 写学习者能指着说的证据 |
| `inspector` | ✅ | 检查器内容 `{fields, struct}`：`fields` 为 `{name, value, note?}`（note 是教学注释）；`struct` 为 `{title, text}` 结构示意（等宽文本，自动打"示例"角标） |

### 边界标注规范（红线配套）

`assumptions` 不是可选项，每个场景至少覆盖以下三类（没有的写"无"并说明）：

1. **示例数据声明**：数据是构造的示例，不代表真实业务（含时间戳、报文等）；
2. **省略的机制**：教学上简化掉了什么（如"省略权限校验、查询缓存（8.0 已移除）"）；
3. **节奏声明**：教学单步节奏与实测耗时无关。

另外 `version` / `engine` 会渲染成页面角标——版本差异是硬要求，改场景时不要删。
检查器底部与事件流底部的免责声明由应用统一渲染，无需写进场景。

## 本地验证

- **双击 `app/index.html`** 即可打开（纯静态、无网络请求）；或 `powershell -File scripts/site/serve.ps1` 后从导航进知识入口页；
- 快捷键：`←` / `→` 上下一步，`空格` 播放/暂停，`Esc` 关闭检查器；
- 交互应用需要浏览器启用 JavaScript；不开 JS 时请读知识入口页的静态"步骤一览"。

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`，labs 专项规则见 [AGENTS.md](AGENTS.md)。
