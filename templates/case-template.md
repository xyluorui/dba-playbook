<!--
本文件是【字段规范】；写作模板是 [case-template.html](case-template.html)（`new-doc.py --type case` 可生成骨架）
适用于：cases/ 下的案例记录，产出为 cases/<问题域>/YYYY-MM-DD-<slug>.html
必填：元信息块（见下字段） + 现象 / 影响面 / 时间线 / 排查过程 / 根因 / 处理措施 / 复盘改进
填写完成后删除所有 HTML 注释
-->

<!-- 以下字段写入产出 HTML 的 <head> 元信息块（<meta name="..." content="...">） -->
---
database: <!-- MySQL | Redis | General ... -->
category: <!-- availability | performance | replication | backup-recovery | data-issues | upgrade-migration | security -->
tags: []
date: <!-- YYYY-MM-DD，事件发生日 -->
severity: <!-- P0 | P1 | P2 | P3，定义见 cases/AGENTS.md -->
status: <!-- draft | done -->
source: <!-- 亲历 | 口述整理 | 实验复现 -->
---

# {{一句话说清问题的标题}}

<!-- 示例格式：主从延迟导致查询超时 -->

## 现象与告警

<!-- 用户/业务视角看到了什么，收到了哪些告警 -->

## 影响面

<!-- 影响了哪些业务、多少用户、持续多久 -->

## 时间线

<!-- 用列表，格式 HH:MM 动作/现象 -->

- HH:MM <!-- 发现 -->
- HH:MM <!-- 定位 -->
- HH:MM <!-- 处理 -->
- HH:MM <!-- 恢复 -->

## 排查过程

<!-- 实际执行的命令与关键输出节选，标注执行位置（哪台主机、哪个实例） -->

```bash
$ {{命令}}
{{关键输出}}
```

## 根因

<!-- 一句话根因 + 详细分析；不确定的写（待确认） -->

## 处理措施

### 止血

<!-- 当时怎么快速恢复的 -->

### 治本

<!-- 后续怎么根治的，没有治本要写为什么 -->

## 复盘与改进

<!-- 以后怎么避免 / 怎么更早发现；改进项写清做什么、谁负责、验收标准 -->

- [ ] {{改进项 1}}
- [ ] {{改进项 2}}

## 经验沉淀

<!-- 提炼出的通用规律；同步写入 docs/ 并互链 -->

- 相关知识：<!-- 相对链接到 docs/ 文档 -->
