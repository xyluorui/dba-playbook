/*
 * sequence.js —— 时序视图渲染：参与者生命线 + 消息箭头 + 时间轨
 * 用途: 把场景 steps[].seq 画成时序图；seq 为 null 的内部步骤画成生命线上的注记
 * 用法: SequenceView.render(svgEl, scene, currentStepNo, onPick(stepNo))
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

  function text(x, y, s, size, weight, colorVar) {
    var t = el('text', { x: x, y: y, 'font-size': size, 'font-weight': weight || 600 });
    t.style.fill = colorVar || 'var(--ink)';
    t.style.fontFamily = '"Segoe UI", -apple-system, "PingFang SC", sans-serif';
    t.textContent = s;
    return t;
  }

  // 参与者列位置（对象 id → 生命线 x）
  var COL = { client: 130, thread: 330, parser: 530, optimizer: 530, executor: 530, bp: 730, disk: 910 };
  var ACTORS = [
    { x: 130, label: '客户端', color: 'var(--c-blue)', layer: 'conn' },
    { x: 330, label: '连接线程', color: 'var(--c-blue)', layer: 'conn' },
    { x: 530, label: 'SQL 层', color: 'var(--c-green)', layer: 'sql' },
    { x: 730, label: 'InnoDB', color: 'var(--c-amber)', layer: 'innodb' },
    { x: 910, label: '磁盘', color: 'var(--c-purple)', layer: 'file' }
  ];

  function render(svg, scene, current, onPick) {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 1000 560');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var defs = el('defs');
    var m = el('marker', {
      id: 'sarr', viewBox: '0 0 10 10', refX: 9, refY: 5,
      markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'
    });
    m.appendChild(el('path', { d: 'M 0 0 L 10 5 L 0 10 z' }, 'fill:var(--ink-2)'));
    defs.appendChild(m);
    var mm = el('marker', {
      id: 'sarr-hot', viewBox: '0 0 10 10', refX: 9, refY: 5,
      markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'
    });
    mm.appendChild(el('path', { d: 'M 0 0 L 10 5 L 0 10 z' }, 'fill:var(--accent)'));
    defs.appendChild(mm);
    svg.appendChild(defs);

    /* 顶部参与者卡片 + 生命线 */
    ACTORS.forEach(function (a) {
      var g = el('g');
      g.appendChild(el('rect', { x: a.x - 62, y: 18, width: 124, height: 46, rx: 10 },
        'fill:var(--panel);stroke:' + a.color + ';stroke-width:1.8'));
      g.appendChild(el('rect', { x: a.x - 62, y: 18, width: 124, height: 6, rx: 3 }, 'fill:' + a.color));
      var t = text(a.x, 47, a.label, 13, 800); t.setAttribute('text-anchor', 'middle');
      g.appendChild(t);
      svg.appendChild(g);
      svg.appendChild(el('line', {
        x1: a.x, y1: 70, x2: a.x, y2: 540, class: 'flow-rail'
      }, 'stroke:var(--line-strong);stroke-width:1.6;animation:none;stroke-dasharray:5 6;opacity:.7'));
    });

    /* 每步一行 */
    var rowY = 112, rowH = 68;
    scene.steps.forEach(function (s, i) {
      var y = rowY + i * rowH;
      var isCurrent = s.no === current;
      var isDone = current > s.no;
      var isFuture = current < s.no;

      var rowG = el('g', { class: 'seq-row' + (isCurrent ? ' hot' : ''), style: 'cursor:pointer' });
      rowG.appendChild(el('rect', {
        x: 60, y: y - 26, width: 890, height: 54, rx: 9
      }, 'fill:' + (isCurrent ? 'var(--accent-soft)' : 'transparent')));
      rowG.addEventListener('click', function () { if (onPick) onPick(s.no); });

      // 时间标签
      var tt = text(66, y + 4, s.time, 11, 700);
      tt.style.fill = 'var(--muted)';
      tt.style.fontFamily = '"Cascadia Mono", Consolas, monospace';
      rowG.appendChild(tt);

      // 步骤序号角标
      var noBg = el('circle', { cx: 108, cy: y, r: 11 },
        'fill:' + (isDone ? 'var(--ok)' : isCurrent ? 'var(--accent)' : 'var(--panel-2)') +
        ';stroke:' + (isDone ? 'var(--ok)' : isCurrent ? 'var(--accent)' : 'var(--line-strong)') + ';stroke-width:1.5');
      rowG.appendChild(noBg);
      var nt = text(108, y + 4, String(s.no), 10.5, 800);
      nt.setAttribute('text-anchor', 'middle');
      nt.style.fill = (isDone || isCurrent) ? '#fff' : 'var(--muted)';
      rowG.appendChild(nt);

      if (s.seq) {
        var x1 = COL[s.seq.from] || 530, x2 = COL[s.seq.to] || 530;
        var cls = 'seq-arrow' + (isCurrent ? ' hot' : isFuture ? ' dim' : '');
        var line = el('line', {
          x1: x1, y1: y, x2: x2 + (x2 > x1 ? -8 : x2 < x1 ? 8 : 0), y2: y, class: cls,
          'marker-end': isCurrent ? 'url(#sarr-hot)' : 'url(#sarr)'
        }, 'stroke:' + (isCurrent ? 'var(--accent)' : 'var(--ink-2)') + ';stroke-width:2');
        rowG.appendChild(line);
        // 箭头标签
        var mid = (x1 + x2) / 2;
        var label = text(mid, y - 11, s.seq.label, 11.5, 700);
        label.setAttribute('text-anchor', 'middle');
        label.style.fill = isCurrent ? 'var(--accent)' : isFuture ? 'var(--muted)' : 'var(--ink-2)';
        rowG.appendChild(label);
      } else {
        // 内部步骤：生命线上的注记框
        var x = COL[Object.keys(COL).find(function (k) {
          return (s.highlight || []).indexOf(k) >= 0;
        })] || 530;
        var w = 210;
        rowG.appendChild(el('rect', {
          x: x - w / 2, y: y - 15, width: w, height: 30, rx: 8
        }, 'fill:var(--panel-2);stroke:' + (isCurrent ? 'var(--accent)' : 'var(--line-strong)') + ';stroke-width:1.6'));
        var it = text(x, y + 5, s.title, 11.5, 700);
        it.setAttribute('text-anchor', 'middle');
        it.style.fill = isCurrent ? 'var(--accent)' : 'var(--ink-2)';
        rowG.appendChild(it);
      }

      svg.appendChild(rowG);
    });

    /* 底部说明 */
    var note = text(500, 546, '时间与报文为教学示例，不代表实测耗时；seq 为 null 的步骤是组件内部处理', 11, 600);
    note.setAttribute('text-anchor', 'middle');
    note.style.fill = 'var(--muted)';
    svg.appendChild(note);
  }

  window.SequenceView = { render: render };
})();
