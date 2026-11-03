# -*- coding: utf-8 -*-
"""md2html — Markdown 文档 → 站点 HTML 页面（一次性迁移/导入用）。

# 用途: 把带 front matter 的 Markdown 文档迁移成符合站点模板的内容页
# 用法: python scripts/site/md2html.py docs/02-mysql/overview.md [...]
#       python scripts/site/md2html.py --keep-md xxx.md   # 保留原 md（默认删除）
# 适用: Python 3.9+（仅标准库）
# 风险: 写出同名 .html；默认删除源 .md（迁移前确认 git 状态干净）
# 依赖: 无（Python 标准库）
# 日期: 2026-11-03

转换规则：front matter → <meta> 元信息块；Mermaid/代码块/表格/列表按站点规范渲染；
Markdown 链接改写规则见 scripts/site/README.md（README.md→index.html、内容 md→html、
AGENTS.md/CONTRIBUTING.md/templates 的 md 保持不变）。
"""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sitekit import parse_front_matter, render_md, root_prefix, wrap_page

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))


def convert(md_path: str, keep_md: bool) -> str:
    rel = os.path.relpath(md_path, ROOT).replace(os.sep, "/")
    with open(md_path, encoding="utf-8") as f:
        text = f.read()
    meta, body = parse_front_matter(text)
    title = ""
    for line in body.split("\n"):
        if line.startswith("# "):
            title = line[2:].strip()
            break
    if not title:
        title = os.path.splitext(os.path.basename(md_path))[0]

    body_html = "      " + render_md(body).replace("\n", "\n      ")
    html = wrap_page(title, root_prefix(rel), body_html, meta=meta)
    out_path = os.path.splitext(md_path)[0] + ".html"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    if not keep_md:
        os.remove(md_path)
    return rel


def main() -> int:
    ap = argparse.ArgumentParser(description="Markdown → 站点 HTML 迁移")
    ap.add_argument("files", nargs="+", help="要转换的 .md 文件")
    ap.add_argument("--keep-md", action="store_true", help="保留源 .md 文件")
    args = ap.parse_args()

    for f in args.files:
        path = os.path.abspath(f)
        if not os.path.isfile(path):
            print("[error] 文件不存在: %s" % f)
            return 1
        rel = convert(path, args.keep_md)
        print("converted: %s -> %s" % (rel, os.path.splitext(rel)[0] + ".html"))
    print("完成。记得运行 python scripts/site/build.py 刷新生成物。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
