# AGENTS.md — AI Agent 协作指南

> 本文件面向在本仓库工作的 AI agent。人类贡献者请看 [CONTRIBUTING.md](CONTRIBUTING.md)。
> 规则优先级：**全局红线 > 子目录 AGENTS.md > 通用规范**；子目录规则只做细化，不得放宽上层红线。

## 仓库定位

dba-playbook 是个人 DBA 知识库：沉淀数据库知识与真实场景处理经验。目标是**长期可维护、可检索、可复用**——宁可少写，不写废内容。

## 目录职责

| 路径 | 放什么 | 不放什么 |
|------|--------|----------|
| `docs/` | 体系化知识：原理、配置、方法论 | 单次事故记录（去 `cases/`） |
| `cases/` | 单次真实事件的完整记录 | 泛泛的知识点（去 `docs/`） |
| `runbooks/` | 可照做的 SOP | 原理展开（链接到 `docs/`） |
| `labs/` | 交互学习实验：场景数据、单步引擎、演示页 | 知识正文（去 `docs/`） |
| `src/` | Astro 站点页面、公共布局、内容接入和发布校验 | 知识正文与实验数据 |
| `scripts/` | 可运行、可复用的脚本 | 一次性命令片段（放文档代码块即可） |
| `templates/` | 各类模板 | 实际内容 |
| `assets/` | 图片等素材 | 大文件、数据导出 |

## 全局红线（最高优先级，任何任务不得违反）

1. **脱敏**：真实密码/密钥、内网 IP、主机名、公司/客户名、真实表名与业务数据必须替换（IP → `10.0.0.x`，密码 → `***`，公司 → `某互联网公司`）。截图必须检查并打码。
2. **不编造**：案例只记录真实发生的事件或实际验证过的实验。不确定的细节写 `（待确认）`，事后补全；**禁止为了内容完整而虚构时间、数值、日志输出**。
3. **版本标注**：命令、参数、行为差异必须标注适用版本（如 `MySQL 8.0.x`、`Redis 7.x`），存在版本差异时写明"X 及以上/以下"。
4. **不入库敏感/大文件**：数据导出、备份、密钥一律不提交（见 `.gitignore`）。
5. **来源可溯**：结论引用官方文档并附链接，或注明"个人实验验证"；不搬运第三方文章全文。

## 文档通用规范

- **格式**：内容文档以独立 **HTML** 存放，浏览器可直接阅读，发布版从 `<article class="content">` 和 `<head>` 元信息生成页面。`README.md`、各级 `AGENTS.md`、`CONTRIBUTING.md`、`templates/*.md` 保留 Markdown，作为索引与规范。
- **命名**：路径英文小写 + 短横线；案例文件 `YYYY-MM-DD-<slug>.html`；文件名不超过 5 个词；中文标题写在 `<h1>`。
- **元信息块**：`docs/` 与 `cases/` 的文档必须带（`<head>` 内 `<meta name="..." content="...">`，`database` / `status` 必填），字段见 `templates/` 对应模板。
- **代码块**：`<pre><code class="language-sql">` 标注语言；Mermaid 图先写 `<pre class="mermaid">`，定稿后运行 `python scripts/site/render-diagrams.py` 预渲染为内嵌 SVG（Obsidian 等静态查看器也能显示）；命令块说明执行位置（哪台主机、哪个实例/库）；输出只贴关键片段。
- **正文**：中文为主，技术名词保留英文；一篇一个主题；交叉引用用相对链接（内容文档间指向 `.html`）；资源与链接**禁止根路径**（如 `/assets/...`，GitHub Pages 子路径下会断），一律相对路径。
- **索引**：新增/删除/改名文档后，同步更新所在目录 `README.md` 索引表（内容文档链接指向 `.html`）；新增板块时更新根 `README.md` 知识地图。
- **离线生成物**：内容增删改后运行 `python scripts/site/build.py`，刷新仓库内可离线浏览的导航、索引和目录页（`index.html`、`assets/site/nav.js` 等，带 AUTO-GENERATED 标记），与内容一并提交。
- **发布生成物**：`npm run check` 构建 Astro 站点与全文搜索，并检查发布目录 `dist/` 的路径、链接和锚点。发布产物由 CI 构建。

## 本地站点与发布

本地使用 Node.js 24，首次运行 `npm ci`，随后用 `npm run dev` 预览页面。运行 `npm run check` 后可用 `npm run preview` 预览带搜索索引的发布版。GitHub Actions 校验 PR 并将 `main` 的 Astro 构建产物发布到 GitHub Pages。
工具用法与页面规范见 [scripts/site/README.md](scripts/site/README.md)。

## 标准工作流

1. 读本文件与目标目录的 `AGENTS.md`（如 `cases/AGENTS.md`）。
2. 用 `python scripts/site/new-doc.py` 创建文档（或复制 `templates/` 对应 HTML 模板）。
3. 写完自检：
   - [ ] 脱敏检查（红线 1）
   - [ ] 版本标注（红线 3）
   - [ ] 元信息块完整（`database` / `status` 必填）
   - [ ] Mermaid 图已预渲染（含图文档：`python scripts/site/render-diagrams.py`）
   - [ ] 相对链接、旧地址和章节锚点可解析（`npm run check`）
   - [ ] 所在目录 README 索引已更新
   - [ ] `python scripts/site/build.py` 离线生成物已刷新并提交，`python scripts/site/build.py --check` 通过
4. 提交信息用 Conventional Commits：`docs(mysql): ...`、`cases(redis): ...`、`runbooks: ...`、`scripts(shell): ...`、`chore: ...`。

## 子级 AGENTS.md

| 文件 | 管辖范围 |
|------|----------|
| `docs/AGENTS.md` | 知识文章通用要求 |
| `docs/02-mysql/AGENTS.md` | MySQL 专项要求 |
| `docs/04-redis/AGENTS.md` | Redis 专项要求 |
| `cases/AGENTS.md` | 案例记录要求 |
| `runbooks/AGENTS.md` | 操作手册要求 |
| `labs/AGENTS.md` | 交互实验要求 |
| `scripts/AGENTS.md` | 脚本要求 |
| `templates/AGENTS.md` | 模板维护规则 |

更深层目录如需特殊规则，在该目录新增 `AGENTS.md` 就近覆盖上层规则（只能加严，不能放宽红线）。
