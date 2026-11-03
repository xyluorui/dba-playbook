// 用途: 构建期代码高亮（供 sitekit.py 调用）：stdin 读 JSON [{lang, code}]，stdout 输出 JSON [html|null]
// 用法: echo '[{"lang":"sql","code":"select 1"}]' | node scripts/site/highlight.js
// 适用: Node.js 16+；复用 assets/site/highlight.min.js（hljs 11.x），与浏览器端同一份语法
// 风险: 只读
// 依赖: Node.js（仅构建期；缺失时 sitekit 跳过高亮，浏览器端由 ui.js 兜底）
// 日期: 2026-11-03
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "..", "assets", "site", "highlight.min.js"), "utf8");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src + "\n;this.hljs = hljs;", ctx);
const hljs = ctx.hljs;

const items = JSON.parse(fs.readFileSync(0, "utf8"));
const out = items.map((it) => {
  if (!hljs.getLanguage(it.lang)) return null;
  return hljs.highlight(it.code, { language: it.lang, ignoreIllegals: true }).value;
});
process.stdout.write(JSON.stringify(out));
