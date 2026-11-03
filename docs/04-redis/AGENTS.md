# AGENTS.md — docs/04-redis/（Redis 专项）

通用要求见 [../AGENTS.md](../AGENTS.md)，本文只做 Redis 专项加严。

## 版本与部署形态（必须）

- 每篇开头声明适用版本（如 `Redis 7.x`）和部署形态：单机 / 主从 / 哨兵 / Cluster / 代理（codis、twemproxy 等）
- 命令行为随版本或形态变化时分情况写（如 `KEYS` 在 Cluster 下按节点执行）

## 内容约定

- 命令示例统一 `redis-cli` 写法，说明连接的目标节点/实例
- 涉及内存的文档必须给量化的判断依据（如 `used_memory_rss - used_memory` 判碎片）
- 大 key / 热 key 相关给出实际扫描方法（`redis-cli --bigkeys`、`MEMORY USAGE`、`SCAN`），并说明线上执行的开销与注意事项
- 持久化（RDB/AOF）结论标注配置前提（`appendonly`、`save` 快照条件）

## 危险命令

`FLUSHALL` / `FLUSHDB` / `KEYS *` / `DEBUG SEGFAULT` / `CONFIG REWRITE` / `CLUSTER FORGET` 等：

- 在文档中出现必须带 ⚠️ 警示与适用场景说明
- 不给出"直接复制执行"的危险命令，替换为带占位符与确认步骤的写法

## 指标命名

与 `04-redis/monitoring/` 下文档保持一致（如 `used_memory`、`instantaneous_ops_per_sec`、`connected_slaves`）。
