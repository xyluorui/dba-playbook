(() => {
  const root = document.documentElement;

  if (root.classList.contains('has-breadcrumbs')) {
    const header = document.querySelector('.site-header');
    const syncStickyHeight = () => {
      root.style.setProperty('--site-sticky-height', `${header.getBoundingClientRect().height}px`);
    };
    syncStickyHeight();
    if ('ResizeObserver' in window) new ResizeObserver(syncStickyHeight).observe(header);
  }

  function filterTopicList(list, matches, includeAll = false) {
    let found = false;
    for (const item of list.children) {
      const entry = item.firstElementChild;
      const isBranch = entry instanceof HTMLDetailsElement;
      const label = isBranch ? entry.querySelector('summary') : entry;
      const matchesTitle = includeAll || matches(label.textContent);
      const matchesChild = isBranch && filterTopicList(entry.querySelector(':scope > ul'), matches, matchesTitle);

      item.hidden = !matchesTitle && !matchesChild;
      if (isBranch) entry.open = !item.hidden;
      found ||= !item.hidden;
    }
    return found;
  }

  function setupTopicDirectory() {
    const controls = document.querySelector('[data-topic-filter]');
    if (!controls) return;
    const sidebar = controls.closest('.topic-sidebar');
    const nav = sidebar.querySelector('.topic-nav');
    const tree = nav.querySelector('.topic-links');
    if (!tree) return;

    const field = controls.querySelector('input');
    const message = nav.querySelector('[data-topic-status]');
    const branches = [...tree.querySelectorAll('details[data-topic-path]')];
    const defaultOpen = branches.map((branch) => branch.open);
    const branchStorageKey = 'dba-playbook-expanded-topics';
    const normalize = (text) => text.normalize('NFKC').toLowerCase();
    let unfiltered;

    function readExpandedTopics() {
      try {
        const saved = JSON.parse(sessionStorage.getItem(branchStorageKey));
        if (Array.isArray(saved)) return new Set(saved);
      } catch {}
      return new Set();
    }

    function restoreExpandedTopics() {
      const expanded = readExpandedTopics();
      branches.forEach((branch, index) => {
        const open = defaultOpen[index] || expanded.has(branch.dataset.topicPath);
        if (unfiltered) unfiltered.open[index] = open;
        else branch.open = open;
      });
    }

    function rememberExpandedTopics() {
      const expanded = readExpandedTopics();
      branches.forEach((branch, index) => {
        const path = branch.dataset.topicPath;
        // Search results open branches temporarily.
        if (unfiltered?.open[index] ?? branch.open) expanded.add(path);
        else expanded.delete(path);
      });
      try {
        sessionStorage.setItem(branchStorageKey, JSON.stringify([...expanded]));
      } catch {}
    }

    if (branches.length) {
      restoreExpandedTopics();
      window.addEventListener('pagehide', rememberExpandedTopics);
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) restoreExpandedTopics();
      });
    }

    function update() {
      const query = normalize(field.value).trim();
      if (!query) {
        if (!unfiltered) return;
        for (const item of tree.querySelectorAll('li[hidden]')) item.hidden = false;
        branches.forEach((branch, index) => { branch.open = unfiltered.open[index]; });
        message.textContent = '';
        nav.scrollTop = unfiltered.scrollTop;
        unfiltered = undefined;
        return;
      }

      unfiltered ??= { open: branches.map((branch) => branch.open), scrollTop: nav.scrollTop };
      const terms = query.split(/\s+/);
      const found = filterTopicList(tree, (text) => {
        const title = normalize(text);
        return terms.every((term) => title.includes(term));
      });
      message.textContent = found ? '' : '没有匹配的章节或文章。';
      nav.scrollTop = 0;
    }

    field.addEventListener('input', (event) => {
      if (!event.isComposing) update();
    });
    field.addEventListener('compositionend', update);
    field.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || event.isComposing || !field.value) return;
      event.preventDefault();
      field.value = '';
      update();
    });
    controls.hidden = false;
    update();
  }

  setupTopicDirectory();

  const themeToggle = document.querySelector('[data-theme-toggle]');
  const themeKey = 'dba-playbook-theme';

  function syncTheme() {
    const light = root.dataset.theme === 'light';
    themeToggle.setAttribute('aria-pressed', String(light));
    themeToggle.setAttribute('title', light ? '切换深色主题' : '切换浅色主题');
  }

  syncTheme();
  themeToggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(themeKey, root.dataset.theme); } catch {}
    syncTheme();
  });

  const dialog = document.querySelector('[data-search-dialog]');
  const input = dialog.querySelector('[data-search-input]');
  const status = dialog.querySelector('[data-search-status]');
  const results = dialog.querySelector('[data-search-results]');
  const moduleUrl = new URL(dialog.dataset.pagefindModule, document.baseURI);
  const siteRoot = new URL('../', moduleUrl);
  let pagefind;
  let debounce;
  let revision = 0;
  let opener;

  function loadIndex() {
    pagefind ??= import(moduleUrl.href).then(async (index) => {
      await index.options({ baseUrl: siteRoot.pathname });
      await index.init();
      return index;
    }).catch((error) => {
      pagefind = undefined;
      throw error;
    });
    return pagefind;
  }

  function addExcerpt(excerpt, text) {
    const parsed = new DOMParser().parseFromString(text, 'text/html');
    for (const node of parsed.body.childNodes) {
      if (node.nodeName === 'MARK') {
        const mark = document.createElement('mark');
        mark.textContent = node.textContent;
        excerpt.append(mark);
      } else {
        excerpt.append(node.textContent ?? '');
      }
    }
  }

  function resultItem(result) {
    const url = new URL(result.url, siteRoot);
    if (url.origin !== siteRoot.origin || !url.pathname.startsWith(siteRoot.pathname)) return null;

    const link = document.createElement('a');
    link.href = url.href;
    const title = document.createElement('strong');
    title.textContent = result.meta.title || result.url;
    link.append(title);
    const tag = result.meta.database || result.meta.section;
    if (tag) {
      const category = document.createElement('small');
      category.textContent = tag;
      link.append(category);
    }
    if (result.excerpt) {
      const excerpt = document.createElement('p');
      addExcerpt(excerpt, result.excerpt);
      link.append(excerpt);
    }
    const item = document.createElement('li');
    item.append(link);
    return item;
  }

  async function search(term, current) {
    try {
      const index = await loadIndex();
      const match = await index.search(term);
      if (current !== revision) return;
      const entries = await Promise.all(match.results.slice(0, 12).map((item) => item.data()));
      if (current !== revision) return;
      results.replaceChildren(...entries.map(resultItem).filter(Boolean));
      status.textContent = match.results.length
        ? `找到 ${match.results.length} 个结果${match.results.length > entries.length ? '，请添加关键词缩小范围' : ''}`
        : '没有匹配结果。可以试试更短的关键词或英文术语。';
    } catch {
      if (current !== revision) return;
      status.textContent = '搜索索引暂时不可用。若正在本地开发，请先构建站点，再打开构建预览。';
    }
  }

  function scheduleSearch() {
    const current = ++revision;
    const term = input.value.trim();
    clearTimeout(debounce);
    results.replaceChildren();
    status.textContent = term ? '正在搜索…' : '输入关键词搜索文章、实验与实战内容。';
    if (term) debounce = setTimeout(() => search(term, current), 140);
  }

  function openSearch(source, term) {
    if (!dialog.open) {
      opener = source;
      dialog.showModal();
    }
    if (term !== undefined) {
      input.value = term;
      scheduleSearch();
    }
    input.focus();
    input.select();
    loadIndex().catch(() => {});
  }

  for (const button of document.querySelectorAll('[data-open-search]')) {
    button.addEventListener('click', () => openSearch(button, button.dataset.searchTerm));
  }
  for (const form of document.querySelectorAll('[data-search-form]')) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const field = form.querySelector('input');
      openSearch(field, field.value);
    });
  }
  input.addEventListener('input', (event) => {
    if (!event.isComposing) scheduleSearch();
  });
  input.addEventListener('compositionend', scheduleSearch);
  dialog.addEventListener('close', () => opener?.focus());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.addEventListener('keydown', (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
    event.preventDefault();
    openSearch(document.activeElement);
  });
})();
