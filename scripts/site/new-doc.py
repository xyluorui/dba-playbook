# -*- coding: utf-8 -*-
"""new-doc — 从模板创建新的内容页（HTML）。

# 用途: 按文档类型复制模板、替换 {{ROOT}}/{{TITLE}} 等占位符，生成新内容页骨架
# 用法: python scripts/site/new-doc.py --type case --dir cases/02-performance \
#           --slug replica-delay --title "主从延迟导致查询超时" --database MySQL
#       python scripts/site/new-doc.py --type doc --dir docs/02-mysql/02-innodb \
#           --slug buffer-pool --title "Buffer Pool 与 LRU"
# 适用: Python 3.9+（仅标准库）
# 风险: 只新建文件，不覆盖已存在文件
# 依赖: 无（Python 标准库）
# 日期: 2026-11-03

类型与模板对应：case→templates/case-template.html，postmortem→templates/postmortem-template.html，
runbook→templates/runbook-template.html，doc→scripts/site/page-template.html。
案例文件自动加日期前缀：YYYY-MM-DD-<slug>.html。
"""

from __future__ import annotations

import argparse
import datetime
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sitekit import root_prefix, sync_shell

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

TEMPLATES = {
    "case": "templates/case-template.html",
    "postmortem": "templates/postmortem-template.html",
    "runbook": "templates/runbook-template.html",
    "doc": "scripts/site/page-template.html",
}


def main() -> int:
    ap = argparse.ArgumentParser(description="从模板创建内容页")
    ap.add_argument("--type", required=True, choices=sorted(TEMPLATES),
                    help="文档类型")
    ap.add_argument("--dir", required=True, help="目标目录（相对仓库根）")
    ap.add_argument("--slug", required=True, help="文件名 slug（英文小写+短横线）")
    ap.add_argument("--title", default="", help="中文标题")
    ap.add_argument("--database", default="", help="元信息 database")
    ap.add_argument("--category", default="", help="元信息 category")
    ap.add_argument("--tags", default="", help="元信息 tags（逗号分隔）")
    ap.add_argument("--date", default="", help="日期 YYYY-MM-DD（默认今天）")
    args = ap.parse_args()

    today = args.date or datetime.date.today().isoformat()
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", today):
        print("[error] --date 需要 YYYY-MM-DD")
        return 1
    if not re.match(r"^[a-z0-9][a-z0-9-]*$", args.slug):
        print("[error] --slug 只允许英文小写/数字/短横线")
        return 1

    name = ("%s-%s.html" % (today, args.slug)) if args.type == "case" else args.slug + ".html"
    target_dir = os.path.join(ROOT, args.dir.replace("/", os.sep))
    target = os.path.join(target_dir, name)
    if os.path.exists(target):
        print("[error] 文件已存在: %s" % os.path.relpath(target, ROOT))
        return 1

    tpl_path = os.path.join(ROOT, TEMPLATES[args.type].replace("/", os.sep))
    with open(tpl_path, encoding="utf-8") as f:
        tpl = f.read()

    rel = (args.dir.strip("/") + "/" + name).replace("//", "/")
    root = root_prefix(rel)
    title = args.title or "（中文标题）"
    subs = {
        "{{ROOT}}": root,
        "{{TITLE}}": title,
        "{{DATE}}": today,
        "{{DATABASE}}": args.database or "（填写）",
        "{{CATEGORY}}": args.category or "（填写）",
        "{{TAGS}}": args.tags or "（填写）",
        "{{STATUS}}": "draft",
    }
    for k, v in subs.items():
        tpl = tpl.replace(k, v)
    # 模板自带真实标题（如"案例记录模板"），复制后换成新标题
    tpl = re.sub(r"<title>.*?</title>",
                 "<title>%s | DBA Playbook</title>" % title, tpl, count=1, flags=re.S)
    tpl = re.sub(r"<h1>.*?</h1>", "<h1>%s</h1>" % title, tpl, count=1, flags=re.S)
    # 模板资源路径按目标深度重写（../ → 到站点根的正确前缀）
    tpl = re.sub(r'(href|src)="(\.\./)+',
                 lambda m: m.group(1) + '="' + root, tpl)

    tpl, _ = sync_shell(tpl)  # 生成页头徽章/目录、高亮
    os.makedirs(target_dir, exist_ok=True)
    with open(target, "w", encoding="utf-8", newline="\n") as f:
        f.write(tpl)
    print("created: %s" % rel)
    print("下一步：填写内容 → python scripts/site/build.py → 更新所在目录 README.md 索引")
    return 0


if __name__ == "__main__":
    sys.exit(main())
