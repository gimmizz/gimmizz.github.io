/**
 * 공통 사이드바 + Mermaid 다이어그램 + Prism 신택스 하이라이팅 로더.
 *
 * 페이지에 다음을 두면 자동 동작.
 *   <aside class="sidebar" data-active="introduction" data-base="./"></aside>
 *
 *  - data-active: 활성화할 링크의 data-key 값
 *  - data-base:   현재 페이지에서 starrocks 루트까지의 상대 경로
 *                 (루트면 "./", catalogs/ 또는 practice/ 하위면 "../")
 *
 * Mermaid 다이어그램:
 *   <pre class="mermaid">graph LR ...</pre>   또는   <div class="mermaid">...</div>
 *
 * Prism 코드 하이라이팅: <pre><code class="language-sql">SELECT ...</code></pre>
 */
(function () {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // ---------- 사이드바 접기/펼치기 ----------
  const layout = document.querySelector('.layout');
  const COLLAPSE_KEY = 'sr-sb-collapsed';

  function applyCollapsed(collapsed) {
    if (!layout) return;
    layout.classList.toggle('sb-collapsed', collapsed);
    const btn = document.getElementById('sb-toggle');
    if (btn) {
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      btn.title = collapsed ? '사이드바 펼치기' : '사이드바 접기';
    }
  }
  // 초기 상태 (FOUC 방지를 위해 즉시 적용)
  applyCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');

  // 토글 버튼은 스크립트로 동적 생성 (모든 페이지 공통)
  const toggle = document.createElement('button');
  toggle.id = 'sb-toggle';
  toggle.className = 'sidebar-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', '사이드바 토글');
  toggle.innerHTML = '<span class="sb-icon"></span>';
  toggle.addEventListener('click', () => {
    const next = !layout.classList.contains('sb-collapsed');
    applyCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
  });
  document.body.appendChild(toggle);
  // 단축키: [ 로 토글
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '[') {
      e.preventDefault();
      toggle.click();
    }
  });

  const base = sidebar.dataset.base || './';
  const activeKey = sidebar.dataset.active || '';
  const url = base + 'assets/sidebar.html';

  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('sidebar fetch failed: ' + r.status);
      return r.text();
    })
    .then((html) => {
      sidebar.innerHTML = html.replace(/\{BASE\}/g, base);
      if (activeKey) {
        const link = sidebar.querySelector(`nav a[data-key="${activeKey}"]`);
        if (link) link.classList.add('active');
      }
    })
    .catch((err) => {
      console.error(err);
      sidebar.innerHTML =
        '<p style="padding:20px;color:#cf222e;">사이드바를 로드할 수 없습니다. ' +
        '로컬에서 보는 경우 <code>python3 -m http.server</code> 등으로 ' +
        '간이 서버를 띄워 주세요.</p>';
    });

  // 헤더 앵커 + 코드 복사 버튼 + 페이지 우측 ToC 자동 부여
  document.addEventListener('DOMContentLoaded', () => {
    // 1) 헤더 앵커
    const headers = document.querySelectorAll(
      '.content h2[id], .content h3[id], .content h4[id]'
    );
    headers.forEach((h) => {
      const a = document.createElement('a');
      a.className = 'anchor-link';
      a.href = '#' + h.id;
      a.textContent = '#';
      h.appendChild(a);
    });

    // 2) 코드 블록 복사 버튼
    document.querySelectorAll('.content pre').forEach((pre) => {
      const wrap = document.createElement('div');
      wrap.className = 'code-wrap';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'copy';
      btn.addEventListener('click', () => {
        const code = pre.querySelector('code') || pre;
        navigator.clipboard.writeText(code.innerText).then(() => {
          btn.textContent = 'copied!';
          setTimeout(() => (btn.textContent = 'copy'), 1500);
        });
      });
      wrap.appendChild(btn);
    });

    // 3) 페이지 우측 ToC (h2[id] 모음)
    const h2s = document.querySelectorAll('.content h2[id]');
    if (h2s.length >= 3) {
      const toc = document.createElement('aside');
      toc.className = 'page-toc';
      const title = document.createElement('p');
      title.className = 'page-toc-title';
      title.textContent = '이 페이지';
      toc.appendChild(title);
      const ul = document.createElement('ul');
      h2s.forEach((h) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.childNodes[0].textContent.trim();
        li.appendChild(a);
        ul.appendChild(li);
      });
      toc.appendChild(ul);
      const layout = document.querySelector('.layout');
      if (layout) layout.appendChild(toc);
    }
  });

  // ---------- Prism (코드 신택스 하이라이팅) ----------
  function injectStyle(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
  injectStyle('https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css');

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('failed: ' + src));
      document.head.appendChild(s);
    });
  }

  loadScript('https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js')
    .then(() => loadScript('https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js'))
    .then(() => {
      if (window.Prism && window.Prism.plugins && window.Prism.plugins.autoloader) {
        window.Prism.plugins.autoloader.languages_path =
          'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/';
      }
      // <pre><code> 안에 클래스 없는 블록도 sql로 추정 (StarRocks 문서니까)
      document.querySelectorAll('pre > code').forEach((c) => {
        if (![...c.classList].some((cl) => cl.startsWith('language-'))) {
          c.classList.add('language-sql');
        }
      });
      if (window.Prism) window.Prism.highlightAll();
    })
    .catch((e) => console.warn('Prism load failed:', e));

  // ---------- 사이드바 검색 ----------
  let searchIndex = null;
  function ensureSearchIndex() {
    if (searchIndex) return Promise.resolve(searchIndex);
    return fetch(base + 'assets/search-index.json')
      .then((r) => r.json())
      .then((data) => (searchIndex = data));
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function highlight(text, qs) {
    let out = escapeHtml(text);
    qs.forEach((q) => {
      if (!q) return;
      const re = new RegExp('(' + q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + ')', 'gi');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  function snippet(text, qs, len = 80) {
    if (!text) return '';
    const lower = text.toLowerCase();
    let idx = -1;
    for (const q of qs) {
      if (!q) continue;
      const i = lower.indexOf(q.toLowerCase());
      if (i >= 0 && (idx < 0 || i < idx)) idx = i;
    }
    if (idx < 0) return text.slice(0, len) + (text.length > len ? '…' : '');
    const start = Math.max(0, idx - 20);
    const end = Math.min(text.length, idx + 60);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  function search(query) {
    const qs = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!qs.length) return [];
    const out = [];
    for (const item of searchIndex) {
      const titleL = (item.title || '').toLowerCase();
      const h1L = (item.h1 || '').toLowerCase();
      const sectionL = (item.section || '').toLowerCase();
      const textL = (item.text || '').toLowerCase();
      const headings = item.headings || [];

      let score = 0;
      let headingHit = null;
      for (const q of qs) {
        if (titleL.includes(q)) score += 10;
        if (h1L.includes(q)) score += 8;
        if (sectionL.includes(q)) score += 4;
        for (const h of headings) {
          if (h.label.toLowerCase().includes(q)) {
            score += 6;
            if (!headingHit) headingHit = h;
          }
        }
        if (textL.includes(q)) score += 1;
      }
      if (score > 0) out.push({ item, score, headingHit });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 20);
  }

  function renderResults(query, hits, container) {
    const qs = query.toLowerCase().split(/\s+/).filter(Boolean);
    container.innerHTML = '';
    if (!hits.length) {
      const li = document.createElement('li');
      li.className = 'search-empty';
      li.textContent = '결과 없음';
      container.appendChild(li);
      return;
    }
    for (const h of hits) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      const url = base + h.item.url + (h.headingHit ? '#' + h.headingHit.id : '');
      a.href = url;
      const title = h.item.title || h.item.h1 || h.item.url;
      const sub = h.headingHit ? h.headingHit.label : (h.item.section || '');
      const snip = snippet(h.item.text, qs);
      a.innerHTML =
        '<div class="r-title">' + highlight(title, qs) + '</div>' +
        (sub ? '<div class="r-sub">' + highlight(sub, qs) + '</div>' : '') +
        (snip ? '<div class="r-snip">' + highlight(snip, qs) + '</div>' : '');
      li.appendChild(a);
      container.appendChild(li);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const setupSearch = () => {
      const input = document.getElementById('sb-search');
      const results = document.getElementById('sb-search-results');
      if (!input || !results) return;

      let timer = null;
      input.addEventListener('input', () => {
        clearTimeout(timer);
        const q = input.value.trim();
        if (!q) {
          results.hidden = true;
          results.innerHTML = '';
          return;
        }
        timer = setTimeout(() => {
          ensureSearchIndex().then(() => {
            const hits = search(q);
            renderResults(q, hits, results);
            results.hidden = false;
          });
        }, 120);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          input.value = '';
          results.hidden = true;
        }
      });
      // 외부 클릭 시 닫기
      document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !results.contains(e.target)) {
          results.hidden = true;
        }
      });
    };
    // sidebar fetch 결과로 search input이 들어오므로, 약간 지연 후 셋업.
    const tryInterval = setInterval(() => {
      if (document.getElementById('sb-search')) {
        clearInterval(tryInterval);
        setupSearch();
      }
    }, 50);
    setTimeout(() => clearInterval(tryInterval), 5000);
  });

  // ---------- Mermaid (구조도/다이어그램) ----------
  loadScript('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js')
    .then(() => {
      if (!window.mermaid) return;
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#f3f4f6',           // gray-100
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#4f46e5',     // indigo-600 (테두리만 액센트)
          lineColor: '#6b7280',              // gray-500
          secondaryColor: '#eef2ff',         // indigo-50
          tertiaryColor: '#fafafa',
          fontFamily: 'inherit',
          edgeLabelBackground: '#ffffff',
        },
        flowchart: { htmlLabels: true, curve: 'basis' },
      });
      window.mermaid.run({ querySelector: '.mermaid' });
    })
    .catch((e) => console.warn('Mermaid load failed:', e));
})();
