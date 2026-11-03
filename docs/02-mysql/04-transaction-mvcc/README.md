# 04 · 事务与 MVCC

ACID 的实现手段、隔离级别、多版本并发控制。

## 本章范围

- ACID 与实现机制（undo / redo / 锁 / 约束）
- 隔离级别与并发问题：脏读、不可重复读、幻读、快照读与当前读
- MVCC：隐藏列、undo 版本链、Read View、RC 与 RR 的差异
- purge 与长事务的危害
- 事务控制：autocommit、保存点、XA

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| _待补充_ | | |

## 待补

- Read View 在 RC / RR 下的可见性判定逐步推演
- 长事务的识别与治理（`information_schema.innodb_trx`）

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。
