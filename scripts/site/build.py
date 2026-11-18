# -*- coding: utf-8 -*-
"""build — dba-playbook 静态站点生成器。

# 用途: 扫描仓库内容，生成导航 nav.js、搜索索引 search-index.js、各目录 index.html 与站点首页
# 用法: python scripts/site/build.py            # 生成到仓库
#       python scripts/site/build.py --check    # 只校验：生成物是否最新、链接/元信息（不写盘）
#       python scripts/site/build.py --stage _site   # 生成并组装发布目录（GitHub Pages 用）
# 适用: Python 3.9+（仅标准库）
# 风险: 只读内容文件；会覆写生成物（nav.js / search-index.js / index.html，均带 AUTO-GENERATED 标记）
# 依赖: 无（Python 标准库）
# 日期: 2026-11-03

规则（详见 scripts/site/README.md）：
- 内容页 = 内容目录下的 *.html（index.html 除外，它是生成物）
- README.md / AGENTS.md / CONTRIBUTING.md 保留 Markdown，不进内容页清单
- scripts/site/ 是站点工具本身，不进导航
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sitekit
from sitekit import (
    CONTENT_DIRS,
    GENERATED_COMMENT,
    INDEX_EXTRA_DIRS,
    SECTION_BLURBS,
    SECTION_LABELS,
    SITE_NAME,
    SITE_TAGLINE,
    extract_html_meta,
    extract_html_title,
    html_to_text,
    render_md,
    rewrite_href,
    root_prefix,
    sync_shell,
    wrap_page,
)

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

SKIP_DIRS = {".git", ".obsidian", ".vscode", ".idea", "_site", "__pycache__",
             "tmp", "temp", ".cache", "node_modules"}
SKIP_FILES = {"page-template.html"}
SKIP_SUFFIXES = (".pyc", ".log", ".swp", ".swo")

REQUIRED_META = ["database", "status"]
RECOMMENDED_META = ["category", "tags", "date"]


# ── 扫描 ──────────────────────────────────────────────────

class Page:
    __slots__ = ("rel", "title", "meta", "text")

    def __init__(self, rel, title, meta, text):
        self.rel = rel          # 相对仓库根，/ 分隔
        self.title = title
        self.meta = meta
        self.text = text        # 纯文本（搜索用）


class DirNode:
    def __init__(self, rel):
        self.rel = rel
        self.title = ""
        self.children = []      # [DirNode]
        self.pages = []         # [Page]


def rel_of(*parts) -> str:
    return "/".join(parts)


def is_nav_excluded(rel: str) -> bool:
    return rel in sitekit.NAV_EXCLUDES or any(
        rel.startswith(p + "/") for p in sitekit.NAV_EXCLUDES)


def readme_title(rel_dir: str) -> str:
    path = os.path.join(ROOT, rel_dir, "README.md") if rel_dir else os.path.join(ROOT, "README.md")
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                m = re.match(r"^#\s+(.*)$", line)
                if m:
                    return m.group(1).strip()
    return ""


def scan_dir(rel: str) -> DirNode:
    """递归扫描一个内容目录（rel 用 / 分隔，"" = 仓库根）。"""
    node = DirNode(rel)
    abs_dir = os.path.join(ROOT, rel) if rel else ROOT
    node.title = readme_title(rel) or (SECTION_LABELS.get(rel) or os.path.basename(rel) or SITE_NAME)

    entries = sorted(os.listdir(abs_dir))
    for name in entries:
        abs_path = os.path.join(abs_dir, name)
        child_rel = rel_of(rel, name) if rel else name
        if os.path.isdir(abs_path):
            if name in SKIP_DIRS or name.startswith(".") or is_nav_excluded(child_rel):
                continue
            child = scan_dir(child_rel)
            if child.children or child.pages or os.path.isfile(os.path.join(abs_path, "README.md")):
                node.children.append(child)
        elif name.endswith(".html") and name not in ("index.html",) and name not in SKIP_FILES:
            with open(abs_path, encoding="utf-8") as f:
                html_text = f.read()
            meta = extract_html_meta(html_text)
            title = extract_html_title(html_text, fallback=name)
            node.pages.append(Page(child_rel, title, meta, html_to_text(html_text)))
    return node


def scan_all():
    """返回 (nav 树, 全部内容页列表)。"""
    nav, pages = [], []
    for d in CONTENT_DIRS:
        if not os.path.isdir(os.path.join(ROOT, d)):
            continue
        node = scan_dir(d)
        if not node.title or node.title == d:
            node.title = SECTION_LABELS.get(d, node.title)
        nav.append(node)

    def collect(n):
        pages.extend(n.pages)
        for c in n.children:
            collect(c)

    for n in nav:
        collect(n)
    return nav, pages


# ── 生成物 ────────────────────────────────────────────────

def nav_json(nav) -> str:
    def ser(n: DirNode):
        return {
            "title": n.title,
            "path": (n.rel + "/index.html") if n.rel else "index.html",
            "pages": [{"title": p.title, "path": p.rel,
                       "status": p.meta.get("status", "")} for p in n.pages],
            "children": [ser(c) for c in n.children],
        }
    return "window.__SITE_NAV__ = " + json.dumps(
        [ser(n) for n in nav], ensure_ascii=False, indent=1) + ";\n"


def search_json(pages) -> str:
    data = [
        {
            "t": p.title,
            "u": p.rel,
            "k": " ".join(str(p.meta.get(k, "")) for k in
                          ("database", "category", "tags", "status")),
            "b": p.text[:6000],
        }
        for p in sorted(pages, key=lambda p: p.rel)
    ]
    return "window.__SEARCH_INDEX__ = " + json.dumps(
        data, ensure_ascii=False, separators=(",", ":")) + ";\n"


def breadcrumb_html(rel_dir: str) -> str:
    root = root_prefix(rel_dir + "/x")
    segs = rel_dir.split("/")
    parts = ['    <nav class="crumb"><a href="%sindex.html">首页</a>' % root]
    for i, seg in enumerate(segs):
        if i == len(segs) - 1:
            parts.append(' › <span>%s</span>' % seg)
        else:
            up = "../" * (len(segs) - 1 - i)
            parts.append(' › <a href="%sindex.html">%s</a>' % (up, seg))
    parts.append("</nav>")
    return "".join(parts)


def auto_listing(node: DirNode, rendered_readme: str) -> str:
    """README 未覆盖到的条目，补一个自动列表。"""
    items = []
    for child in node.children:
        target = child.rel[len(node.rel) + 1:] + "/index.html" if node.rel else child.rel + "/index.html"
        if 'href="%s"' % target not in rendered_readme:
            items.append('<li><a href="%s">%s/</a></li>' % (target, child.rel.split("/")[-1]))
    for p in node.pages:
        target = p.rel[len(node.rel) + 1:] if node.rel else p.rel
        if 'href="%s"' % target not in rendered_readme:
            items.append('<li><a href="%s">%s</a></li>' % (target, p.title))
    if not items:
        return ""
    return '\n<h2>本页目录</h2>\n<ul class="auto-list">\n%s\n</ul>' % "\n".join(items)


def dir_index_html(node: DirNode) -> str:
    root = root_prefix(node.rel + "/x")
    readme_path = os.path.join(ROOT, node.rel, "README.md")
    body_parts = ["    <h1>%s</h1>" % node.title]
    if os.path.isfile(readme_path):
        with open(readme_path, encoding="utf-8") as f:
            md = f.read()
        rendered = render_md(md, skip_h1=True)
        body_parts.append(rendered)
        body_parts.append(auto_listing(node, rendered))
    else:
        body_parts.append(auto_listing(node, ""))
    return wrap_page(node.title, root, "\n".join(body_parts),
                     breadcrumb_html=breadcrumb_html(node.rel))


def home_html(nav, pages) -> str:
    cards = []
    for node in nav:
        blurb = SECTION_BLURBS.get(node.rel, "")
        cards.append(
            '<a class="card" href="%s/index.html"><h3>%s</h3><p>%s</p></a>'
            % (node.rel, SECTION_LABELS.get(node.rel, node.title), blurb))
    dated = [p for p in pages if re.match(r"^\d{4}-\d{2}-\d{2}$", str(p.meta.get("date", "")))]
    dated.sort(key=lambda p: (p.meta.get("date", ""), p.rel), reverse=True)
    recent = []
    for p in dated[:8]:
        chips = "".join('<span class="chip">%s</span>' % p.meta[k]
                        for k in ("database", "category") if p.meta.get(k))
        recent.append('<li><span class="date">%s</span> <a href="%s">%s</a>%s</li>'
                      % (p.meta.get("date", ""), p.rel, p.title, chips))
    recent_html = (
        '\n<h2>最近更新</h2>\n<ul class="recent">\n%s\n</ul>' % "\n".join(recent)
    ) if recent else ""
    body = """  <section class="hero">
    <h1>%s</h1>
    <p class="tagline">%s</p>
    <p class="hero-links">
      <a class="btn" href="docs/index.html">从体系化知识开始</a>
      <a class="btn ghost" href="cases/index.html">看真实案例</a>
    </p>
  </section>
  <h2>板块</h2>
  <div class="cards">
