# DBA Playbook

个人 DBA 知识库与实战手册：体系化知识、真实案例、操作手册、可复用脚本的长期沉淀。

内容由本人与 AI agent 共同维护，agent 请先阅读 [AGENTS.md](AGENTS.md)，人类贡献规范见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 知识地图

| 板块 | 路径 | 说明 |
|------|------|------|
| 📚 体系化知识 | [docs/](docs/) | 原理、配置、方法论，按数据库与主题组织，内容相对稳定 |
| 🧯 场景与案例 | [cases/](cases/) | 真实故障与问题的完整记录：现象→排查→根因→复盘 |
| 📋 操作手册 | [runbooks/](runbooks/) | 可照做的 SOP：前置检查、步骤、验证、回滚 |
| 🧪 交互实验室 | [labs/](labs/) | 可交互的学习实验：单步演示、对照实验（P0 起步） |
| 🔧 可复用脚本 | [scripts/](scripts/) | 巡检、分析、治理脚本，按数据库/语言组织 |
| 🧩 模板 | [templates/](templates/) | 案例、复盘、Runbook 标准模板 |
| 🖼 素材 | [assets/](assets/) | 截图、架构图、压测曲线 |

### docs 细分

| 目录 | 主题 |
|------|------|
| [docs/01-foundations/](docs/01-foundations/) | 通用基础：Linux、网络、存储、SQL |
| [docs/02-mysql/](docs/02-mysql/) | MySQL：按「一条 SQL 的旅程」组织成 12 章，见 [学习地图](docs/02-mysql/overview.html) |
| [docs/03-postgresql/](docs/03-postgresql/) | PostgreSQL（预留） |
| [docs/04-redis/](docs/04-redis/) | Redis：架构、持久化、集群与高可用、性能、内存分析、监控 |
| [docs/05-other-databases/](docs/05-other-databases/) | Oracle、MongoDB、Elasticsearch、TiDB/OceanBase 等 |
| [docs/06-methodology/](docs/06-methodology/) | 方法论：性能分析、容量规划、故障定界、复盘、教学设计 |
| [docs/07-process/](docs/07-process/) | 流程与制度：变更管理、值班 SOP、应急预案、安全合规 |

## 怎么用

- **本地浏览** → 使用 Node.js 24，首次运行 `npm ci`，再运行 `npm run dev`，打开本地服务下的 `/dba-playbook/`。要验证全文搜索，先运行 `npm run check`，再运行 `npm run preview`。
- **查知识或做实验** → 从首页搜索，或进入 MySQL、Redis 专区。实验室可逐步观察 SQL 的执行过程。
- **排障救火** → 从「实战」查同类案例、操作手册和脚本。
- **新增知识** → 用 `python scripts/site/new-doc.py` 创建独立 HTML，补充正文与元信息，更新所在目录 README。构建会自动将页面纳入导航和搜索。
- **找脚本** → `scripts/` 各目录 README 索引
- **离线阅读** → 在浏览器或 Obsidian 中打开内容 HTML。在浏览器中可直接打开 [SELECT 实验](labs/app/index.html)。

构建与写作命令见 [站点工具](scripts/site/README.md)。

## 内容约定

- 目录与文件名用英文小写 + 短横线，正文用中文
- 案例文件带日期前缀：`YYYY-MM-DD-<slug>.html`
- 文档带元信息块（`database` / `status` 必填）；Mermaid 图定稿后预渲染为内嵌 SVG
- **严格脱敏**：密码、内网 IP、公司名、真实数据一律替换
- 命令与参数标注适用的数据库版本
- 详见 [CONTRIBUTING.md](CONTRIBUTING.md)

## 基本信息

- 建库日期：2026-11-03
- 主力方向：MySQL、Redis
- 更新方式：随手记录 + 定期整理，案例复盘后把通用规律反哺到 docs/
- 内容格式：文档以 HTML 存放（`README.md` / `AGENTS.md` / `CONTRIBUTING.md` 等规范文档保留 Markdown）
- 在线站点由 GitHub Actions 发布 `main` 的 Astro 构建产物。项目路径为 `/dba-playbook/`，部署地址可在工作流中查看。
