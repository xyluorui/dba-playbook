/* 检查器展示场景提供的字段和示例片段。 */
(function () {
  'use strict';

  function append(parent, tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    parent.appendChild(element);
    return element;
  }

  function render(container, inspector) {
    container.replaceChildren();
    if (!inspector) return;

    if (inspector.fields.length) {
      const list = append(container, 'dl', '', 'inspector-fields');
      inspector.fields.forEach((field) => {
        append(list, 'dt', field.name);
        const value = append(list, 'dd', field.value);
        if (field.note) append(value, 'small', field.note);
      });
    }

    if (inspector.struct) {
      const title = append(container, 'h4', inspector.struct.title);
      append(title, 'span', '示例', 'badge');
      const pre = append(container, 'pre', '');
      append(pre, 'code', inspector.struct.text);
    }
  }

  window.Inspector = { render };
})();
