# Redis

Redis 体系化知识。从一条写命令出发，理解 key 的生命周期、命令执行、数据恢复与故障转移，再按七个章节查阅专题。

> 核心概念与机制总览见 [overview.html](overview.html)。

## 基础原理与核心机制

| 章 | 目录 | 主题 | 状态 |
|------|------|------|------|
| 00 | [architecture/](architecture/) | 架构与原理 | 待撰写 |
| 01 | [deployment/](deployment/) | 安装部署与配置基线 | 待撰写 |
| 02 | [persistence/](persistence/) | 持久化 | 待撰写 |
| 03 | [cluster-ha/](cluster-ha/) | 集群与高可用 | 待撰写 |
| 04 | [performance/](performance/) | 性能优化 | 待撰写 |
| 05 | [memory-analysis/](memory-analysis/) | 内存与大 key 分析 | 待撰写 |
| 06 | [monitoring/](monitoring/) | 监控与告警 | 待撰写 |

## 企业级解决方案

从生产需求出发，梳理高可用、分片和托管服务等方案及选型权衡，见 [企业级解决方案](solutions/)。操作步骤和真实事件分别放在 `runbooks/` 和 `cases/`。

## 文档总索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| [Redis 核心概念与机制体系](overview.html) | Redis 7.2.x 总览：数据类型、命令执行、过期与淘汰、RDB/AOF、复制、Sentinel、Cluster 和排查入口 | 2026-11-06 |
| [Redis 企业级方案概览](solutions/overview.html) | 企业级方案入口与选型维度 | 2026-11-18 |

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。
