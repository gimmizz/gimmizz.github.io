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

  // ---------- Mermaid (구조도/다이어그램) ----------
  loadScript('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js')
    .then(() => {
      if (!window.mermaid) return;
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          primaryColor: '#fff8e1',
          primaryTextColor: '#1f2328',
          primaryBorderColor: '#cf222e',
          lineColor: '#57606a',
          fontFamily: 'inherit',
        },
        flowchart: { htmlLabels: true, curve: 'basis' },
      });
      window.mermaid.run({ querySelector: '.mermaid' });
    })
    .catch((e) => console.warn('Mermaid load failed:', e));
})();
