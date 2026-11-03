# 站点工具

把本仓库构建成可浏览的静态站点：导航、全文搜索、Mermaid 渲染、一键本地预览、GitHub Pages 发布。

> 内容文档全部以 `.html` 存放（规范类文档如 `AGENTS.md`、`README.md`、`CONTRIBUTING.md` 保留 Markdown）。
> 本目录是站点工具本身，不进站点导航。

## 文件清单

| 文件 | 用途 |
|------|------|
| `build.py` | 核心生成器：导航 `nav.js`、搜索索引 `search-index.js`、各目录 `index.html`、站点首页 |
| `serve.ps1` | 本地一键预览：构建 + 起服务 + 自动打开浏览器 |
| `new-doc.py` | 从模板创建新内容页（替换 `{{ROOT}}` / `{{TITLE}}` 等占位符） |
| `render-diagrams.py` | Mermaid 图预渲染为内嵌 SVG（静态查看器可显示；需 Node.js） |
| `sync-shell.py` | 把外壳、静态主题、页头（徽章+页内目录）、代码高亮同步到所有手写页与模板；`--check` 只检查 |
| `theme.css` | **静态阅读主题**源文件（正文/表格/代码/徽章/卡片），内嵌进每个页面；浏览器与 Obsidian 共用 |
| `highlight.js` | 构建期代码高亮（Node，复用 `assets/site/highlight.min.js`），由 sitekit 调用 |
| `md2html.py` | Markdown → 内容页迁移（一次性；导入外部笔记可用） |
| `sitekit.py` | 公共库：Markdown 子集渲染、**页面外壳唯一来源**（`SHELL_TOP`/`SHELL_BOTTOM`/兜底样式）、链接改写（被上面几个引用） |
| `page-template.html` | 通用内容页骨架（`new-doc.py --type doc` 的模板） |

## 日常用法

```powershell
# 本地预览（浏览器打开 http://127.0.0.1:8600）
powershell -File scripts/site/serve.ps1

# 新建文档（案例自动加日期前缀）
python scripts/site/new-doc.py --type case --dir cases/02-performance --slug replica-delay --title "主从延迟导致查询超时" --database MySQL
python scripts/site/new-doc.py --type doc --dir docs/02-mysql/02-innodb --slug buffer-pool --title "Buffer Pool 与 LRU"

# 有 Mermaid 图时：预渲染为内嵌 SVG（改图后重跑）
python scripts/site/render-diagrams.py

# 改了页面外壳（sitekit.py 的 SHELL_*/兜底样式）后：同步到手写页与模板
python scripts/site/sync-shell.py

# 内容有增删改后，刷新生成物（导航/搜索索引/目录页）
python scripts/site/build.py

# 提交前校验（CI 同款）：生成物是否最新、链接、元信息
python scripts/site/build.py --check
```

工作流：**新建/修改内容 →（有图则）`render-diagrams.py` → `build.py` → 更新所在目录 `README.md` 索引 → 提交**（生成物一并提交）。

## 生成物（勿手改，均带 AUTO-GENERATED 标记）

- `assets/site/nav.js`、`assets/site/search-index.js`
- 站点根 `index.html`、各内容目录 `index.html`（由该目录 `README.md` 渲染 + 自动补漏）

生成是确定性的：内容没变时重复运行结果一致；`--check` 会对比内容是否过期。

## HTML 内容页规范

- **页面外壳由标记块托管**：手写页里 `fallback-style`、`shell:top`、`shell:bottom`、`page-head` 四段标记块是 `sync-shell.py` 同步的区域，**不要手改块内内容**；
  正文放在 `<article class="content">…</article>` 里（两段标记之间），不要删标记

- 命名：英文小写 + 短横线；案例 `YYYY-MM-DD-<slug>.html`；中文标题写在 `<h1>`
- 元信息块：`<head>` 里的 `<meta name="..." content="...">`，必填 `database`、`status`，
  建议 `category`、`tags`、`date`（案例另有 `severity`、`source`）；徽章由 `ui.js` 自动渲染
- **Mermaid 图**：先写 `<pre class="mermaid">…</pre>`（浏览器即时渲染），
  定稿后 `python scripts/site/render-diagrams.py` 预渲染为**内嵌 SVG**（源码保留在 `<!-- mermaid -->` 注释，改图后重跑）；
  代码块：`<pre><code class="language-sql">…</code></pre>`
- 前端依赖按需加载：`ui.js` 仅在页面有未预渲染的 `pre.mermaid` 时才加载 `mermaid.min.js`、有未预渲染的 `code.language-xxx` 时才加载 `highlight.min.js`
- 代码块里的文本**不要带页面缩进**（`<pre>` 内容顶格写），否则渲染出多余前导空格
- 资源与交叉引用**一律相对路径**（`{{ROOT}}` 前缀），禁止 `/assets/...` 根路径（GitHub Pages 子路径下会断）
- 脱敏、版本标注、来源可溯等红线不变（见仓库根 `AGENTS.md`）

## Obsidian（HTML Reader 插件）兼容

插件默认 Balance 模式：**删除所有 `<script>`**、按白名单**剥掉不认识的属性**、`<base>` 指向文件所在目录。
因此内容页按「静态优先」设计——不执行任何脚本也是完整、好看的阅读版：

1. **版式内嵌**：`scripts/site/theme.css`（浅/深色自动、表格斑马纹、标题强调线、卡片、徽章）整份内嵌到每页 `<head>`，
   不依赖外部 CSS。改版式只改 `theme.css`，再 `sync-shell.py` / `build.py`
2. **徽章与页内目录构建期生成**：`<!-- page-head -->` 块里是静态 HTML（元信息徽章 + 可折叠「本文目录」），不靠 JS
3. **代码高亮构建期预渲染**：`pre > code.language-xxx.hljs` 里是现成的 `<span class="hljs-…">`（需 Node；无 Node 时跳过，浏览器端兜底）
4. **图不依赖 JS**：Mermaid 预渲染为内嵌 SVG；SVG 的 `dominant-baseline` 等会被白名单剥掉的属性已迁入 `style`
5. **浏览器增强**：`html.js`（内嵌一行脚本打标记）下 `site.css` 才启用固定头部、侧栏、搜索、悬浮目录；
   Obsidian 里这些不出现，是单栏阅读版式
6. 在 Obsidian 里点站内链接会在新标签页打开（插件行为）；侧栏/搜索请用浏览器

## 链接改写规则（md → html 场景自动应用）

| 原链接 | 改写为 | 说明 |
|--------|--------|------|
| `README.md` | `index.html` | 目录导航页 |
| 内容 `xxx.md` | `xxx.html` | 内容文档 |
| `AGENTS.md` / `CONTRIBUTING.md` / `templates/*.md` | 不变 | 规范文档保持 Markdown 原样 |
| 目录 `xxx/` | `xxx/index.html` | |
| 外链 / 锚点 | 不变 | |

## 发布（GitHub Actions → GitHub Pages）

`.github/workflows/pages.yml`：push 到 `main` 自动执行
`build.py --check`（链接/元信息/生成物与手写页外壳同步校验）→ `build.py --stage _site`（组装发布目录）→ 部署。
仓库 Settings → Pages 选 "GitHub Actions" 作为来源即可，本地与线上共用同一套构建逻辑。

## 依赖

仅 Python 3.9+ 标准库；前端资源（`mermaid.min.js`、`highlight.min.js`）已本地化到 `assets/site/`，离线可用。
