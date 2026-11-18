/* 根据场景的参与者与步骤绘制可点选的时序图。 */
(function () {
  'use strict';

  const namespace = 'http://www.w3.org/2000/svg';

  function add(parent, name, attrs, text) {
    const node = document.createElementNS(namespace, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text) node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function render(svg, scene, current, onPick) {
    const actors = scene.sequenceActors;
    const width = Math.max(584, actors.length * 105 + 104);
    const rowHeight = 54;
    const height = 62 + rowHeight * scene.steps.length;
    const laneWidth = (width - 98) / actors.length;
    const columns = new Map();
    svg.replaceChildren();
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    const currentTitle = scene.steps[current - 1]?.title;
    add(svg, 'title', { id: 'diagram-title' }, '执行时序图' + (currentTitle ? ' · ' + currentTitle : ''));

    const defs = add(svg, 'defs', {});
    ['regular', 'current'].forEach((type) => {
      const marker = add(defs, 'marker', {
        id: 'seq-arrow-' + type, viewBox: '0 0 10 10', refX: 9, refY: 5,
        markerWidth: 6, markerHeight: 6, orient: 'auto'
      });
      add(marker, 'path', { d: 'M 0 0 L 10 5 L 0 10 Z', class: 'seq-marker ' + type });
    });

    scene.steps.forEach((step, index) => {
      const rowTop = 55 + rowHeight * index;
      add(svg, 'rect', {
        x: 3, y: rowTop, width: width - 6, height: rowHeight, rx: 5,
        class: 'sequence-row' + (step.no === current ? ' current' : '')
      });
    });

    actors.forEach((actor, index) => {
      const x = 91 + (index + 0.5) * laneWidth;
      actor.objects.forEach((id) => columns.set(id, x));
      add(svg, 'rect', {
        x: x - 48, y: 8, width: 96, height: 30, rx: 6, class: 'sequence-actor'
      });
      add(svg, 'text', { x, y: 27, 'text-anchor': 'middle', class: 'sequence-label' }, actor.label);
      add(svg, 'line', { x1: x, y1: 42, x2: x, y2: height - 8, class: 'sequence-lifeline' });
    });

    scene.steps.forEach((step, index) => {
      const y = 82 + rowHeight * index;
      const active = step.no === current;
      const row = add(svg, 'g', { class: 'sequence-interactive' + (active ? ' current' : '') });
      add(row, 'rect', { x: 3, y: y - 26, width: width - 6, height: rowHeight, fill: 'transparent' });
      add(row, 'title', {}, '第 ' + step.no + ' 步 · ' + step.title);
      add(row, 'text', { x: 16, y: y - 1, class: 'sequence-label' }, '第 ' + step.no + ' 步');
      add(row, 'text', { x: 16, y: y + 14, class: 'sequence-time' }, step.time);
      row.addEventListener('click', () => onPick(step.no));

      const crossActor = step.links.filter((link) => columns.get(link.from) !== columns.get(link.to));
      if (!crossActor.length) {
        const x = columns.get(step.highlight[0]);
        add(row, 'rect', { x: x - 74, y: y - 14, width: 148, height: 28, rx: 5, class: 'sequence-actor' });
        add(row, 'text', { x, y: y + 4, 'text-anchor': 'middle', class: 'sequence-label' }, step.title);
        return;
      }

      crossActor.forEach((link, order) => {
        const from = columns.get(link.from);
        const to = columns.get(link.to);
        const baseline = y + 6 + (order - (crossActor.length - 1) / 2) * 20;
        add(row, 'line', {
          x1: from, x2: to + (from < to ? -6 : 6), y1: baseline, y2: baseline,
          class: 'sequence-message', 'marker-end': 'url(#seq-arrow-' + (active ? 'current' : 'regular') + ')'
        });
        add(row, 'text', {
          x: (from + to) / 2, y: baseline - 5, 'text-anchor': 'middle', class: 'sequence-label'
        }, link.label);
      });
    });
  }

  window.SequenceView = { render };
})();