%s
  </div>%s""" % (SITE_NAME, SITE_TAGLINE + "：体系化知识、真实案例、操作手册、可复用脚本的长期沉淀。",
                 "\n".join(cards), recent_html)
    return wrap_page(SITE_NAME, "", body)


def build_outputs():
    """返回 {相对路径: 文件内容}，全量生成物。"""
    nav, pages = scan_all()
    outputs = {
        "assets/site/nav.js": GENERATED_COMMENT.replace("<!--", "/*").replace("-->", "*/") + "\n" + nav_json(nav),
        "assets/site/search-index.js": GENERATED_COMMENT.replace("<!--", "/*").replace("-->", "*/") + "\n" + search_json(pages),
        "index.html": GENERATED_COMMENT + "\n" + home_html(nav, pages),
    }

    def walk(n: DirNode):
        outputs[n.rel + "/index.html"] = GENERATED_COMMENT + "\n" + dir_index_html(n)
        for c in n.children:
            walk(c)

    for n in nav:
        walk(n)

    # assets/ 等只补目录索引的目录
    for extra in INDEX_EXTRA_DIRS:
        abs_dir = os.path.join(ROOT, extra)
        if not os.path.isdir(abs_dir):
            continue
        node = scan_dir(extra)
        if node.pages or os.path.isfile(os.path.join(abs_dir, "README.md")):
            outputs[extra + "/index.html"] = GENERATED_COMMENT + "\n" + dir_index_html(node)

    return outputs, nav, pages


# ── 校验 ──────────────────────────────────────────────────

_HREF = re.compile(r'(?:href|src)="([^"]+)"')


def check(outputs, pages) -> int:
    errors, warnings = [], []

    # 1. 生成物是否最新
    for rel, content in sorted(outputs.items()):
        path = os.path.join(ROOT, rel)
        if not os.path.isfile(path):
            errors.append("生成物缺失: %s" % rel)
            continue
        with open(path, encoding="utf-8") as f:
            if f.read() != content:
                errors.append("生成物过期: %s（请运行 python scripts/site/build.py 后提交）" % rel)

    # 2. 内容页元信息
    for p in pages:
        for key in REQUIRED_META:
            if key not in p.meta:
                errors.append("元信息缺失: %s 缺 <meta name=\"%s\">" % (p.rel, key))
        for key in RECOMMENDED_META:
            if key not in p.meta:
                warnings.append("元信息建议补全: %s 缺 %s" % (p.rel, key))

    # 2b. 手写页的外壳/页头/高亮是否与 sitekit 同步（sync-shell.py）
    for p in pages:
        path = os.path.join(ROOT, p.rel.replace("/", os.sep))
        with open(path, encoding="utf-8") as f:
            text = f.read()
        synced, missing = sync_shell(text)
        if missing:
            errors.append("页面缺外壳标记块 %s: %s" % ("/".join(missing), p.rel))
        elif synced != text:
            errors.append("页面外壳/页头过期: %s（请运行 python scripts/site/sync-shell.py 后提交）" % p.rel)

    # 3. 相对链接可解析 + 禁止根路径引用
    for rel, content in sorted(outputs.items()):
        page_dir = os.path.dirname(rel)
        for m in _HREF.finditer(content):
            href = m.group(1)
            if re.match(r"^(https?:|mailto:|data:|#|javascript:)", href):
                continue
            if href.startswith("/"):
                errors.append("根路径引用（Pages 子路径下会断）: %s 内 %s" % (rel, href))
                continue
            target = href.partition("#")[0]
            if not target:
                continue
            resolved = os.path.normpath(os.path.join(ROOT, page_dir, target.replace("/", os.sep)))
            if not os.path.exists(resolved):
                errors.append("链接失效: %s 内 %s" % (rel, href))

    # 4. README 索引登记（红线要求）
    for p in pages:
        readme = os.path.join(ROOT, os.path.dirname(p.rel), "README.md")
        if os.path.isfile(readme):
            with open(readme, encoding="utf-8") as f:
                if os.path.basename(p.rel) not in f.read():
                    warnings.append("README 索引未登记: %s" % p.rel)

    # 5. Mermaid 图未预渲染（静态查看器会显示成源码）
    for p in pages:
        path = os.path.join(ROOT, p.rel.replace("/", os.sep))
        with open(path, encoding="utf-8") as f:
            if '<pre class="mermaid">' in f.read():
                warnings.append("Mermaid 图未预渲染（python scripts/site/render-diagrams.py）: %s" % p.rel)

    for w in warnings:
        print("[warn] %s" % w)
    for e in errors:
        print("[error] %s" % e)
    print("--check: %d error(s), %d warning(s)" % (len(errors), len(warnings)))
    return 1 if errors else 0


# ── 发布目录 ──────────────────────────────────────────────

def stage(stage_dir: str) -> None:
    target = os.path.abspath(os.path.join(ROOT, stage_dir)) if not os.path.isabs(stage_dir) else stage_dir
    if os.path.commonpath([ROOT, target]) != ROOT:
        print("stage 目录必须在仓库内: %s" % stage_dir)
        sys.exit(2)
    if os.path.isdir(target):
        shutil.rmtree(target)

    def copy_tree(rel=""):
        abs_src = os.path.join(ROOT, rel) if rel else ROOT
        abs_dst = os.path.join(target, rel) if rel else target
        os.makedirs(abs_dst, exist_ok=True)
        for name in sorted(os.listdir(abs_src)):
            if not rel and name in {"dist", "src"}:
                continue
            src = os.path.join(abs_src, name)
            r = rel_of(rel, name) if rel else name
            if os.path.isdir(src):
                if name in SKIP_DIRS or name.startswith("."):
                    continue
                if r == "scripts/site":
                    # 站点工具目录只发布 README 与生成的目录页
                    os.makedirs(os.path.join(target, r), exist_ok=True)
                    for keep in ("README.md", "index.html"):
                        src_keep = os.path.join(src, keep)
                        if os.path.isfile(src_keep):
                            shutil.copy2(src_keep, os.path.join(target, r, keep))
                    continue
                copy_tree(r)
            else:
                if name.endswith(SKIP_SUFFIXES) or name in SKIP_FILES or name in SKIP_DIRS:
                    continue
                shutil.copy2(src, os.path.join(abs_dst, name))

    copy_tree()
    print("staged -> %s" % os.path.relpath(target, ROOT))


# ── main ──────────────────────────────────────────────────

def write_outputs(outputs) -> None:
    for rel, content in sorted(outputs.items()):
        path = os.path.join(ROOT, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)


def main() -> int:
    ap = argparse.ArgumentParser(description="dba-playbook 站点生成器")
    ap.add_argument("--check", action="store_true", help="只校验，不写盘")
    ap.add_argument("--stage", metavar="DIR", help="组装发布目录（先原地生成）")
    args = ap.parse_args()

    outputs, nav, pages = build_outputs()

    if args.check:
        return check(outputs, pages)

    write_outputs(outputs)
    n_dirs = 0
    stack = list(nav)
    while stack:
        node = stack.pop()
        n_dirs += 1
        stack.extend(node.children)
    print("生成完成: %d 个内容页, 导航 %d 个目录, 生成物 %d 个文件"
          % (len(pages), n_dirs, len(outputs)))

    if args.stage:
        stage(args.stage)
    return 0


if __name__ == "__main__":
    sys.exit(main())
