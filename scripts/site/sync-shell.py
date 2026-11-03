# -*- coding: utf-8 -*-
"""sync-shell — 把页面外壳同步到所有手写 HTML 页面与模板。

# 用途: 手写页/模板内嵌的兜底样式、头部/侧栏/页脚/脚本外壳统一取自 sitekit，升级后一键同步
# 用法: python scripts/site/sync-shell.py            # 同步（写盘）
#       python scripts/site/sync-shell.py --check    # 只检查是否有页面过期（不写盘，过期则退出码 1）
# 适用: Python 3.9+（仅标准库）
# 风险: 只改写页面中 fallback-style / shell:top / shell:bottom 三个标记块；缺标记块的页面只告警、不改动
# 依赖: 无（Python 标准库）
# 日期: 2026-11-03

范围：内容目录下的手写 *.html（index.html 是 build.py 生成物，不在此列）与 scripts/site/page-template.html。
每个页面的 <body data-root="..."> 决定外壳里资源路径的前缀（模板里可以是 {{ROOT}} 占位符）。
"""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sitekit import CONTENT_DIRS, sync_shell

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))


def target_pages():
    pages = []
    for top in CONTENT_DIRS:
        base = os.path.join(ROOT, top)
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = sorted(d for d in dirnames if not d.startswith(".") and d != "__pycache__")
            rel_dir = os.path.relpath(dirpath, ROOT).replace(os.sep, "/")
            if rel_dir.startswith("scripts/site"):
                continue  # 站点工具目录只处理 page-template.html
            for name in sorted(filenames):
                if name.endswith(".html") and name != "index.html":
                    pages.append(rel_dir + "/" + name)
    pages.append("scripts/site/page-template.html")
    return pages


def main() -> int:
    ap = argparse.ArgumentParser(description="同步手写页面的外壳")
    ap.add_argument("--check", action="store_true", help="只检查，不写盘")
    args = ap.parse_args()

    stale = warned = 0
    for rel in target_pages():
        path = os.path.join(ROOT, rel.replace("/", os.sep))
        if not os.path.isfile(path):
            continue
        with open(path, encoding="utf-8") as f:
            text = f.read()
        new, missing = sync_shell(text)
        if missing:
            print("[warn] 缺少标记块 %s，跳过: %s" % ("/".join(missing), rel))
            warned += 1
            continue
        if new == text:
            continue
        stale += 1
        if args.check:
            print("[stale] %s" % rel)
        else:
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                f.write(new)
            print("synced: %s" % rel)

    if args.check:
        print("--check: %d 个页面外壳过期, %d 个页面缺标记块" % (stale, warned))
        return 1 if (stale or warned) else 0
    print("完成：%d 个页面更新外壳, %d 个页面缺标记块。" % (stale, warned))
    return 1 if warned else 0


if __name__ == "__main__":
    sys.exit(main())
