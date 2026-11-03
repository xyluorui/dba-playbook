# 08 · 查询优化

从发现慢 SQL 到定位并优化，方法论与实战。

## 本章范围

- 慢查询的发现：慢日志、`long_query_time`、pt-query-digest
- 诊断工具：`EXPLAIN`、`optimizer_trace`、`performance_schema`、`sys` schema
- SQL 改写：深分页、子查询、`ORDER BY` / `GROUP BY` / `DISTINCT`、`COUNT(*)`
- Join 算法与排序算法
- 临时表、分区表、分库分表的取舍
- 参数调优的边界

## 索引

| 文档 | 说明 | 更新时间 |
|------|------|----------|
| _待补充_ | | |

## 待补

- 慢 SQL 治理的标准流程（从排序到归因到验证）
- 深分页的几种改法与代价
- 排序相关参数（`sort_buffer_size`、`max_length_for_sort_data`）的实际影响

> 写作规范见仓库根目录 `AGENTS.md` 与 `CONTRIBUTING.md`。
