# 05 · 锁

从全局锁到行锁，以及死锁与 DDL 的锁行为。

## 本章范围

- 锁粒度：全局锁、表锁（表级 S/X、意向锁、AUTO-INC 锁）、元数据锁（MDL）、行锁
- InnoDB 行锁：Record Lock、Gap Lock、Next-Key Lock、Insert Intention Lock
- 加锁规则：隔离级别、索引类型（唯一 / 非唯一 / 无索引）、等值 / 范围查询
- 死锁：产生条件、检测（wait-for graph）、`SHOW ENGINE INNODB STATUS`、案例分析
- 乐观锁与悲观锁、Online DDL 的锁行为

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| _待补充_ | | |

## 待补

- 加锁规则逐条验证（含无索引时的全表扫描加锁）
- 死锁日志解读与线上处置
- Online DDL 各算法的锁级别对照表

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。
