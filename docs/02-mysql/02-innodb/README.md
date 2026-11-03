# 02 · InnoDB 架构

存储引擎的内核：内存结构、磁盘结构、后台线程，以及它们如何协作完成读写。

## 本章范围

- Buffer Pool：LRU 改进算法（young / old）、Free / Flush / LRU 链表、预读、脏页与刷脏、多实例
- Change Buffer、Adaptive Hash Index、Log Buffer
- 磁盘结构：表空间（系统 / 独立 / 通用 / undo / 临时）、数据组织（段 → 区 → 页 → 行）、行格式、溢出页
- Doublewrite Buffer 与部分写保护
- 后台线程：Master、IO、Purge、Page Cleaner

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| _待补充_ | | |

## 待补

- Buffer Pool 命中率与刷脏调优（`innodb_buffer_pool_size`、`innodb_io_capacity`、`innodb_max_dirty_pages_pct`）
- 表空间管理与空间回收（碎片整理、`innodb_file_per_table`）
- Doublewrite 在 8.0.20 前后实现方式的差异

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。
