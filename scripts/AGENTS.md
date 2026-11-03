# AGENTS.md — scripts/（可复用脚本）

适用范围：`scripts/` 下所有脚本。全局规则见仓库根 [AGENTS.md](../AGENTS.md)。

## 布局

| 目录 | 放什么 |
|------|--------|
| `mysql/` | MySQL SQL 与工具脚本（`.sql`、mysql 相关工具） |
| `redis/` | Redis 分析与治理脚本 |
| `shell/` | 通用 Shell 脚本（巡检、清理、校验） |
| `python/` | 通用 Python 脚本（采集、报表、自动化） |
| `site/` | 站点工具（构建、预览、发布；仅标准库，要求见 `site/README.md`） |

跨数据库工具放 `shell/` 或 `python/`。每个脚本在所在目录 `README.md` 索引登记一行。

## 脚本头注释（必须）

```bash
# 用途: 一句话说明
# 用法: ./check_repl.sh <host> <port>
# 适用: MySQL 8.0.x（GTID ON）
# 风险: 只读 | 低风险（写临时表）| ⚠️ 高风险（含 DDL/删除，需 --yes）
# 依赖: mysql client, jq
# 日期: 2026-11-03
```

SQL 脚本用 `--` 开头写同样的字段。

## 质量要求

- **默认只读、默认安全**：有副作用的脚本必须提供 `--dry-run` 或要求显式 `--yes` 才执行
- 禁止硬编码密码/密钥/真实主机名；用参数、环境变量或配置文件
- 失败要有清晰报错与非零退出码；输出兼顾人读与可解析（可选 `--json`）
- 提交前自检：`bash -n <script>` / `python -m py_compile <script>`；SQL 人工走查执行计划影响
- ⚠️ 高风险脚本（DDL、删除、切主类）必须在头部给出回滚指引或链接到对应 runbook
