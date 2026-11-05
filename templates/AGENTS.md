# AGENTS.md — templates/（模板维护）

适用范围：`templates/` 下所有模板。全局规则见仓库根 [AGENTS.md](../AGENTS.md)。

## 现有模板

| 文件 | 用途 |
|------|------|
| `case-template.html` / `case-template.md` | 案例记录（`cases/`）：HTML 为写作模板，md 为字段规范 |
| `postmortem-template.html` / `postmortem-template.md` | 故障复盘（正式复盘会/报告，比案例更完整） |
| `runbook-template.html` / `runbook-template.md` | 操作手册（`runbooks/`） |
| `experiment-card-template.md` | 交互实验设计卡（`labs/`）：字段规范，无 HTML 对应模板（设计卡是规划文档，Markdown 填写） |

## 维护规则

- 模板是所有文档的起点：字段增删必须同步更新对应目录 `AGENTS.md` 中的字段说明
- **HTML 模板与同名 md 模板字段必须保持一致**（HTML 用于写作，md 是字段规范）；改动任何一侧都要同步另一侧
- HTML 模板的资源路径写 `../`（`scripts/site/new-doc.py` 复制时会按目标目录深度自动改写）
- 变量用 `{{占位符}}`（机器替换字段：`{{TITLE}}`、`{{DATE}}`、`{{DATABASE}}` 等）；填写指引用 HTML 注释 `<!-- ... -->`，产出正式文档时删除
- **不要放假数据示例**（避免被误当真实内容引用）；只放字段说明与填写要求
- 每个模板顶部写清"适用于哪个目录"和"必填项"
