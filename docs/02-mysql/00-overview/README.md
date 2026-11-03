# 00 · 总览：一条 SQL 的旅程

客户端 → 连接层 → SQL 层 → 存储引擎层 → 文件系统。本章建立全局图景，其余各章都从这里展开。

## 本章范围

- 分层架构与各层职责
- 连接层：连接管理、认证、线程模型、连接数
- Server 层与引擎层的分界（哪些能力属于哪一层）
- SELECT / UPDATE 的完整执行路径
- 版本演进总览

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| [mysql-layered-architecture.html](mysql-layered-architecture.html) | 分层架构、各层职责、Server 层与引擎层分界、SELECT / UPDATE 的执行旅程、8.0 与 5.7 差异（适用 8.0.x） | 2026-11-03 |

## 待补

- 连接层细节：线程池、`Threads_connected` / `Threads_running` 的排查视角、连接泄漏识别
- 客户端到服务端的协议层（半双工、`net_buffer`、结果集流式返回）

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。
