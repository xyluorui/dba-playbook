# 站点工具

发布站点由 `src/` 中的 Astro 页面和布局生成，Pagefind 从构建后的页面建立全文搜索索引。内容源是一篇一个 `.html` 的独立页面，目录 README 继续作为内容索引。本目录的 Python 工具用于新建页面、预渲染图和维护仓库内的离线阅读版。

## 发布版预览与校验

使用 Node.js 24，在仓库根目录运行以下命令。

```sh
npm ci           # 首次安装依赖
npm run dev      # Astro 本地开发预览
npm run check    # 构建 dist/ 和 Pagefind 索引，并校验发布文件
npm run preview  # 预览 dist/，可验证全文搜索
```

在命令输出的本地地址下打开 `/dba-playbook/`。使用 `npm run dev -- stop` 可停止开发服务。发布校验覆盖旧 HTML 路径、正文锚点、相对链接和发布文件范围。新增知识页后重新构建，即可在对应专题和全文搜索中找到它。

## 文件清单

| 文件 | 用途 |
|------|------|
| `build.py` | 离线阅读版生成器，维护仓库内的导航 `nav.js`、搜索索引 `search-index.js`、目录页和首页 |
| `serve.ps1` | Windows 下的离线阅读版预览，构建后启动本地服务并打开浏览器 |
| `new-doc.py` | 从模板创建新内容页（替换 `{{ROOT}}` / `{{TITLE}}` 等占位符） |
| `render-diagrams.py` | Mermaid 图预渲染为内嵌 SVG（静态查看器可显示；需 Node.js） |
| `sync-shell.py` | 把外壳、静态主题、页头（徽章+页内目录）、代码高亮同步到所有手写页与模板；`--check` 只检查 |
| `theme.css` | **静态阅读主题**源文件（正文/表格/代码/徽章/卡片），内嵌进每个页面；浏览器与 Obsidian 共用 |
| `highlight.js` | 构建期代码高亮（Node，复用 `assets/site/highlight.min.js`），由 sitekit 调用 |
| `md2html.py` | Markdown → 内容页迁移（一次性；导入外部笔记可用） |
| `sitekit.py` | Python 工具的公共库，负责离线页面外壳、Markdown 子集渲染和链接改写 |
| `page-template.html` | 通用内容页骨架（`new-doc.py --type doc` 的模板） |

## 新建内容与离线生成

```sh
# 新建文档（案例自动加日期前缀）
python scripts/site/new-doc.py --type case --dir cases/02-performance --slug replica-delay --title "主从延迟导致查询超时" --database MySQL
python scripts/site/new-doc.py --type doc --dir docs/02-mysql/02-innodb --slug buffer-pool --title "Buffer Pool 与 LRU"

# 有 Mermaid 图时：预渲染为内嵌 SVG（改图后重跑）
python scripts/site/render-diagrams.py

# 改了页面外壳（sitekit.py 的 SHELL_*/兜底样式）后：同步到手写页与模板
python scripts/site/sync-shell.py

# 内容有增删改后，刷新仓库内的离线导航、搜索索引和目录页
python scripts/site/build.py

# 提交前校验离线生成物、链接和元信息
python scripts/site/build.py --check
```

工作流为新建或修改内容，更新目录 `README.md` 索引，按需运行 `render-diagrams.py`，再运行 `build.py` 与两套校验。离线生成物随内容提交。

## 离线生成物

- `assets/site/nav.js`、`assets/site/search-index.js`
- 站点根 `index.html`、各内容目录 `index.html`（由该目录 `README.md` 渲染 + 自动补漏）

这些文件带有 `AUTO-GENERATED` 标记，由 Python 工具生成。`--check` 会比较文件是否同步。Astro 的发布产物单独输出到 `dist/`。

## HTML 内容页规范

- **页面外壳由标记块托管**：手写页里 `fallback-style`、`shell:top`、`shell:bottom`、`page-head` 四段标记块是 `sync-shell.py` 同步的区域，**不要手改块内内容**；
  正文放在 `<article class="content">…</article>` 里（两段标记之间），不要删标记

- 命名：英文小写 + 短横线；案例 `YYYY-MM-DD-<slug>.html`；中文标题写在 `<h1>`
- 元信息块：`<head>` 里的 `<meta name="..." content="...">`，必填 `database`、`status`，
  建议 `category`、`tags`、`date`（案例另有 `severity`、`source`）。发布版与离线版用这些字段渲染徽章
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

## GitHub Pages 发布

工作流会在 PR 和 `main` 上运行 `build.py --check` 检查离线版，并用 `npm run check` 构建与校验发布版。`main` 校验通过后，GitHub Actions 上传 `dist/` 并部署到 Pages。在仓库 Settings → Pages 中选择 GitHub Actions 作为发布来源。 [GitHub Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 依赖

发布版使用 Node.js 24 和 `package-lock.json` 锁定的依赖。离线工具使用 Python 3.9+ 标准库，Mermaid 预渲染及构建期代码高亮还需要 Node.js。`mermaid.min.js` 和 `highlight.min.js` 存在 `assets/site/`，支持离线使用。
