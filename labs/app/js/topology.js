/*
 * topology.js —— 拓扑视图（网络）渲染：客户端 → mysqld 分层机箱 → 磁盘
 * 用途: 把场景的步骤状态画成分层拓扑图；只依赖场景数据的 layers/objects/steps
 * 用法: TopologyView.render(svgEl, scene, currentStepNo)
 * 日期: 2026-11-05
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, style) {
    var n = document.createElementNS(NS, name);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (style) n.setAttribute('style', style);
    return n;
  }

  function text(x, y, s, size, weight, color) {
    var t = el('text', { x: x, y: y, 'font-size': size, 'font-weight': weight || 600 });
    t.style.fill = color || 'var(--ink)';
    t.style.fontFamily = '"Segoe UI", -apple-system, "PingFang SC", sans-serif';
    t.textContent = s;
    return t;
  }

  function chip(x, y, label, colorVar, hot) {
    var g = el('g', { class: 'obj-chip' + (hot ? ' hot' : '') });
    var w = 12 + label.length * 15;
    var r = el('rect', {
      x: x, y: y, width: w, height: 30, rx: 15
    }, 'fill:' + (hot ? colorVar : 'var(--panel)') + ';stroke:' + colorVar + ';stroke-width:' + (hot ? 0 : 1.6) + ';transition:all .3s');
    g.appendChild(r);
    var t = text(x + w / 2, y + 20.5, label, 13, 700);
    t.setAttribute('text-anchor', 'middle');
    t.style.fill = hot ? '#fff' : 'var(--ink-2)';
    g.appendChild(t);
    return g;
  }

  // 每个步骤时 token 停留的位置（与画面路径对应）
  var TOKEN_POS = {
    1: { x: 252, y: 300 },
    2: { x: 352, y: 300 },
    3: { x: 470, y: 236 },
    4: { x: 592, y: 236 },
    5: { x: 772, y: 392 },
    6: { x: 252, y: 300 }
  };

  function render(svg, scene, current) {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 1000 560');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var defs = el('defs');
    var marker = el('marker', {
      id: 'arr', viewBox: '0 0 10 10', refX: 9, refY: 5,
      markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'
    });
    var p = el('path', { d: 'M 0 0 L 10 5 L 0 10 z' }, 'fill:var(--muted)');
    marker.appendChild(p);
    defs.appendChild(marker);
    svg.appendChild(defs);

    var step = current > 0 ? scene.steps[current - 1] : null;
    var stageLayer = step ? step.stage : null;

    /* ── 客户端（笔记本） ── */
    var client = el('g', { class: 'node-box' });
    client.appendChild(el('rect', { x: 60, y: 236, width: 172, height: 112, rx: 12 },
      'fill:var(--panel);stroke:var(--line-strong);stroke-width:1.6'));
    client.appendChild(el('rect', { x: 84, y: 256, width: 124, height: 72, rx: 6 },
      'fill:var(--accent-soft);stroke:var(--accent-2);stroke-width:1.4'));
    client.appendChild(el('rect', { x: 70, y: 336, width: 152, height: 12, rx: 5 },
      'fill:var(--line-strong)'));
    var ct = text(146, 240, '客户端', 14, 800); ct.setAttribute('text-anchor', 'middle'); client.appendChild(ct);
    var cs = text(146, 372, '10.0.0.5（示例）', 11, 600); cs.setAttribute('text-anchor', 'middle');
    cs.style.fill = 'var(--muted)'; client.appendChild(cs);
    svg.appendChild(client);

    /* ── mysqld 机箱（三层） ── */
    var server = el('g', { class: 'node-box' });
    server.appendChild(el('rect', { x: 330, y: 84, width: 392, height: 364, rx: 18 },
      'fill:var(--panel);stroke:var(--line-strong);stroke-width:1.8'));
    var st = text(526, 116, 'mysqld · MySQL 服务器', 15, 800); st.setAttribute('text-anchor', 'middle');
    server.appendChild(st);

    // 三个层带
    var bands = [
      { id: 'conn', y: 136, name: '连接层', hint: '连接管理 · 认证 · 会话', color: 'var(--c-blue)', objs: [['thread', '连接线程']] },
      { id: 'sql', y: 236, name: 'SQL 层（Server）', hint: '解析 · 优化 · 执行', color: 'var(--c-green)', objs: [['parser', '解析器'], ['optimizer', '优化器'], ['executor', '执行器']] },
      { id: 'innodb', y: 336, name: 'InnoDB（引擎层）', hint: '缓冲池 · 事务 · 索引', color: 'var(--c-amber)', objs: [['bp', 'Buffer Pool']] }
    ];
    bands.forEach(function (b) {
      var active = stageLayer === b.id;
      var g = el('g');
      g.appendChild(el('rect', {
        x: 352, y: b.y, width: 348, height: 86, rx: 12, class: 'layer-band' + (active ? ' active' : '')
      }, 'fill:' + (active ? 'var(--accent-soft)' : 'var(--panel-2)') +
         ';stroke:' + (active ? 'var(--accent)' : 'var(--line)') + ';stroke-width:1.6'));
      var bar = el('rect', { x: 352, y: b.y, width: 6, height: 86, rx: 3 }, 'fill:' + b.color);
      g.appendChild(bar);
      var t1 = text(372, b.y + 24, b.name, 12.5, 800, b.color); g.appendChild(t1);
      var t2 = text(372, b.y + 43, b.hint, 10.5, 600); t2.style.fill = 'var(--muted)'; g.appendChild(t2);
      var cx = 372;
      b.objs.forEach(function (o) {
        var hot = step && (step.highlight || []).indexOf(o[0]) >= 0;
        var c = chip(cx, b.y + 50, o[1], b.color, hot);
        g.appendChild(c);
        cx += 12 + o[1].length * 15 + 10;
      });
      server.appendChild(g);
    });
    svg.appendChild(server);

    /* ── 磁盘（表空间文件） ── */
    var disk = el('g', { class: 'node-box' });
    disk.appendChild(el('path', { d: 'M 830 300 h 130 v 96 a 22 12 0 0 1 -130 0 z' },
      'fill:var(--panel-2);stroke:var(--line-strong);stroke-width:1.6'));
    disk.appendChild(el('ellipse', { cx: 895, cy: 300, rx: 65, ry: 14 },
      'fill:var(--panel);stroke:var(--line-strong);stroke-width:1.6'));
    var dt = text(895, 282, '文件层 · 磁盘', 13, 800); dt.setAttribute('text-anchor', 'middle'); disk.appendChild(dt);
    var ds = text(895, 428, '表空间文件（.ibd）', 11, 600); ds.setAttribute('text-anchor', 'middle');
    ds.style.fill = 'var(--muted)'; disk.appendChild(ds);
    svg.appendChild(disk);

    /* ── 轨道（连线） ── */
    var railCS = el('line', { x1: 232, y1: 300, x2: 330, y2: 300, class: 'flow-rail' + (step && step.flow === 'client-server' ? ' hot' : '') },
      'stroke:var(--muted);stroke-width:2');
    svg.appendChild(railCS);
    var railSD = el('line', { x1: 722, y1: 392, x2: 828, y2: 392, class: 'flow-rail' + (step && step.flow === 'server-disk' ? ' hot' : '') },
      'stroke:var(--muted);stroke-width:2');
    svg.appendChild(railSD);
    svg.appendChild(el('path', { d: 'M 322 300 l -10 -5 v 10 z' }, 'fill:var(--muted)'));
    svg.appendChild(el('path', { d: 'M 822 392 l -10 -5 v 10 z' }, 'fill:var(--muted)'));

    var l1 = text(281, 286, 'TCP · SQL', 10.5, 700); l1.setAttribute('text-anchor', 'middle');
    l1.style.fill = 'var(--muted)'; svg.appendChild(l1);
    var l2 = text(775, 378, '读数据页', 10.5, 700); l2.setAttribute('text-anchor', 'middle');
    l2.style.fill = 'var(--muted)'; svg.appendChild(l2);

    /* ── token（当前步骤的活动位置） ── */
    if (step) {
      var pos = TOKEN_POS[step.no] || { x: 526, y: 300 };
      var tok = el('g', { class: 'token' });
      tok.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
      tok.appendChild(el('circle', { r: 12, class: 'pulse' }, 'fill:var(--accent)'));
      tok.appendChild(el('circle', { r: 11 }, 'fill:var(--accent);stroke:#fff;stroke-width:3'));
      svg.appendChild(tok);
    }

    /* ── 底部说明 ── */
    var note = text(500, 530, '画面为教学示意（简化结构），不代表真实布局与性能', 11, 600);
    note.setAttribute('text-anchor', 'middle');
    note.style.fill = 'var(--muted)';
    svg.appendChild(note);
  }

  window.TopologyView = { render: render };
})();
