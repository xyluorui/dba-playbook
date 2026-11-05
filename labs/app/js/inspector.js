/*
 * inspector.js —— 步骤检查器（对标字节级检查器）
 * 用途: 点开某个步骤后展示字段解码（带教学注释）+ 结构示意 + 边界声明
 * 用法: Inspector.render(containerEl, scene, stepNo, {onPrev, onNext, onClose})
 * 日期: 2026-11-05
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function render(box, scene, stepNo, cb) {
    var step = scene.steps[stepNo - 1];
    if (!step) return;
    var insp = step.inspector || { fields: [], struct: null };
    var layerName = (scene.layers.filter(function (l) { return l.id === step.layer; })[0] || {}).name || '';

    var seqMeta = step.seq
      ? esc(step.seq.from) + ' → ' + esc(step.seq.to) + ' · ' + esc(step.seq.label)
      : '组件内部处理';

    var fields = (insp.fields || []).map(function (f) {
      return '<div class="frow">' +
        '<div class="fname">' + esc(f.name) + '</div>' +
        '<div class="fval">' + esc(f.value) + '</div>' +
        (f.note ? '<div class="fnote">注 · ' + esc(f.note) + '</div>' : '') +
        '</div>';
    }).join('');

    var struct = insp.struct
      ? '<div class="insp-struct"><h4>' + esc(insp.struct.title) +
        '<span class="sample">示例</span></h4><pre>' + esc(insp.struct.text) + '</pre></div>'
      : '';

    box.innerHTML =
      '<div class="insp-head">' +
        '<span class="insp-chip">步骤 ' + step.no + '</span>' +
        '<div><div class="insp-title">' + esc(step.title) + '</div>' +
        '<div class="insp-meta">' + esc(step.time) + ' · ' + seqMeta + ' · ' + esc(layerName) + '</div></div>' +
        '<div class="insp-nav">' +
          '<button class="btn btn-round" data-act="prev" title="上一步"' + (stepNo <= 1 ? ' disabled' : '') + '>‹</button>' +
          '<button class="btn btn-round" data-act="next" title="下一步"' + (stepNo >= scene.steps.length ? ' disabled' : '') + '>›</button>' +
          '<button class="btn" data-act="close">✕ 关闭</button>' +
        '</div>' +
      '</div>' +
      '<div class="insp-body">' +
        '<div class="insp-fields">' + fields + '</div>' +
        struct +
      '</div>' +
      '<div class="insp-foot"><span class="sample">示例</span> ' +
        '示例值：每次真实执行的细节都不一样 ·· 教学中无法展示的细节：权限校验、网络传输、加密数据' +
      '</div>';

    box.classList.remove('hidden');
    box.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-act');
        if (act === 'prev' && cb.onPrev) cb.onPrev();
        if (act === 'next' && cb.onNext) cb.onNext();
        if (act === 'close' && cb.onClose) cb.onClose();
      });
    });
  }

  function hide(box) { box.classList.add('hidden'); }

  window.Inspector = { render: render, hide: hide };
})();
