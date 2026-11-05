# AGENTS.md — labs/（交互实验室）

适用范围：`labs/` 下所有内容。全局规则见仓库根 [AGENTS.md](../AGENTS.md)，方法论见 [docs/06-methodology/interactive-learning-design.html](../docs/06-methodology/interactive-learning-design.html)，场景数据格式见 [README.md](README.md)。本目录只做细化，不放宽红线。

## 开发顺序（必须）

1. **先填设计卡**（[templates/experiment-card-template.md](../templates/experiment-card-template.md)），再写场景数据（`app/scenes/<场景 id>.js`），最后调渲染与页面；
2. 场景数据与渲染逻辑严格分离：场景里不写渲染代码（`app/js/`），渲染模块里不写教学内容；
3. 每个实验对应一个场景文件 + 一张设计卡，命名一致（`<场景 id>.js` / `design-card.md`）。

## 内容红线（labs 专项加严）

- **边界标注必填**：`version` / `engine` / `assumptions` 一个都不能少，规范见 README"边界标注规范"；
- **数值不编造**：场景里的行数、耗时、字节数要么是"示例值"并已在 `assumptions` 声明，要么来自真实验证并注明环境；`inspector.struct` 里的示意输出统一带"示例"角标（应用自动加）；
- **证据要可核对**：`evidence` 与 `inspector.fields` 里写的结论（如 `EXPLAIN` 的 Extra），设计卡"验证方式"里必须有对应的核对手段；
- **教学回退 ≠ ROLLBACK**：应用里的"上一步/重置"是回看实验状态，文案和图标不得与数据库操作混淆；场景里出现 `ROLLBACK` 时必须写明它是实验内容里的 SQL；
- **每轮只改一个变量**：可修改变量（P1 起支持）一次只开放一个，保证因果可读。

## 应用约定

- `app/` 是独立全屏应用（无站点外壳标记块，不参与 `sync-shell.py`）；`app/index.html` 会被 `build.py` 跳过（index.html 均视为生成物），别在里面放依赖构建校验的内容页要素；
- `app/js/` 只用原生 JS，无构建步骤、无网络请求，file:// 直接可跑；改渲染模块需保持旧场景兼容，或同步更新全部场景；
- 交互要素保持齐全：单步 / 上一步 / 重置 / 播放（可调速）、网络⇄时序双视图、事件流行点开检查器、明暗主题、键盘快捷键（←/→/空格/Esc）；
- 知识入口页（`labs/*.html`）按站点内容页规范创建（`python scripts/site/new-doc.py --type doc --dir labs ...`），外壳标记块不手改；必须带 `<noscript>` 静态说明与静态步骤一览。

## 验收（每个实验上线前）

- [ ] 设计卡十字段填完，"验证方式"已实际跑过；
- [ ] 边界标注三类声明齐全；
- [ ] 迁移挑战可用（换场景能预测/解释）；
- [ ] `python scripts/site/build.py --check` 通过，所在目录 README 索引已登记；
- [ ] 浏览器双击 `app/index.html` 点一遍：单步、上一步、重置、播放、检查器、网络/时序切换、明暗主题。
