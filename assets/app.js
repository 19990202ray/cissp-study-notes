/* 共通の最小機能。本文はHTMLにあり、JavaScriptなしでも読める。 */
(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  let saved = null;
  try { saved = localStorage.getItem('cissp-study-theme'); } catch (_) { /* 保存不可でも閲覧は継続 */ }
  if (saved === 'dark' || saved === 'light') root.dataset.theme = saved;
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const updateThemeButton = () => {
    if (!themeButton) return;
    const dark = isDark();
    themeButton.textContent = dark ? '明るい表示' : '夜間表示';
    themeButton.setAttribute('aria-pressed', String(dark));
  };
  if (themeButton) {
    themeButton.hidden = false; updateThemeButton();
    themeButton.addEventListener('click', () => {
      root.dataset.theme = isDark() ? 'light' : 'dark';
      try { localStorage.setItem('cissp-study-theme', root.dataset.theme); } catch (_) {}
      updateThemeButton();
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButton);
  }
  const article = document.querySelector('.article');
  if (!article) return;

  // 実際の本文から各見出しの内容を作る。検索用の別正本や外部通信は不要。
  let current = {id:'top', title:article.querySelector('h1')?.textContent || '概要', text:''};
  const sections = [current];
  for (const element of article.children) {
    if (element.matches('h2,h3')) {
      current = {id:element.id, title:element.textContent, text:''};
      sections.push(current);
    } else if (current) current.text += ' ' + element.textContent;
  }
  const normalize = s => s.normalize('NFKC').toLocaleLowerCase();
  for (const section of sections) section.index = normalize(section.title + ' ' + section.text);
  const box = document.querySelector('.search-box');
  const input = document.getElementById('page-search');
  const results = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  const runSearch = () => {
    const query = normalize(input.value.trim());
    results.replaceChildren();
    if (!query) { results.hidden = true; status.textContent = '語句で節を探せます。本文は折りたたまず全文表示します。'; return; }
    const words = query.split(/\s+/).filter(Boolean);
    const matches = sections.filter(s => words.every(w => s.index.includes(w)));
    status.textContent = `${matches.length}節が該当${matches.length > 50 ? '（先頭50件を表示）' : ''}`;
    results.hidden = matches.length === 0;
    for (const match of matches.slice(0,50)) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + match.id; a.textContent = match.title;
      const p = document.createElement('p');
      const offset = Math.max(0, normalize(match.text).indexOf(words[0]) - 35);
      p.textContent = (offset ? '…' : '') + match.text.slice(offset, offset + 125).trim() + '…';
      li.append(a,p); results.append(li);
    }
  };
  if (box && input && results && status) {
    box.hidden = false; runSearch();
    let timer;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(runSearch, 120); });
    input.addEventListener('keydown', event => { if (event.key === 'Escape') { input.value = ''; runSearch(); } });
    document.getElementById('search-clear').addEventListener('click', () => { input.value = ''; runSearch(); input.focus(); });
  }
  document.querySelectorAll('.mobile-toc a').forEach(a => a.addEventListener('click', () => { a.closest('details').open = false; }));
  // リンク先へフォーカスも移し、キーボード利用時の読み進めを支える。
  document.addEventListener('click', event => {
    const a = event.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.getElementById(a.hash.slice(1));
    if (target && target.hasAttribute('tabindex')) setTimeout(() => target.focus({preventScroll:true}), 0);
  });
  const chapters = [...article.querySelectorAll('h2[id]')];
  const links = [...document.querySelectorAll('.toc a[data-chapter]')];
  let scheduled = false;
  const updateChapter = () => {
    scheduled = false;
    let active = chapters[0]?.id;
    for (const h of chapters) { if (h.getBoundingClientRect().top <= 140) active = h.id; }
    for (const a of links) {
      const selected = a.getAttribute('href') === '#' + active;
      a.classList.toggle('current', selected);
      if (selected) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current');
    }
  };
  window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateChapter); } }, {passive:true});
  updateChapter();
})();
