/**
 * 공통 사이드바 로더.
 * 페이지에 다음을 두면 사이드바가 자동으로 주입된다.
 *
 *   <aside class="sidebar" data-active="introduction" data-base="./"></aside>
 *
 *  - data-active: 활성화할 링크의 data-key 값
 *  - data-base:   현재 페이지에서 starrocks 루트까지의 상대 경로
 *                 (루트면 "./", catalogs/ 하위면 "../")
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
      // 베이스 경로 치환
      sidebar.innerHTML = html.replace(/\{BASE\}/g, base);
      // 활성 링크 표시
      if (activeKey) {
        const link = sidebar.querySelector(
          `nav a[data-key="${activeKey}"]`
        );
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

  // 헤더 앵커 링크 자동 부여
  document.addEventListener('DOMContentLoaded', () => {
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
  });
})();
