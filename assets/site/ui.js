/* DBA Playbook 站点行为：侧边栏、搜索、元信息徽章、文内目录、Mermaid/高亮初始化 */
(function () {
  "use strict";
  var root = document.body.getAttribute("data-root") || "";

  function normPath(p) {
    try { p = decodeURIComponent(p); } catch (e) {}
    return p.replace(/\\/g, "/");
  }
  function currentRel() {
    var path = normPath(location.pathname);
    var all = [];
    (function walk(nodes) {
      (nodes || []).forEach(function (n) {
        all.push(n.path);
        walk(n.children);
      });
    })(window.__SITE_NAV__);
    if (window.__SEARCH_INDEX__) {
      window.__SEARCH_INDEX__.forEach(function (it) { all.push(it.u); });
    }
    var best = "";
    all.forEach(function (p) {
      if (path.endsWith("/" + p) && p.length > best.length) best = p;
    });
    return best;
  }

  /* ── 侧边栏 ── */
  function containsPath(node, cur) {
    if (!cur) return false;
    if (node.path === cur) return true;
    var inPages = (node.pages || []).some(function (p) { return p.path === cur; });
    return inPages || (node.children || []).some(function (c) { return containsPath(c, cur); });
  }
  function renderSidebar() {
    var el = document.getElementById("sidebar");
    if (!el || !window.__SITE_NAV__) return;
    var cur = currentRel();
    var html = "";
    window.__SITE_NAV__.forEach(function (sec) {
      var hasCur = containsPath(sec, cur);
      html += '<details class="sec"' + (hasCur || sec.children.length === 0 ? " open" : "") + ">";
      html += "<summary>" + esc(sec.title) + "</summary><ul>";
      html += pageLinks(sec.pages, cur);
      sec.children.forEach(function (sub) {
        html += subTree(sub, cur);
      });
      html += "</ul></details>";
    });
    el.innerHTML = html;
    var active = el.querySelector("a.active");
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "center" });
  }
  function subTree(node, cur) {
    var hasCur = containsPath(node, cur);
    var h = '<details class="sub"' + (hasCur ? " open" : "") + ">";
    h += "<summary>" + esc(node.title) + "</summary><ul>";
    h += '<li><a href="' + root + node.path + '">概览</a></li>';
    h += pageLinks(node.pages, cur);
    node.children.forEach(function (c) { h += subTree(c, cur); });
    return h + "</ul></details>";
  }
  function pageLinks(pages, cur) {
    return (pages || []).map(function (p) {
      var mark = p.status === "draft" ? '<span class="dot">●</span>' : "";
      return '<li><a href="' + root + p.path + '"' +
        (p.path === cur ? ' class="active" aria-current="page"' : "") + ">" + esc(p.title) + mark + "</a></li>";
    }).join("");
  }

  /* ── 元信息徽章 ── */
  function renderMeta() {
    var keys = ["database", "category", "tags", "date", "status"];
    var vals = {};
    var any = false;
    keys.forEach(function (k) {
      var m = document.querySelector('head meta[name="' + k + '"]');
      if (m && m.getAttribute("content")) { vals[k] = m.getAttribute("content"); any = true; }
    });
    if (!any) return;
    var box = document.querySelector("main .meta");
    if (box && box.children.length) return;
    if (!box) {
      var h1 = document.querySelector("main .content h1");
      if (!h1) return;
      box = document.createElement("p");
      box.className = "meta";
      h1.insertAdjacentElement("afterend", box);
    }
    var h = "";
    if (vals.database) h += '<span class="badge db">' + esc(vals.database) + "</span>";
    if (vals.category) h += '<span class="badge cat">' + esc(vals.category) + "</span>";
    (vals.tags || "").split(/[,，]/).forEach(function (t) {
      t = t.trim();
      if (t && t.indexOf("填写") === -1) h += '<span class="badge">' + esc(t) + "</span>";
    });
    if (vals.date) h += '<span class="badge">' + esc(vals.date) + "</span>";
    if (vals.status) {
      var st = vals.status.split(/[,，\s]/)[0].toLowerCase();
      h += '<span class="badge status-' + esc(st) + '">' + esc(vals.status) + "</span>";
    }
    box.innerHTML = h;
  }

  /* ── 文内目录 ── */
  function renderToc() {
    var content = document.querySelector("main .content");
    if (!content) return;
    var hs = content.querySelectorAll("h2, h3");
    if (hs.length < 3) return;
    var toc = document.createElement("nav");
    toc.className = "toc";
    var h = "";
    hs.forEach(function (el, i) {
      if (!el.id) el.id = "sec-" + (i + 1);
      h += '<a class="' + el.tagName.toLowerCase() + '" href="#' + el.id + '">' +
        esc(el.textContent) + "</a>";
    });
    toc.innerHTML = h;
    document.body.appendChild(toc);
  }

  /* ── 搜索 ── */
  function renderSearch() {
    var box = document.getElementById("search-box");
    if (!box) return;
    box.innerHTML = '<input type="search" placeholder="搜索文档…" aria-label="搜索">' +
      '<div class="results"></div>';
    var input = box.querySelector("input");
    var panel = box.querySelector(".results");
    var sel = -1, items = [];

    function run() {
      var q = input.value.trim().toLowerCase();
      sel = -1;
      if (!q) { panel.classList.remove("open"); return; }
      var terms = q.split(/\s+/);
      var data = window.__SEARCH_INDEX__ || [];
      items = [];
      data.forEach(function (it) {
        var t = (it.t || "").toLowerCase();
        var k = (it.k || "").toLowerCase();
        var b = (it.b || "").toLowerCase();
        var score = 0, ok = true;
        terms.forEach(function (term) {
          var hit = false;
          if (t.indexOf(term) > -1) { score += 12; hit = true; }
          if (k.indexOf(term) > -1) { score += 6; hit = true; }
          if (b.indexOf(term) > -1) { score += 2; hit = true; }
          if (!hit) ok = false;
        });
        if (ok) items.push({ it: it, score: score });
      });
      items.sort(function (a, b) { return b.score - a.score; });
      items = items.slice(0, 8);
      if (!items.length) {
        panel.innerHTML = '<div class="empty">没有匹配「' + esc(input.value.trim()) + '」的文档</div>';
      } else {
        panel.innerHTML = items.map(function (r, i) {
          return '<a href="' + root + r.it.u + '"' + (i === 0 ? ' class="sel"' : "") + ">" +
            '<span class="t">' + esc(r.it.t) + "</span>" +
            '<span class="s">' + esc(snippet(r.it, terms[0])) + "</span></a>";
        }).join("");
        sel = 0;
      }
      panel.classList.add("open");
    }
    function snippet(it, term) {
      var b = it.b || "";
      var i = (term ? b.toLowerCase().indexOf(term) : -1);
      if (i < 0) return b.slice(0, 60);
      return (i > 18 ? "…" : "") + b.slice(Math.max(0, i - 18), i + 42) + "…";
    }
    function move(dir) {
      var links = panel.querySelectorAll("a");
      if (!links.length) return;
      if (sel > -1 && links[sel]) links[sel].classList.remove("sel");
      sel = (sel + dir + links.length) % links.length;
      links[sel].classList.add("sel");
    }
    input.addEventListener("input", debounce(run, 120));
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        var links = panel.querySelectorAll("a");
        if (sel > -1 && links[sel]) location.href = links[sel].href;
      } else if (e.key === "Escape") { panel.classList.remove("open"); input.blur(); }
    });
    document.addEventListener("click", function (e) {
      if (!box.contains(e.target)) panel.classList.remove("open");
    });
  }

  /* ── 工具 ── */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments, self = this;
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  /* ── 按需加载大体积依赖 ── */
  function loadScript(name, done) {
    var s = document.createElement("script");
    s.src = root + "assets/site/" + name;
    s.onload = done;
    document.head.appendChild(s);
  }
  function setupHighlight() {
    // 只处理显式标了语言、且构建期没预渲染（无 .hljs）的块；未标语言的块按纯文本展示，不做自动猜测
    var blocks = document.querySelectorAll('pre code[class*="language-"]:not(.hljs)');
    if (!blocks.length) return;
    loadScript("highlight.min.js", function () {
      blocks.forEach(function (el) { window.hljs.highlightElement(el); });
    });
  }
  function setupMermaid() {
    // 已预渲染为内嵌 SVG 的页面没有 pre.mermaid，不必加载 3MB+ 的 mermaid
    var nodes = document.querySelectorAll("pre.mermaid");
    if (!nodes.length) return;
    loadScript("mermaid.min.js", function () {
      var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: dark ? "dark" : "neutral"
      });
      window.mermaid.run({ nodes: nodes });
    });
  }

  /* ── 移动端侧栏开关 ── */
  function setupNavToggle() {
    var toggle = document.getElementById("nav-toggle");
    if (!toggle) return;
    function setOpen(open) {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "关闭目录" : "打开目录");
    }
    toggle.addEventListener("click", function () {
      setOpen(!document.body.classList.contains("nav-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ── 初始化 ── */
  function init() {
    renderSidebar();
    renderMeta();
    renderToc();
    renderSearch();
    setupNavToggle();
    setupHighlight();
    setupMermaid();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
