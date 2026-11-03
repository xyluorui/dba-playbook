# AGENTS.md — runbooks/（操作手册）

适用范围：`runbooks/` 下所有手册。全局规则见仓库根 [AGENTS.md](../AGENTS.md)。

## 定位

面向**执行**的 SOP：读者是正在干活的 DBA（或未来的自己），目标是照做不出错。原理链接到 `docs/`，不在这里展开。

## 必备结构

用 [../templates/runbook-template.html](../templates/runbook-template.html) 起步（字段规范见 [runbook-template.md](../templates/runbook-template.md)；`new-doc.py --type runbook` 自动生成骨架）：

1. 目的与适用场景
2. 风险与前置条件（版本、权限、业务窗口）
3. 前置检查清单（可执行命令 + 通过标准）
4. 操作步骤（每步：命令 → 预期输出 → 判定标准）
5. 验证（怎么确认成功）
6. 回滚方案（**必须有**；确实不可回滚要显式写"不可回滚"+ 补救措施）
7. 常见问题

## 硬性要求

- 变量用 `{{占位符}}` 标注（如 `{{MASTER_HOST}}`），并在开头列出变量说明
- 危险操作（DDL、删数据、重启、切主、扩容）单独引用块 + ⚠️ 警示，写明影响面与窗口要求
- 标注幂等性：每步重复执行的后果
- 开头声明适用版本与部署形态（如 `MySQL 8.0.x，一主两从，GTID ON`）
- 只有经生产或等价环境演练过的手册才标 `status: stable`
