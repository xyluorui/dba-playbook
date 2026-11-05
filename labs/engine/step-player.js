/*
 * step-player.js — 交互实验室单步引擎（P0 雏形）
 * 用途: 读取 window.LAB_SCENE 场景数据，渲染步骤列表、分层画面、证据表与播放控件
 * 用法: <script src="scenes/<场景>.js"></script><script src="engine/step-player.js"></script>
 *       然后 StepPlayer.mount(document.getElementById('lab-root'))
 * 适用: 纯原生 JS，无网络请求，file:// 可用；场景格式见 ../README.md
 * 风险: 只读 DOM，无副作用
 * 日期: 2026-11-05
 */
(function () {
  'use strict';

  var AUTO_PLAY_MS = 5000; // 播放模式下每步停留毫秒数（教学节奏，与实测耗时无关）

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function mount(root) {
    var scene = window.LAB_SCENE;
    if (!root || !scene) return;
    root.innerHTML = '';
    root.className = 'lab';

    /* ── 头部：标题 + 版本/引擎角标 + 大纲回溯 ── */
    var head = el('div', 'lab-head');
    head.appendChild(el('h2', 'lab-title', scene.title));
    var badges = el('p', 'lab-badges');
    badges.appendChild(el('span', 'badge db', scene.version));
    badges.appendChild(el('span', 'badge', scene.engine));
    badges.appendChild(el('span', 'badge', '教学演示'));
    (scene.outline || []).forEach(function (o) {
      badges.appendChild(el('span', 'badge', '大纲 ' + o));
    });
    head.appendChild(badges);
    root.appendChild(head);

    /* ── 边界标注（模型假设，必读） ── */
    var assum = el('div', 'lab-assumptions');
    assum.appendChild(el('strong', null, '边界与假设：'));
    var ul = el('ul');
    (scene.assumptions || []).forEach(function (a) {
      ul.appendChild(el('li', null, a));
    });
    assum.appendChild(ul);
    root.appendChild(assum);

    /* ── 主区：左步骤列表 / 中画面 / 右讲解 ── */
    var main = el('div', 'lab-main');

    var listWrap = el('div', 'lab-steps');
    listWrap.appendChild(el('h3', null, '步骤'));
    var stepList = el('ol', 'lab-step-list');
    listWrap.appendChild(stepList);
    main.appendChild(listWrap);

    var stage = el('div', 'lab-stage');
    stage.appendChild(el('h3', null, '画面'));
    var layerBox = el('div', 'lab-layers');
    stage.appendChild(layerBox);
    main.appendChild(stage);

    var side = el('div', 'lab-side');
    side.appendChild(el('h3', null, '这一步发生了什么'));
    var narration = el('p', 'lab-narration');
    side.appendChild(narration);
    main.appendChild(side);

    root.appendChild(main);

    /* ── 证据表 ── */
    var evWrap = el('div', 'lab-evidence');
    evWrap.appendChild(el('h3', null, '证据表'));
    var evTable = el('table', 'lab-ev-table');
    var thead = el('thead');
    var hr = el('tr');
    ['序号', '层', '对象', '动作', '结果（证据）'].forEach(function (h) {
      hr.appendChild(el('th', null, h));
    });
    thead.appendChild(hr);
    evTable.appendChild(thead);
    var tbody = el('tbody');
    evTable.appendChild(tbody);
    evWrap.appendChild(evTable);
    root.appendChild(evWrap);

    /* ── 播放控件 ── */
    var controls = el('div', 'lab-controls');
    var btnReset = el('button', 'lab-btn', '重置');
    var btnPrev = el('button', 'lab-btn', '上一步');
    var btnPlay = el('button', 'lab-btn lab-btn-primary', '播放');
    var btnNext = el('button', 'lab-btn lab-btn-primary', '下一步');
    var posText = el('span', 'lab-pos');
    [btnReset, btnPrev, btnPlay, btnNext].forEach(function (b) {
      b.type = 'button';
      controls.appendChild(b);
    });
    controls.appendChild(posText);
    root.appendChild(controls);

    /* ── 状态与渲染 ── */
    var steps = scene.steps || [];
    var current = 0; // 已走到第几步（0 = 未开始，len = 结束）
    var timer = null;

    function layerName(id) {
      var hit = (scene.layers || []).filter(function (l) { return l.id === id; })[0];
      return hit ? hit.name : (id || '');
    }

    function render() {
      /* 步骤列表 */
      stepList.innerHTML = '';
      steps.forEach(function (s, i) {
        var li = el('li', 'lab-step' + (i + 1 === current ? ' is-current' : '') + (i + 1 < current ? ' is-done' : ''));
        li.appendChild(el('span', 'lab-step-no', String(s.no)));
        var body = el('div', 'lab-step-body');
        body.appendChild(el('strong', null, s.title));
        body.appendChild(el('span', 'lab-step-layer', layerName(s.layer)));
        li.appendChild(body);
        li.addEventListener('click', function () { goTo(i + 1); });
        stepList.appendChild(li);
      });

      /* 画面：分层盒子 + 对象条 */
      layerBox.innerHTML = '';
      (scene.layers || []).forEach(function (l) {
        var box = el('div', 'lab-layer' + (steps[current - 1] && steps[current - 1].layer === l.id ? ' is-active' : ''));
        box.appendChild(el('div', 'lab-layer-name', l.name));
        var objs = el('div', 'lab-objects');
        (scene.objects || []).filter(function (o) { return o.layer === l.id; }).forEach(function (o) {
          var hi = (steps[current - 1] && (steps[current - 1].highlight || []).indexOf(o.id) >= 0);
          objs.appendChild(el('span', 'lab-object' + (hi ? ' is-highlight' : ''), o.label));
        });
        box.appendChild(objs);
        layerBox.appendChild(box);
      });

      /* 讲解 */
      narration.textContent = steps[current - 1]
        ? steps[current - 1].narration
        : '点"下一步"开始，或点左侧任意步骤跳转。';

      /* 证据表：只展开已走过的步骤 */
      tbody.innerHTML = '';
      steps.forEach(function (s, i) {
        if (i + 1 > current) return;
        (s.evidence || []).forEach(function (e) {
          var tr = el('tr', i + 1 === current ? 'is-current' : '');
          tr.appendChild(el('td', null, String(s.no)));
          tr.appendChild(el('td', null, layerName(s.layer)));
          tr.appendChild(el('td', null, e.object));
          tr.appendChild(el('td', null, e.action));
          tr.appendChild(el('td', null, e.result));
          tbody.appendChild(tr);
        });
      });

      /* 控件状态 */
      posText.textContent = '第 ' + current + ' / ' + steps.length + ' 步';
      btnPrev.disabled = current <= 0;
      btnNext.disabled = current >= steps.length;
      btnPlay.textContent = timer ? '暂停' : '播放';
    }

    function goTo(n) {
      current = Math.max(0, Math.min(steps.length, n));
      render();
    }

    function stopPlay() {
      if (timer) { clearInterval(timer); timer = null; render(); }
    }

    btnNext.addEventListener('click', function () { stopPlay(); goTo(current + 1); });
    btnPrev.addEventListener('click', function () { stopPlay(); goTo(current - 1); });
    btnReset.addEventListener('click', function () { stopPlay(); goTo(0); });
    btnPlay.addEventListener('click', function () {
      if (timer) { stopPlay(); return; }
      if (current >= steps.length) current = 0;
      timer = setInterval(function () {
        if (current >= steps.length) { stopPlay(); return; }
        goTo(current + 1);
      }, AUTO_PLAY_MS);
      render();
    });

    render();
  }

  window.StepPlayer = { mount: mount };
})();
