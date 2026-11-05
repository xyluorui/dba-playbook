/* 根据场景的层、对象和当前步骤绘制拓扑。 */
(function () {
  'use strict';

  const namespace = 'http://www.w3.org/2000/svg';
  const width = 496;
  const heightPerLayer = 78;
  const nodeWidth = 116;
  const nodeHeight = 35;

  function add(parent, name, attrs, text) {
    const node = document.createElementNS(namespace, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text) node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function arrowPath(from, to) {
    if (from.y === to.y) {
      const forwards = from.x < to.x;
      const start = from.x + (forwards ? nodeWidth : 0);
      const end = to.x + (forwards ? -5 : nodeWidth + 5);
      return 'M ' + start + ' ' + (from.y + nodeHeight / 2) + ' H ' + end;
    }

    const down = from.y < to.y;
    const startY = from.y + (down ? nodeHeight : 0);
    const endY = to.y + (down ? -5 : nodeHeight + 5);
    const middleY = (startY + endY) / 2;
    return 'M ' + (from.x + nodeWidth / 2) + ' ' + startY +
      ' V ' + middleY + ' H ' + (to.x + nodeWidth / 2) + ' V ' + endY;
  }

  function render(svg, scene, current) {
    const step = scene.steps[current - 1];
    const highlighted = new Set(step?.highlight);
    const positions = new Map();
    svg.replaceChildren();
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + (scene.layers.length * heightPerLayer + 8));
    add(svg, 'title', { id: 'diagram-title' }, '执行路径拓扑' + (step ? ' · ' + step.title : ' · 准备开始'));

    const defs = add(svg, 'defs', {});
    const marker = add(defs, 'marker', {
      id: 'path-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto'
    });
    add(marker, 'path', { d: 'M 0 0 L 10 5 L 0 10 Z', class: 'diagram-arrow' });

    scene.layers.forEach((layer, index) => {
      const objects = scene.objects.filter((object) => object.layer === layer.id);
      const y = 8 + index * heightPerLayer;
      const active = objects.some((object) => highlighted.has(object.id));
      add(svg, 'rect', {
        x: 5, y, width: width - 10, height: 63, rx: 9, class: 'diagram-lane' + (active ? ' active' : '')
      });
      add(svg, 'circle', { cx: 24, cy: y + 31.5, r: 4, class: 'layer-dot ' + layer.color });
      add(svg, 'text', { x: 34, y: y + 36, class: 'diagram-layer' }, layer.name);

      const availableWidth = width - 106;
      const stride = availableWidth / objects.length;
      objects.forEach((object, order) => {
        positions.set(object.id, {
          x: 99 + (order + 0.5) * stride - nodeWidth / 2,
          y: y + (63 - nodeHeight) / 2,
          label: object.label
        });
      });
    });

    step?.links.forEach((link) => {
      const from = positions.get(link.from);
      const to = positions.get(link.to);
      if (!from || !to) return;
      const path = add(svg, 'path', {
        d: arrowPath(from, to), class: 'diagram-path', 'marker-end': 'url(#path-arrow)'
      });
      add(path, 'title', {}, link.label);
    });

    positions.forEach(({ x, y, label }, id) => {
      const node = add(svg, 'g', { class: 'diagram-node' + (highlighted.has(id) ? ' active' : '') });
      add(node, 'rect', { x, y, width: nodeWidth, height: nodeHeight, rx: 7 });
      add(node, 'text', { x: x + nodeWidth / 2, y: y + 22.5, 'text-anchor': 'middle' }, label);
    });
  }

  window.TopologyView = { render };
})();
