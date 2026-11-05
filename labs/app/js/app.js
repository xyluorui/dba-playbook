/*
 * app.js —— 交互实验室主控制器
 * 用途: 状态管理 + 各面板渲染 + 播放控件 + 主题切换 + 进度统计
 * 用法: 页面底部依次引入 scenes/*.js、topology.js、sequence.js、inspector.js、app.js
 * 日期: 2026-11-05
 */
(function () {
  'use strict';

  var S = {
    scene: null,
    current: 0,          // 已推进到第几步（0 = 未开始）
    maxDone: 0,          // 到达过的最大步数（用于进度）
    view: 'topology',    // topology | sequence
    playing: false,
    speed: 1,
    timer: null,
    catFilter: '全部'
  };

  var $ = function (id) { return document.getElementById(id); };

  /* ── 主题 ── */
  function initTheme() {
    var saved = localStorage.getItem('lab-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    $('theme-toggle').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? '' : 'dark';
      if (cur) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('lab-theme', cur);
      drawCanvas();
    });
  }

  /* ── 目录 ── */
  function renderCatalog() {
    var cats = ['全部'];
    window.LAB_CATALOG.forEach(function (u) {
      if (cats.indexOf(u.category) < 0) cats.push(u.category);
    });
    var tabs = $('cat-tabs');
    tabs.innerHTML = '';
    cats.forEach(function (c) {
      var b = document.createElement('button');
      b.className = c === S.catFilter ? 'on' : '';
      b.innerHTML = esc(c) + '<span class="n">' + catCount(c) + '</span>';
      b.addEventListener('click', function () { S.catFilter = c; renderCatalog(); });
      tabs.appendChild(b);
    });

    var list = $('cat-list');
    list.innerHTML = '';
    window.LAB_CATALOG.forEach(function (u) {
      if (S.catFilter !== '全部' && u.category !== S.catFilter) return;
      var wrap = document.createElement('div');
      wrap.className = 'cat-unit';
      wrap.innerHTML = '<div class="unit-name"><span>' + esc(u.unit) + '</span>' +
        '<span class="tag">' + esc(u.category) + '</span></div>';

      (u.scenes || []).forEach(function (sid) {
        var sc = sceneById(sid);
        if (!sc) return;
        wrap.appendChild(sceneCard(sc));
      });

      if (u.planned) {
        var p = document.createElement('div');
        p.className = 'cat-planned';
        p.innerHTML = '<b>开发中（P1 起）</b>' + esc(u.planned);
        wrap.appendChild(p);
      }
      list.appendChild(wrap);
    });
  }

  function catCount(c) {
    if (c === '全部') return window.LAB_CATALOG.reduce(function (n, u) { return n + (u.scenes || []).length; }, 0);
    return window.LAB_CATALOG.reduce(function (n, u) {
      return n + (u.category === c ? (u.scenes || []).length : 0);
    }, 0);
  }

  function sceneCard(sc) {
    var div = document.createElement('div');
    div.className = 'scene-card' + (S.scene && sc.id === S.scene.id ? ' on' : '');
    div.innerHTML =
      '<div class="row"><span class="radio"></span><span class="t">' + esc(sc.title) + '</span>' +
      '<span class="status">' + esc(sc.status) + '</span></div>' +
      '<div class="sub">' + esc(sc.subtitle) + '</div>';
    div.addEventListener('click', function () { selectScene(sc.id); });

    if (S.scene && sc.id === S.scene.id) {
      var ol = document.createElement('ol');
      ol.className = 'scene-steps';
      sc.steps.forEach(function (s) {
        var li = document.createElement('li');
        li.className = (S.current > s.no ? 'done ' : '') + (S.current === s.no ? 'current' : '');
        li.innerHTML = '<span class="no">' + s.no + '</span>' +
          '<span class="st"><b>' + esc(s.title) + '</b>' +
          '<span class="layer-chip">' + esc(layerName(s.layer)) + '</span></span>';
        li.addEventListener('click', function (e) { e.stopPropagation(); goTo(s.no); });
        ol.appendChild(li);
      });
      div.appendChild(ol);
    }
    return div;
  }

  /* ── 头部 ── */
  function renderHeader() {
    var sc = S.scene;
    $('hdr-title').innerHTML = esc(sc.title) + '<small>共 ' + sc.steps.length + ' 步</small>';
    var dots = $('hdr-steps');
    dots.innerHTML = '';
    sc.steps.forEach(function (s) {
      var i = document.createElement('i');
      if (S.current > s.no) i.className = 'done';
      else if (S.current === s.no) i.className = 'current';
      dots.appendChild(i);
    });
    var pct = Math.round((S.maxDone / sc.steps.length) * 100);
    $('hdr-pct').textContent = pct + '%';
    $('hdr-bar').style.width = pct + '%';
    $('hdr-count').textContent = '已完成 ' + S.maxDone + ' / ' + sc.steps.length + ' 步';
  }

  /* ── 右侧概览 ── */
  function renderInfo() {
    var sc = S.scene;
    $('info-title').textContent = sc.title;
    $('info-status').textContent = sc.status;
    $('info-desc').textContent = sc.description;

    var meta = $('info-meta');
    meta.innerHTML = '';
    sc.meta.forEach(function (m) {
      var row = document.createElement('div');
      row.className = 'meta-row';
      row.innerHTML = '<span class="k">' + esc(m.k) + '</span><span class="v">' +
        (m.href ? '<a href="' + esc(m.href) + '" target="_blank" rel="noopener">' + esc(m.v) + '</a>' : esc(m.v)) +
        '</span>';
      meta.appendChild(row);
    });

    var as = $('info-assump');
    as.innerHTML = '';
    sc.assumptions.forEach(function (a) {
      var li = document.createElement('li');
      li.textContent = a;
      as.appendChild(li);
    });

    $('info-challenge').innerHTML =
      '<span class="label">迁移挑战</span><p>' + esc(sc.challenge.prompt) + '</p>' +
      '<details class="ans"><summary>看提示答案</summary><p>' + esc(sc.challenge.answer) + '</p></details>';
  }

  /* ── 事件流表 ── */
  function renderEvents() {
    var sc = S.scene;
    var body = $('ev-body');
    body.innerHTML = '';
    sc.steps.forEach(function (s) {
      var tr = document.createElement('tr');
      tr.className = (S.current === s.no ? 'current ' : '') + (S.current < s.no ? 'future' : '');
      var color = layerColor(s.layer);
      tr.innerHTML =
        '<td><span class="num"><i class="' + color + '">' + s.no + '</i></span></td>' +
        '<td class="t">' + esc(s.time) + '</td>' +
        '<td>' + esc(layerName(s.layer)) + '</td>' +
        '<td class="obj">' + esc(s.evidence[0] ? s.evidence[0].object : '') + '</td>' +
        '<td class="act">' + esc(s.evidence[0] ? s.evidence[0].action : '') + '</td>' +
        '<td class="res">' + esc(s.evidence[0] ? s.evidence[0].result : '') + '</td>';
      tr.addEventListener('click', function () {
        goTo(s.no);
        openInspector(s.no);
      });
      body.appendChild(tr);
    });

    var legend = $('ev-legend');
    legend.innerHTML = sc.layers.map(function (l) {
      return '<span><i class="' + colorClass(l.color) + '"></i>' + esc(l.name.replace(/（.*/, '')) + '</span>';
    }).join('') + '<span class="sep"></span><span>点任意行打开检查器</span>';
  }

  /* ── 画布 ── */
  function drawCanvas() {
    var svg = $('canvas-svg');
    if (S.view === 'topology') TopologyView.render(svg, S.scene, S.current);
    else SequenceView.render(svg, S.scene, S.current, function (no) { goTo(no); });
    $('stage-hint').textContent = S.current === 0
      ? '点「单步」开始，或点左侧步骤跳转'
      : '第 ' + S.current + ' / ' + S.scene.steps.length + ' 步 · ' + S.scene.steps[S.current - 1].title;
  }

  /* ── 检查器 ── */
  function openInspector(no) {
    Inspector.render($('inspector'), S.scene, no, {
      onPrev: function () { goTo(no - 1); openInspector(no - 1); },
      onNext: function () { goTo(no + 1); openInspector(no + 1); },
      onClose: function () { Inspector.hide($('inspector')); }
    });
  }

  /* ── 推进 ── */
  function goTo(n) {
    S.current = Math.max(0, Math.min(S.scene.steps.length, n));
    if (S.current > S.maxDone) S.maxDone = S.current;
    renderHeader();
    renderCatalog();
    renderEvents();
    drawCanvas();
  }

  function stopPlay() {
    if (S.timer) { clearInterval(S.timer); S.timer = null; S.playing = false; $('btn-play').textContent = '▶ 播放'; }
  }

  function initControls() {
    $('btn-next').addEventListener('click', function () { stopPlay(); goTo(S.current + 1); });
    $('btn-prev').addEventListener('click', function () { stopPlay(); goTo(S.current - 1); });
    $('btn-step').addEventListener('click', function () { stopPlay(); goTo(S.current + 1); });
    $('btn-reset').addEventListener('click', function () {
      stopPlay(); S.maxDone = 0; Inspector.hide($('inspector')); goTo(0);
    });
    $('btn-play').addEventListener('click', function () {
      if (S.playing) { stopPlay(); return; }
      if (S.current >= S.scene.steps.length) { S.maxDone = 0; goTo(0); }
      S.playing = true;
      $('btn-play').textContent = '⏸ 暂停';
      S.timer = setInterval(function () {
        if (S.current >= S.scene.steps.length) { stopPlay(); return; }
        goTo(S.current + 1);
      }, 3400 / S.speed);
    });
    $('btn-speed').addEventListener('click', function () {
      S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 0.5 : 1;
      $('btn-speed').textContent = S.speed + '×';
      if (S.playing) { stopPlay(); $('btn-play').click(); }
    });

    document.querySelectorAll('.view-tabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        S.view = b.getAttribute('data-view');
        document.querySelectorAll('.view-tabs button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        drawCanvas();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { stopPlay(); goTo(S.current + 1); }
      else if (e.key === 'ArrowLeft') { stopPlay(); goTo(S.current - 1); }
      else if (e.key === ' ') { e.preventDefault(); $('btn-play').click(); }
      else if (e.key === 'Escape') { Inspector.hide($('inspector')); }
    });
  }

  /* ── 工具 ── */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function sceneById(id) {
    return window.LAB_SCENES.filter(function (s) { return s.id === id; })[0];
  }
  function layerName(id) {
    if (!S.scene) return '';
    var l = S.scene.layers.filter(function (x) { return x.id === id; })[0];
    return l ? l.name : id;
  }
  function colorClass(c) {
    return { blue: 'blue', green: 'green', amber: 'amber', purple: 'purple' }[c] || 'blue';
  }
  function layerColor(id) {
    var l = S.scene.layers.filter(function (x) { return x.id === id; })[0];
    return l ? colorClass(l.color) : 'blue';
  }

  /* ── 启动 ── */
  function boot() {
    S.scene = window.LAB_SCENES[0];
    initTheme();
    initControls();
    renderCatalog();
    renderHeader();
    renderInfo();
    renderEvents();
    drawCanvas();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
