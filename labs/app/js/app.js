/* 实验播放器。当前步号驱动图示、证据、检查器及事件流。 */
(function () {
  'use strict';

  const scenes = window.LAB_SCENES;
  const state = {
    scene: scenes[0],
    current: 0,
    view: 'topology',
    speed: 1,
    timer: null,
    category: '全部'
  };

  const byId = (id) => document.getElementById(id);
  const viewButtons = document.querySelectorAll('[data-view][type="button"]');
  const next = byId('btn-next');
  const prev = byId('btn-prev');
  const play = byId('btn-play');
  const speed = byId('btn-speed');
  const inspector = byId('inspector');
  const inspectorSummary = inspector.querySelector('summary');
  const canvas = byId('canvas');

  function append(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function initTheme() {
    const root = document.documentElement;
    const button = byId('theme-toggle');

    function label() {
      const nextTheme = root.dataset.theme === 'light' ? '深色' : '浅色';
      button.textContent = nextTheme;
      button.setAttribute('aria-label', '切换到' + nextTheme + '主题');
    }

    label();
    button.hidden = false;
    button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('dba-playbook-theme', root.dataset.theme);
      } catch {
        // 本地文件或禁用存储时，仍可在本页切换主题。
      }
      label();
    });
  }

  function initBackLink() {
    const from = new URLSearchParams(window.location.search).get('from');
    const back = byId('back-to-reading');

    if (from === 'explain') {
      back.href = '../../docs/02-mysql/01-sql-layer/sql-execution-and-explain.html#sec-16';
      back.textContent = '← 返回 Server 层与执行计划';
    } else if (from === 'architecture') {
      back.href = '../../docs/02-mysql/00-overview/mysql-layered-architecture.html#sec-8';
      back.textContent = '← 返回 MySQL 分层架构';
    }
  }

  function renderCatalog() {
    const tabs = byId('catalog-tabs');
    const list = byId('catalog-list');
    const categories = ['全部', ...new Set(window.LAB_CATALOG.map((unit) => unit.category))];
    const hadFocus = tabs.contains(document.activeElement);
    tabs.replaceChildren();
    list.replaceChildren();

    categories.forEach((category) => {
      const button = append(tabs, 'button', category);
      button.type = 'button';
      button.className = 'button';
      button.setAttribute('aria-pressed', String(category === state.category));
      button.addEventListener('click', () => {
        state.category = category;
        renderCatalog();
      });
      if (hadFocus && category === state.category) button.focus();
    });

    window.LAB_CATALOG.forEach((unit) => {
      if (state.category !== '全部' && state.category !== unit.category) return;
      const item = append(list, 'div', '');
      append(item, 'h3', unit.unit);
      unit.scenes.forEach((id) => {
        const scene = scenes.find((entry) => entry.id === id);
        if (!scene) return;
        const button = append(item, 'button', scene.title);
        button.type = 'button';
        button.className = 'button';
        button.setAttribute('aria-pressed', String(scene === state.scene));
        button.addEventListener('click', () => {
          if (scene !== state.scene) {
            stopPlay();
            state.scene = scene;
            state.current = 0;
            inspector.open = false;
            renderScene();
            renderCatalog();
            renderStep();
          }
          next.focus();
        });
      });
      if (unit.planned) append(item, 'p', '待建设 · ' + unit.planned);
    });
  }

  function renderScene() {
    const scene = state.scene;
    byId('lab-category').textContent = scene.category;
    byId('lab-title').textContent = scene.title;
    byId('lab-question').textContent = scene.question;
    byId('lab-version').textContent = scene.version;
    byId('lab-engine').textContent = scene.engine;
    byId('lab-input-label').textContent = scene.input.label;
    const input = byId('lab-input');
    input.textContent = scene.input.text;
    input.className = 'language-' + scene.input.language;
    byId('step-command').querySelector('code').className = input.className;
    byId('challenge-prompt').textContent = scene.challenge.prompt;
    byId('challenge-answer').textContent = scene.challenge.answer;

    const assumptions = byId('lab-assumptions');
    const references = byId('lab-references');
    const steps = byId('step-links');
    const events = byId('event-rows');
    [assumptions, references, steps, events].forEach((element) => element.replaceChildren());

    scene.assumptions.forEach((note) => append(assumptions, 'li', note));
    scene.references.forEach((reference) => {
      append(append(references, 'li', ''), 'a', reference.title).href = reference.href;
    });

    const layerNames = new Map(scene.layers.map((layer) => [layer.id, layer.name]));
    scene.steps.forEach((step) => {
      const item = append(steps, 'li', '');
      const button = append(item, 'button', String(step.no));
      button.type = 'button';
      button.dataset.step = step.no;
      button.title = step.title;
      button.setAttribute('aria-label', '第 ' + step.no + ' 步，' + step.title);
      button.addEventListener('click', () => seek(step.no));

      step.evidence.forEach((entry) => {
        const row = append(events, 'tr', '');
        row.dataset.step = step.no;
        const label = append(append(row, 'td', ''), 'button', step.no + ' · ' + step.title);
        label.type = 'button';
        label.className = 'event-link';
        [step.time, layerNames.get(step.layer), entry.object, entry.action, entry.result]
          .forEach((field) => append(row, 'td', field));
        row.addEventListener('click', () => {
          seek(step.no);
          inspector.open = true;
          inspectorSummary.focus();
        });
      });
    });
  }

  function drawCanvas() {
    const svg = byId('canvas-svg');
    canvas.dataset.view = state.view;

    if (state.view === 'topology') {
      TopologyView.render(svg, state.scene, state.current);
      canvas.removeAttribute('tabindex');
      canvas.removeAttribute('role');
      canvas.removeAttribute('aria-label');
    } else {
      SequenceView.render(svg, state.scene, state.current, seek);
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'region');
      canvas.setAttribute('aria-label', '时序图，可横向滚动');
    }
    byId('diagram-scroll-hint').hidden = state.view !== 'sequence';

    viewButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.view === state.view));
    });
  }

  function renderStep() {
    const steps = state.scene.steps;
    const step = steps[state.current - 1];
    const check = step?.check;

    byId('step-counter').textContent = state.current + ' / ' + steps.length;
    byId('step-title').textContent = step ? step.title : '准备开始';
    byId('step-narration').textContent = step ? step.narration : '逐步观察高亮组件和可核对的证据。';
    byId('diagram-caption').textContent = step ? '第 ' + step.no + ' 步 · ' + step.title : '高亮显示当前步骤';
    byId('step-evidence').hidden = !check;

    if (check) {
      byId('step-check').textContent = check.instruction;
      const command = byId('step-command');
      command.hidden = !check.command;
      command.querySelector('code').textContent = check.command || '';
      const source = byId('step-source');
      source.hidden = !check.source;
      if (check.source) source.href = check.source;
      byId('step-example').hidden = !check.example;
      if (check.example) {
        byId('example-title').textContent = check.example.title;
        byId('example-output').textContent = check.example.text;
      }
    }

    inspector.hidden = !step?.inspector;
    if (!step) inspector.open = false;
    Inspector.render(byId('inspector-body'), step?.inspector);

    prev.disabled = state.current === 0;
    next.disabled = state.current === steps.length;
    next.textContent = state.current === 0 ? '开始实验' : next.disabled ? '实验完成' : '下一步';
    byId('btn-reset').disabled = state.current === 0 && state.timer === null;

    byId('step-links').querySelectorAll('button').forEach((button) => {
      const number = Number(button.dataset.step);
      button.classList.toggle('past', number < state.current);
      if (number === state.current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    byId('event-rows').querySelectorAll('tr').forEach((row) => {
      row.classList.toggle('current', Number(row.dataset.step) === state.current);
    });

    drawCanvas();
  }

  function goTo(number) {
    state.current = Math.max(0, Math.min(state.scene.steps.length, number));
    renderStep();
  }

  function stopPlay() {
    if (state.timer !== null) clearInterval(state.timer);
    state.timer = null;
    play.textContent = '自动播放';
  }

  function seek(number) {
    stopPlay();
    goTo(number);
  }

  function schedulePlayback() {
    state.timer = setInterval(() => {
      const nextStep = state.current + 1;
      if (nextStep === state.scene.steps.length) stopPlay();
      goTo(nextStep);
    }, 3400 / state.speed);
  }

  function togglePlay() {
    if (state.timer !== null) {
      stopPlay();
      return;
    }

    schedulePlayback();
    play.textContent = '暂停';
    if (state.current === state.scene.steps.length) goTo(1);
    else if (state.current === 0) goTo(1);
  }

  function initControls() {
    prev.addEventListener('click', () => seek(state.current - 1));
    next.addEventListener('click', () => seek(state.current + 1));
    byId('btn-reset').addEventListener('click', () => {
      seek(0);
      next.focus();
    });
    play.addEventListener('click', togglePlay);
    speed.addEventListener('click', () => {
      state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 0.5 : 1;
      speed.textContent = state.speed + '×';
      speed.setAttribute('aria-label', '播放速度 ' + state.speed + ' 倍，点击切换');
      if (state.timer !== null) {
        clearInterval(state.timer);
        schedulePlayback();
      }
    });

    viewButtons.forEach((button) => {
      button.addEventListener('click', () => {
        state.view = button.dataset.view;
        drawCanvas();
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Escape' && inspector.open) {
        inspector.open = false;
        inspectorSummary.focus();
        return;
      }
      if (event.target.closest('input, textarea, select, [contenteditable], [tabindex="0"]')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        seek(state.current + (event.key === 'ArrowRight' ? 1 : -1));
      } else if (event.key === ' ' && !event.target.closest('button, summary, a')) {
        event.preventDefault();
        togglePlay();
      }
    });
  }

  if (!state.scene) return;
  initTheme();
  initBackLink();
  initControls();
  renderScene();
  renderCatalog();
  renderStep();
  byId('lab-player').hidden = false;
})();
