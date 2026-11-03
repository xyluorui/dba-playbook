# -*- coding: utf-8 -*-
"""render-diagrams — Mermaid 图预渲染为内嵌 SVG。

# 用途: 把内容页里 <pre class="mermaid"> 的图源码渲染成内嵌 SVG，静态查看器（如 Obsidian 插件）也能显示
# 用法: python scripts/site/render-diagrams.py            # 扫描全部内容页，渲染未渲染的图
#       python scripts/site/render-diagrams.py --force    # 已渲染的图也重新生成
#       python scripts/site/render-diagrams.py docs/02-mysql/00-overview/mysql-layered-architecture.html
# 适用: Python 3.9+；渲染依赖 Node.js（npx 拉取 @mermaid-js/mermaid-cli，首次较慢）
# 风险: 改写内容页中的图块；图源码保留在 <!-- mermaid --> 注释中，可重复渲染
# 依赖: Node.js（仅渲染时需要；站点浏览零依赖）
# 日期: 2026-11-03

图块约定（两种形态，工具可互相转换）：
1. 未渲染：<pre class="mermaid">…图源码…</pre>（浏览器里由 mermaid.js 即时渲染）
2. 已渲染：<!-- mermaid …源码… --> + <div class="diagram">…内嵌 SVG…</div>
   （注释里 `-->` 写作 `--&gt;` 以避免提前闭合注释）
"""

from __future__ import annotations

import argparse
import hashlib
import html as _html
import os
import re
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sitekit import CONTENT_DIRS, fix_svg_compat

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

PRE_BLOCK = re.compile(r'<pre class="mermaid">(.*?)</pre>', re.S)
RENDERED = re.compile(
    r'<!-- mermaid\n(.*?)\n-->\s*<div class="diagram">\s*(<svg.*?</svg>)\s*</div>', re.S)


def find_pages():
    pages = []
    for top in CONTENT_DIRS:
        base = os.path.join(ROOT, top)
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = sorted(d for d in dirnames if not d.startswith(".") and d != "__pycache__")
            rel_dir = os.path.relpath(dirpath, ROOT).replace(os.sep, "/")
            if rel_dir.startswith("scripts/site"):
                continue
            for name in sorted(filenames):
                if name.endswith(".html") and name != "index.html":
                    pages.append(rel_dir + "/" + name)
    return pages


def find_npx():
    for cand in ("npx.cmd", "npx", "npx.exe"):
        p = shutil.which(cand)
        if p:
            return p
    return None


def render_one(npx: str, source: str, uid: str) -> str:
    """Mermaid 源码 → SVG 字符串（uid 用于避免同页多图的元素 id 冲突）。"""
    # 系统字体渲染，避免 mermaid 默认内嵌 Recursive 字体导致每张图 ~200KB
    config = '{"theme":"default","themeVariables":' \
             '{"fontFamily":"trebuchet ms, verdana, arial, sans-serif","fontSize":"14px"}}'
    with tempfile.TemporaryDirectory() as tmp:
        mmd = os.path.join(tmp, "d.mmd")
        svg = os.path.join(tmp, "d.svg")
        cfg = os.path.join(tmp, "c.json")
        with open(mmd, "w", encoding="utf-8", newline="\n") as f:
            f.write(source.strip() + "\n")
        with open(cfg, "w", encoding="utf-8", newline="\n") as f:
            f.write(config)
        r = subprocess.run(
            [npx, "-y", "@mermaid-js/mermaid-cli", "-i", mmd, "-o", svg,
             "-b", "transparent", "-c", cfg],
            capture_output=True, text=True, shell=False)
        if r.returncode != 0 or not os.path.isfile(svg):
            raise RuntimeError("mermaid-cli 渲染失败:\n%s" % (r.stderr or r.stdout))
        with open(svg, encoding="utf-8") as f:
            out = f.read()
    out = re.sub(r"<\?xml[^>]*\?>", "", out)
    out = re.sub(r"<!DOCTYPE[^>]*>", "", out)
    return fix_svg_compat(out.strip().replace("my-svg", uid))


def uid_for(source: str) -> str:
    return "dg-" + hashlib.md5(source.strip().encode("utf-8")).hexdigest()[:8]


def pack(source: str, svg: str) -> str:
    src = source.strip().replace("-->", "--&gt;")
    return '<!-- mermaid\n%s\n-->\n<div class="diagram">\n%s\n</div>' % (src, svg)


def process_page(rel: str, npx: str, force: bool) -> int:
    path = os.path.join(ROOT, rel.replace("/", os.sep))
    with open(path, encoding="utf-8") as f:
        text = f.read()
    count = 0

    def repl_pre(m):
        nonlocal count
        source = _html.unescape(m.group(1))
        count += 1
        return pack(source, render_one(npx, source, uid_for(source)))

    text = PRE_BLOCK.sub(repl_pre, text)

    if force:
        def repl_done(m):
            nonlocal count
            source = m.group(1).replace("--&gt;", "-->")
            count += 1
            return pack(source, render_one(npx, source, uid_for(source)))

        text = RENDERED.sub(repl_done, text)

    if count:
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
    return count


def main() -> int:
    ap = argparse.ArgumentParser(description="Mermaid 图预渲染为内嵌 SVG")
    ap.add_argument("files", nargs="*", help="指定页面（缺省扫描全部内容页）")
    ap.add_argument("--force", action="store_true", help="已渲染的图也重新生成")
    args = ap.parse_args()

    npx = find_npx()
    if not npx:
        print("[error] 未找到 npx：请安装 Node.js（渲染 Mermaid 图需要；浏览站点不需要）")
        return 1

    total = 0
    for rel in (args.files or find_pages()):
        rel = rel.replace(os.sep, "/").lstrip("./")
        try:
            n = process_page(rel, npx, args.force)
        except RuntimeError as e:
            print("[error] %s: %s" % (rel, e))
            return 1
        if n:
            print("rendered: %s (%d 图)" % (rel, n))
            total += n
    print("完成：%d 张图。改图后重跑本工具即可。" % total)
    return 0


if __name__ == "__main__":
    sys.exit(main())
