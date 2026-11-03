# 贡献指南

本仓库由本人与 AI agent 共同维护。人类看这份；agent 看 [AGENTS.md](AGENTS.md)。

## 目录职责速查

| 要写的内容 | 放到 |
|-----------|------|
| 原理、配置、方法论 | `docs/` 对应主题目录 |
| 一次真实故障/问题的记录 | `cases/` 对应问题域 |
| 可照着执行的操作步骤 | `runbooks/` |
| 可复用脚本 | `scripts/` |

## 命名规则

- 目录与文件名：英文小写 + 短横线，如 `replication-ha`、`backup-restore`
- 案例文件：`YYYY-MM-DD-<slug>.md`，日期为事件发生日，如 `2026-11-03-replica-delay-query-timeout.md`
- 文件名不超过 5 个词；描述性中文标题写在文内 H1

## Front matter 规范

`docs/` 与 `cases/` 文档开头必须有：

```yaml
---
database: MySQL        # MySQL | Redis | PostgreSQL | General ...
category: performance  # 架构 | 复制 | 备份恢复 | 性能 | 监控 | 安全 | 迁移 ...
tags: [索引, 慢查询]
date: 2026-11-03
status: draft          # draft | stable（稳定、验证过的）
---
```

案例额外字段见 `templates/case-template.md`（含 `severity`、`source`）。

## 脱敏红线（提交前必查）

- [ ] 密码、密钥、token → `***`
- [ ] 内网 IP → `10.0.0.x`；公网敏感 IP 同样处理
- [ ] 主机名、域名 → 通用占位，如 `db-master-01`
- [ ] 公司/客户名 → `某互联网公司`
- [ ] 真实表结构、业务数据 → 抽象为 `orders`、`t_user` 等通用名，样例数据造假数据
- [ ] 截图已打码

## 索引维护

- 新增/删除/改名文档后，更新所在目录 `README.md` 的索引表（文档 | 说明 | 更新时间）
- 新增板块时，更新根 `README.md` 知识地图

## 提交规范

Conventional Commits：

```
docs(mysql): 补充 online DDL 各算法的锁行为
cases(redis): 记录大 key 导致集群故障
scripts(shell): 巡检脚本增加磁盘水位检查
chore: 更新索引
```

一次提交做一件事；案例建议单独成一个提交。

## 内容质量清单

- [ ] 命令可复制执行，输出只贴关键片段
- [ ] 参数/命令标注适用版本
- [ ] 结论有出处（官方文档链接或"个人实验验证"）
- [ ] 案例有根因和复盘，不停留在现象描述
- [ ] Runbook 有验证步骤和回滚方案
