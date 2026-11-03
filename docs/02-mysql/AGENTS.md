# AGENTS.md — docs/02-mysql/（MySQL 专项）

通用要求见 [../AGENTS.md](../AGENTS.md)，本文只做 MySQL 专项加严。

## 版本标注（必须）

- 每篇文档开头声明适用版本，如 `适用：MySQL 8.0.x`；行为有差异时分版本写（如 `5.7` vs `8.0`）
- 常见差异点必须显式说明：DDL 算法（instant）、`utf8mb4` 默认字符集、复制协议、`caching_sha2_password`、查询缓存移除等
- 参数写默认值时注明"自哪个版本起默认为 X"

## 内容约定

- 默认存储引擎是 InnoDB；涉及 MyISAM/Memory/其他引擎要显式说明场景与代价
- 复制相关必须注明 `binlog_format` 与 GTID 模式（ON/OFF）
- SQL 示例用 `mysql>` 提示符；OS 命令用 `$` 并说明执行主机角色（master/slave/任意）
- 参数调整给出验证语句（`SHOW VARIABLES LIKE ...` / `SHOW GLOBAL STATUS LIKE ...`）
- 涉及生产的变更（DDL、重启、切主）在文中链接到 `runbooks/mysql/` 对应手册，不在 docs 里写"点击执行"式步骤

## 指标命名

监控指标名称与 `02-mysql/monitoring/` 下文档保持一致（如 `Threads_running`、`Seconds_Behind_Master`），避免一词多写。

## 禁止

- 贴未脱敏的线上 `SHOW PROCESSLIST`、表结构、报错日志（含真实库表名/主机名的先脱敏）
- 给出无版本限定的绝对化结论（如 "MySQL 都是 xxx"）
