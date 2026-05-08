/* ══════════════════════════════════════
   State
══════════════════════════════════════ */
let curFilter = 'all';
let curSearch = '';

/* ══════════════════════════════════════
   Bootstrap: load data then render
══════════════════════════════════════ */
fetch('data.json')
  .then(r => r.json())
  .then(data => {
    render(data);
    bindEvents();
  })
  .catch(err => {
    document.getElementById('appRoot').innerHTML =
      `<p style="color:#ff5c5c;padding:20px;text-align:center">⚠️ تعذّر تحميل data.json: ${err.message}</p>`;
  });

/* ══════════════════════════════════════
   Render
══════════════════════════════════════ */
function render(data) {
  const root = document.getElementById('appRoot');
  root.innerHTML = '';

  data.sections.forEach(sec => {
    const wrap = document.createElement('div');
    wrap.className = 'sec-wrap';
    wrap.dataset.sec = sec.id;

    wrap.innerHTML = `
      <div class="section-title">${sec.title}</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>اسم اللزقة (المخزون)</th>
              <th>الموديلات المتوافقة</th>
              <th>ملاحظات فنية</th>
              <th>حجم الشاشة</th>
            </tr>
          </thead>
          <tbody id="tb_${sec.id}"></tbody>
        </table>
      </div>`;

    root.appendChild(wrap);

    const tb = wrap.querySelector(`#tb_${sec.id}`);
    sec.rows.forEach((row, ri) => {
      const tr = document.createElement('tr');
      tr.dataset.id   = `${sec.id}_${ri}`;
      tr.dataset.cats = row.cats.join(' ');
      tr.dataset.raw  = [row.label, row.models.map(m => m.n).join(' '), row.size]
                          .join(' ')
                          .toLowerCase();

      tr.innerHTML = `
        <td>
          <div class="label-pill"
               style="background:${row.dot}18; border:1px solid ${row.dot}38">
            <span class="dot" style="background:${row.dot}"></span>
            ${row.label}
          </div>
        </td>
        <td>
          <div class="chips">
            ${row.models.map(m =>
              `<span class="chip${m.nw ? ' new' : ''}">${m.n}${m.nw ? ' ✦' : ''}</span>`
            ).join('')}
          </div>
        </td>
        <td class="note-cell">${row.note}</td>
        <td><span class="size-badge">${row.size}</span></td>`;

      tb.appendChild(tr);
    });
  });

  applyFilters();
}

/* ══════════════════════════════════════
   Filter + Search
══════════════════════════════════════ */
function applyFilters() {
  const q = curSearch.toLowerCase().trim();
  let total = 0, vis = 0;

  document.querySelectorAll('#appRoot tbody tr').forEach(tr => {
    total++;
    const cats = tr.dataset.cats || '';
    const raw  = (tr.dataset.raw || '') + ' ' + tr.innerText.toLowerCase();
    const ok   = (curFilter === 'all' || cats.includes(curFilter))
              && (!q || raw.includes(q));

    tr.classList.toggle('hidden', !ok);

    if (ok) {
      vis++;
      q ? hlRow(tr, q) : clrHL(tr);
    } else {
      clrHL(tr);
    }
  });

  // hide sections with zero visible rows
  document.querySelectorAll('.sec-wrap').forEach(sw => {
    const any = sw.querySelectorAll('tbody tr:not(.hidden)').length;
    sw.style.display = any ? '' : 'none';
  });

  // result counter
  document.getElementById('resultCount').innerHTML =
    q ? `عرض <span>${vis}</span> من ${total} صف` : '';

  // no-results message
  const nr = document.getElementById('noResults');
  nr.style.display = vis === 0 ? 'block' : 'none';
  document.getElementById('nrQ').textContent = q;
}

/* ══════════════════════════════════════
   Search Highlight
══════════════════════════════════════ */
function hlRow(row, q) {
  clrHL(row);
  const tw = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (tw.nextNode()) nodes.push(tw.currentNode);

  nodes.forEach(n => {
    const i = n.textContent.toLowerCase().indexOf(q);
    if (i < 0) return;
    const sp = document.createElement('span');
    sp.innerHTML =
      esc(n.textContent.slice(0, i)) +
      `<mark class="hl">${esc(n.textContent.slice(i, i + q.length))}</mark>` +
      esc(n.textContent.slice(i + q.length));
    n.parentNode.replaceChild(sp, n);
  });
}

function clrHL(row) {
  row.querySelectorAll('mark.hl').forEach(m =>
    m.replaceWith(document.createTextNode(m.textContent))
  );
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ══════════════════════════════════════
   Event Binding
══════════════════════════════════════ */
function bindEvents() {
  document.getElementById('searchInput').addEventListener('input', function () {
    curSearch = this.value;
    document.getElementById('clearBtn').style.display = this.value ? 'block' : 'none';
    applyFilters();
  });
}

/* ══════════════════════════════════════
   Public helpers (called from HTML)
══════════════════════════════════════ */
function clearSearch() {
  const inp = document.getElementById('searchInput');
  inp.value = '';
  curSearch = '';
  document.getElementById('clearBtn').style.display = 'none';
  applyFilters();
  inp.focus();
}

function setFilter(f, btn) {
  curFilter = f;
  document.querySelectorAll('.fb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
}

/* ══════════════════════════════════════
   Theme Toggle
══════════════════════════════════════ */
(function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
})();

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (!icon) return;
  if (theme === 'light') {
    icon.textContent  = '🌙';
    label.textContent = 'داكن';
  } else {
    icon.textContent  = '☀️';
    label.textContent = 'فاتح';
  }
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}