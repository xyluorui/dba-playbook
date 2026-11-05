# AGENTS.md — docs/（体系化知识）

适用范围：`docs/` 下所有知识文章。全局规则见仓库根 [AGENTS.md](../AGENTS.md)。

## 归档位置判断

| 内容性质 | 去处 |
|----------|------|
| 讲原理 / 配置 / 方法论 | 本目录 |
| 记录一次事故 | `../cases/` |
| 写可执行的操作步骤 | `../runbooks/` |
| 跨数据库通用 | `01-foundations/` |
| 思路与方法 | `06-methodology/` |

知识文章与案例配对：文中提到的真实故障用相对链接指向 `cases/` 对应文件；案例沉淀出的通用规律写回本目录并在案例里互链。

## 推荐文档结构

用 `../scripts/site/page-template.html` 骨架起步（`python scripts/site/new-doc.py --type doc` 自动生成）：

- `<h1>`：中文标题（说清解决什么问题）+ 适用版本声明行
- `<h2>` 概述        # 适用场景、结论先行
- `<h2>` 原理        # 为什么，够用即可
- `<h2>` 实操        # 可复制的命令/配置，标注执行位置
- `<h2>` 常见问题与坑 # 真实踩过的坑
- `<h2>` 参考        # 官方文档链接

## 元信息块

`<head>` 内的 `<meta>` 标签（等价于原 front matter，页面徽章自动渲染）：

```html
<meta name="database" content="MySQL">       <!-- MySQL | Redis | General ... -->
<meta name="category" content="性能">         <!-- 架构 | 复制 | 备份恢复 | 性能 | 监控 | 安全 | 迁移 ... -->
<meta name="tags" content="索引, 慢查询">
<meta name="date" content="2026-11-03">
<meta name="status" content="draft">         <!-- draft | stable -->
```

## 写作要求

- 只写**自己的理解、踩坑、验证过的行为**；官方文档给链接，不复述全文
- 每个重要参数写清：默认值、影响面、什么时候调、调整风险
- 命令可复制；输出贴关键片段并说明来源环境
- `status: stable` 只给验证过、可长期参考的内容

## tags 受控词表

架构、复制、高可用、备份恢复、索引、慢查询、锁、事务、参数、监控、告警、安全、迁移、升级、容量、内存、持久化、集群、方法论、教学设计

新增 tag 先登记到本文件再使用。
