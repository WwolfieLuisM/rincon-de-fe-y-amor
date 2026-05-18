let bibleIndex = [];
let currentBook = null;
let currentChapters = [];
let currentChapter = 0;
let currentVerses = [];
let searchTerm = '';
let bookCache = {};
let selectMode = false;
let selectedVerses = new Set();
let readMap = {};
let favSet = new Set();
let userId = null;
let spaceId = null;
let _isRendering = false;
let _searchRaf = null;

function showToast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

async function loadBibleIndex() {
  const res = await fetch('data/biblia/index.json');
  bibleIndex = await res.json();
}

async function loadReadProgress() {
  const { data } = await window.supabase
    .from('reading_progress')
    .select('book_key, chapter')
    .eq('space_id', spaceId)
    .eq('user_id', userId);
  readMap = {};
  if (data) {
    data.forEach(r => {
      const k = r.book_key + ':' + r.chapter;
      readMap[k] = true;
    });
  }
}

async function loadFavorites() {
  const { data } = await window.supabase
    .from('bible_favorites')
    .select('book_key, chapter, verse')
    .eq('space_id', spaceId)
    .eq('user_id', userId);
  favSet = new Set();
  if (data) {
    data.forEach(f => {
      favSet.add(f.book_key + ':' + f.chapter + ':' + f.verse);
    });
  }
}

function getBookTitle(book) {
  return book.shortTitle || book.title || book.key;
}

function getBookFullTitle(book) {
  return book.title || book.shortTitle || book.key;
}

async function loadBookChapters(key) {
  if (bookCache[key]) { currentChapters = bookCache[key]; return; }
  const res = await fetch('data/biblia/' + key + '.json');
  currentChapters = await res.json();
  bookCache[key] = currentChapters;
}

function getTotalRead(bookKey) {
  let count = 0;
  for (const k in readMap) {
    if (k.startsWith(bookKey + ':')) count++;
  }
  return count;
}

function goBackToWelcome() {
  currentBook = null;
  currentChapters = [];
  currentChapter = 0;
  currentVerses = [];
  searchTerm = '';
  if (selectMode) { selectMode = false; selectedVerses.clear(); }
  renderWelcome();
}

async function renderWelcome() {
  const totalBooks = bibleIndex.length;
  const totalRead = Object.keys(readMap).length;
  const totalChapters = bibleIndex.reduce((s, b) => s + b.chapters, 0);
  const pct = totalChapters > 0 ? Math.round(totalRead / totalChapters * 100) : 0;

  let html = '<div class="reader-card"><div class="welcome-msg">';
  html += '<div class="icon"><i class="ti ti-book"></i></div>';
  html += '<div class="title">La Palabra</div>';
  html += '<div class="sub">' + totalBooks + ' libros · ' + totalChapters + ' capítulos</div>';
  html += '<div style="margin-top:16px;font-size:13px;color:rgba(255,255,255,0.5)">' + totalRead + ' capítulos leídos (' + pct + '%)</div>';
  if (totalRead > 0) {
    html += '<div class="progress-bar-wrap" style="margin-top:8px"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>';
  }
  html += '</div>';

  html += '<div class="testament-tabs">';
  html += '<button class="active" id="tabAT">Antiguo Testamento</button>';
  html += '<button id="tabNT">Nuevo Testamento</button>';
  html += '<button id="tabFav">❤️ ' + favSet.size + '</button>';
  html += '</div>';

  html += '<div class="book-selector" id="bookSelector"><select id="bookSelect"><option value="">Selecciona un libro...</option></select></div>';
  html += '<div class="empty-select" id="emptySelect"><i class="ti ti-chevron-up" style="font-size:24px;display:block;margin-bottom:8px;opacity:0.3"></i> Selecciona un libro para comenzar</div>';
  html += '<div id="favList"></div>';
  html += '</div>';

  document.getElementById('app').innerHTML = html;

  document.getElementById('tabAT').addEventListener('click', () => { document.getElementById('favList').innerHTML = ''; document.getElementById('bookSelector').style.display = ''; document.getElementById('emptySelect').style.display = ''; popBooks('AT'); });
  document.getElementById('tabNT').addEventListener('click', () => { document.getElementById('favList').innerHTML = ''; document.getElementById('bookSelector').style.display = ''; document.getElementById('emptySelect').style.display = ''; popBooks('NT'); });
  document.getElementById('tabFav').addEventListener('click', renderFavorites);
  document.getElementById('bookSelect').addEventListener('change', (e) => {
    if (e.target.value) onBookSelect(e.target.value);
  });

  popBooks('AT');
}

function popBooks(testament) {
  const tabAT = document.getElementById('tabAT');
  const tabNT = document.getElementById('tabNT');
  const tabFav = document.getElementById('tabFav');
  tabAT.classList.toggle('active', testament === 'AT');
  tabNT.classList.toggle('active', testament === 'NT');
  if (tabFav) tabFav.classList.remove('active');

  const sel = document.getElementById('bookSelect');
  if (sel) {
    const val = sel.value;
    sel.innerHTML = '<option value="">Selecciona un libro...</option>';
    const books = bibleIndex.filter(b => b.testament === (testament === 'AT' ? 'A.T.' : 'N.T.'));
    books.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.key;
      opt.textContent = getBookTitle(b);
      sel.appendChild(opt);
    });
    if (val && books.some(b => b.key === val)) sel.value = val;
  }
}

async function renderFavorites() {
  const tabAT = document.getElementById('tabAT');
  const tabNT = document.getElementById('tabNT');
  const tabFav = document.getElementById('tabFav');
  tabAT.classList.remove('active');
  tabNT.classList.remove('active');
  tabFav.classList.add('active');

  const selWrap = document.getElementById('bookSelector');
  const empty = document.getElementById('emptySelect');
  if (selWrap) selWrap.style.display = 'none';
  if (empty) empty.style.display = 'none';

  const { data } = await window.supabase
    .from('bible_favorites')
    .select('*')
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const list = document.getElementById('favList');
  if (!data || data.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:32px 0;color:rgba(255,255,255,0.3);font-size:14px">Aún no tienes versículos favoritos<br><span style="font-size:12px;color:rgba(255,255,255,0.2)">Toca el ❤️ junto a un versículo para guardarlo</span></div>';
    return;
  }

  let html = '';
  for (const f of data) {
    const book = bibleIndex.find(b => b.key === f.book_key);
    if (!book) continue;
    const ref = getBookTitle(book) + ' ' + f.chapter + ':' + f.verse;
    html += '<div class="verse" style="padding:10px 0;display:flex;align-items:flex-start;gap:8px">';
    html += '<div class="verse-text" style="flex:1;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.85);font-style:normal">' + f.text + '</div>';
    html += '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">';
    html += '<div style="color:var(--accent);font-size:12px">' + ref + '</div>';
    html += '<button class="verse-fav favorited fav-remove-btn" data-key="' + f.book_key + ':' + f.chapter + ':' + f.verse + '" style="background:none;border:none;color:#e8547a;cursor:pointer;font-size:16px;padding:2px 4px"><i class="ti ti-heart"></i></button>';
    html += '</div></div>';
  }
  list.innerHTML = html;
  list.querySelectorAll('.fav-remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const key = e.currentTarget.dataset.key;
      const [bk, ch, vs] = key.split(':');
      await window.supabase.from('bible_favorites').delete().eq('space_id', spaceId).eq('user_id', userId).eq('book_key', bk).eq('chapter', parseInt(ch)).eq('verse', parseInt(vs));
      favSet.delete(key);
      const tf = document.getElementById('tabFav');
      if (tf) tf.textContent = '❤️ ' + favSet.size;
      renderFavorites();
    });
  });
}

async function onBookSelect(key, goTo) {
  const book = bibleIndex.find(b => b.key === key);
  if (!book) return;
  currentBook = book;
  currentChapter = 0;
  if (selectMode) { selectMode = false; selectedVerses.clear(); }

  await loadBookChapters(key);

  const chapterCount = currentChapters.length;
  const readCount = getTotalRead(key);

  let html = '<div class="reader-card">';
  html += '<div class="chapter-title"><button class="back-btn" id="backBtn"><i class="ti ti-arrow-left"></i></button> ' + getBookFullTitle(book) + '</div>';
  html += '<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:' + (chapterCount > 0 ? Math.round(readCount / chapterCount * 100) : 0) + '%"></div></div>';
  html += '<div class="progress-text">' + readCount + ' de ' + chapterCount + ' capítulos leídos</div>';
  html += '<div class="chapter-nav">';
  html += '<button id="prevChapBtn" disabled><i class="ti ti-chevron-left"></i></button>';
  html += '<select id="chapterSelect">';
  for (let i = 0; i < chapterCount; i++) {
    const c = i + 1;
    const marked = readMap[key + ':' + c];
    html += '<option value="' + c + '">Capítulo ' + c + (marked ? ' ✓' : '') + '</option>';
  }
  html += '</select>';
  html += '<button id="nextChapBtn"' + (chapterCount <= 1 ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button>';
  html += '<button id="selectToggleBtn" class="select-toggle" title="Seleccionar versículos"><i class="ti ti-select"></i></button>';
  html += '</div>';
  html += '<div class="search-input-wrap"><input type="text" id="searchInput" placeholder="Buscar en este capítulo..."></div>';
  html += '<div class="search-count" id="searchCount"></div>';
  html += '<div id="versesContainer"></div>';
  html += '<button class="mark-read-btn" id="markReadBtn">Marcar como leído</button>';
  html += '</div>';

  document.getElementById('app').innerHTML = html;

  document.getElementById('backBtn')?.addEventListener('click', goBackToWelcome);
  document.getElementById('chapterSelect').addEventListener('change', (e) => {
    currentChapter = parseInt(e.target.value);
    searchTerm = '';
    const si = document.getElementById('searchInput');
    if (si) si.value = '';
    if (selectMode) { selectedVerses.clear(); updateSelectBar(); }
    renderChapter();
  });
  document.getElementById('prevChapBtn').addEventListener('click', () => {
    if (currentChapter > 1) { currentChapter--; searchTerm = ''; const si = document.getElementById('searchInput'); if (si) si.value = ''; if (selectMode) { selectedVerses.clear(); updateSelectBar(); } renderChapter(); }
  });
  document.getElementById('nextChapBtn').addEventListener('click', () => {
    if (currentChapter < currentChapters.length) { currentChapter++; searchTerm = ''; const si = document.getElementById('searchInput'); if (si) si.value = ''; if (selectMode) { selectedVerses.clear(); updateSelectBar(); } renderChapter(); }
  });
  document.getElementById('markReadBtn').addEventListener('click', toggleMarkRead);
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    if (_searchRaf) cancelAnimationFrame(_searchRaf);
    _searchRaf = requestAnimationFrame(() => {
      _searchRaf = null;
      renderChapter();
    });
  });
  document.getElementById('selectToggleBtn').addEventListener('click', toggleSelectMode);
  document.getElementById('copySelectedBtn').addEventListener('click', copySelected);
  document.getElementById('cancelSelectBtn').addEventListener('click', toggleSelectMode);

  currentChapter = goTo ? goTo.chapter : 1;
  renderChapter();
}

function renderChapter() {
  if (_isRendering) return;
  _isRendering = true;
  try {
    if (!currentBook || !currentChapters.length || !currentChapter) return;
    const idx = currentChapter - 1;
    const verses = currentChapters[idx];
    if (!verses) return;
    currentVerses = verses;

    const sel = document.getElementById('chapterSelect');
    const prevBtn = document.getElementById('prevChapBtn');
    const nextBtn = document.getElementById('nextChapBtn');
    if (sel) sel.value = currentChapter;
    if (prevBtn) prevBtn.disabled = currentChapter <= 1;
    if (nextBtn) nextBtn.disabled = currentChapter >= currentChapters.length;

    const key = currentBook.key + ':' + currentChapter;
    const isRead = !!readMap[key];
    const markBtn = document.getElementById('markReadBtn');
    if (markBtn) {
      markBtn.textContent = isRead ? '\u2713 Cap\u00edtulo le\u00eddo' : 'Marcar como le\u00eddo';
      markBtn.classList.toggle('done', isRead);
    }

    const filtered = searchTerm
      ? verses.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
      : verses;

    const countEl = document.getElementById('searchCount');
    if (countEl) {
      countEl.textContent = searchTerm
        ? filtered.length + ' de ' + verses.length + ' vers\u00edculos'
        : '';
    }

    const stBtn = document.getElementById('selectToggleBtn');
    if (stBtn) stBtn.classList.toggle('active', selectMode);

    const container = document.getElementById('versesContainer');
    if (container) {
      const fragment = document.createDocumentFragment();
      filtered.forEach((text, i) => {
        const vNum = searchTerm ? verses.indexOf(text) + 1 : i + 1;
        const key2 = currentBook.key + ':' + currentChapter + ':' + vNum;
        const isFav = favSet.has(key2);
        const isSelected = selectedVerses.has(key2);

        const div = document.createElement('div');
        div.className = 'verse' + (isSelected ? ' selected' : '');
        div.dataset.vkey = key2;

        if (selectMode) {
          const cb = document.createElement('div');
          cb.className = 'verse-cb';
          cb.innerHTML = isSelected ? '<i class="ti ti-checkbox"></i>' : '<i class="ti ti-square"></i>';
          div.appendChild(cb);
        }

        const num = document.createElement('div');
        num.className = 'verse-num';
        num.textContent = vNum;
        div.appendChild(num);

        const txt = document.createElement('div');
        txt.className = 'verse-text';
        txt.textContent = text;
        div.appendChild(txt);

        if (!selectMode) {
          const fav = document.createElement('button');
          fav.className = 'verse-fav' + (isFav ? ' favorited' : '');
          fav.dataset.key = key2;
          fav.dataset.verse = vNum;
          fav.dataset.text = text;
          fav.innerHTML = '<i class="ti ti-heart"></i>';
          fav.addEventListener('click', toggleFav);
          div.appendChild(fav);
        }

        fragment.appendChild(div);
      });

      container.innerHTML = '';
      container.appendChild(fragment);
    }
  } finally {
    _isRendering = false;
  }
}

function toggleVerseSelection(e) {
  const el = e.currentTarget;
  const key = el.dataset.vkey;
  if (selectedVerses.has(key)) {
    selectedVerses.delete(key);
    el.classList.remove('selected');
    el.querySelector('.verse-cb').innerHTML = '<i class="ti ti-square"></i>';
  } else {
    selectedVerses.add(key);
    el.classList.add('selected');
    el.querySelector('.verse-cb').innerHTML = '<i class="ti ti-checkbox"></i>';
  }
  updateSelectBar();
}

function updateSelectBar() {
  const bar = document.getElementById('selectBar');
  const count = document.getElementById('selectCount');
  if (!bar || !count) return;
  const n = selectedVerses.size;
  if (n > 0) { bar.style.display = 'flex'; count.textContent = n + ' seleccionado' + (n !== 1 ? 's' : ''); }
  else { bar.style.display = 'none'; }
}

function toggleSelectMode() {
  selectMode = !selectMode;
  if (!selectMode) selectedVerses.clear();
  const bar = document.getElementById('selectBar');
  if (bar) bar.style.display = 'none';
  renderChapter();
}

async function copySelected() {
  if (selectedVerses.size === 0) return;
  const parts = [];
  for (const key of selectedVerses) {
    const [bk, ch, vs] = key.split(':');
    const vNum = parseInt(vs);
    const book = bibleIndex.find(b => b.key === bk);
    const ref = getBookTitle(book) + ' ' + ch + ':' + vNum;
    const text = currentBook && bk === currentBook.key ? (currentVerses ? currentVerses[vNum - 1] : '') : '';
    if (text) parts.push(ref + ' - ' + text);
  }
  try {
    await navigator.clipboard.writeText(parts.join('\n'));
    showToast('✓ ' + selectedVerses.size + ' versículo' + (selectedVerses.size !== 1 ? 's' : '') + ' copiado' + (selectedVerses.size !== 1 ? 's' : ''), 'success');
  } catch {
    showToast('Error al copiar', 'error');
  }
  toggleSelectMode();
}

async function toggleFav(e) {
  const btn = e.currentTarget;
  const key = btn.dataset.key;
  const [bookKey, chStr, vStr] = key.split(':');
  const chapter = parseInt(chStr);
  const verse = parseInt(vStr);
  const text = btn.dataset.text;
  const isFav = favSet.has(key);

  if (isFav) {
    const { error } = await window.supabase
      .from('bible_favorites')
      .delete()
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .eq('book_key', bookKey)
      .eq('chapter', chapter)
      .eq('verse', verse);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    favSet.delete(key);
    btn.classList.remove('favorited');
    showToast('Favorito eliminado', 'success');
  } else {
    const { error } = await window.supabase
      .from('bible_favorites')
      .insert({ space_id: spaceId, user_id: userId, book_key: bookKey, chapter, verse, text });
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    favSet.add(key);
    btn.classList.add('favorited');
    showToast('❤️ Versículo guardado', 'success');
  }
  const tf = document.getElementById('tabFav');
  if (tf) tf.textContent = '❤️ ' + favSet.size;
}

let searchTimeout = null;

function openSearchModal() {
  const m = document.getElementById('searchModal');
  if (m) m.style.display = 'flex';
  const inp = document.getElementById('searchGlobalInput');
  if (inp) { inp.value = ''; inp.focus(); }
  const res = document.getElementById('searchGlobalResults');
  if (res) res.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.3);font-size:14px">Escribe para buscar en toda la Biblia...</div>';
}

function closeSearchModal() {
  const m = document.getElementById('searchModal');
  if (m) m.style.display = 'none';
}

async function getCachedBook(key) {
  if (!bookCache[key]) {
    try {
      const res = await fetch('data/biblia/' + key + '.json');
      bookCache[key] = await res.json();
    } catch { return null; }
  }
  return bookCache[key];
}

async function doGlobalSearch(term) {
  const resultsEl = document.getElementById('searchGlobalResults');
  if (!term || term.length < 2) {
    resultsEl.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.3);font-size:14px">Escribe al menos 2 caracteres...</div>';
    return;
  }

  resultsEl.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.5)">Buscando...</div>';
  const q = term.toLowerCase();
  let allResults = [];

  for (const book of bibleIndex) {
    const chapters = await getCachedBook(book.key);
    if (!chapters) continue;
    for (let ci = 0; ci < chapters.length; ci++) {
      const verses = chapters[ci];
      for (let vi = 0; vi < verses.length; vi++) {
        if (verses[vi].toLowerCase().includes(q)) {
          allResults.push({ bookKey: book.key, bookTitle: getBookTitle(book), chapter: ci + 1, verse: vi + 1, text: verses[vi] });
          if (allResults.length >= 50) break;
        }
      }
      if (allResults.length >= 50) break;
    }
    if (allResults.length >= 50) break;
  }

  if (allResults.length === 0) {
    resultsEl.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.3);font-size:14px">Sin resultados</div>';
    return;
  }

  let html = '<div style="padding:4px 0;font-size:12px;color:rgba(255,255,255,0.4);text-align:center">' + allResults.length + ' resultado' + (allResults.length !== 1 ? 's' : '') + '</div>';
  for (const r of allResults) {
    html += '<div class="search-result-item" data-bk="' + r.bookKey + '" data-ch="' + r.chapter + '" data-vs="' + r.verse + '">';
    html += '<div class="search-result-ref">' + r.bookTitle + ' ' + r.chapter + ':' + r.verse + '</div>';
    html += '<div class="search-result-text">' + r.text + '</div>';
    html += '</div>';
  }
  resultsEl.innerHTML = html;

  resultsEl.querySelectorAll('.search-result-item').forEach(el => {
    el.addEventListener('click', () => {
      closeSearchModal();
      onBookSelect(el.dataset.bk, { chapter: parseInt(el.dataset.ch), verse: parseInt(el.dataset.vs) });
    });
  });
}

async function toggleMarkRead() {
  if (!currentBook || !currentChapter) return;
  const key = currentBook.key + ':' + currentChapter;
  const isRead = !!readMap[key];

  if (isRead) {
    const { error } = await window.supabase
      .from('reading_progress')
      .delete()
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .eq('book_key', currentBook.key)
      .eq('chapter', currentChapter);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    delete readMap[key];
  } else {
    const { error } = await window.supabase
      .from('reading_progress')
      .insert({ space_id: spaceId, user_id: userId, book_key: currentBook.key, chapter: currentChapter });
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    readMap[key] = true;
    await window.auth.logActivity(spaceId, userId, 'bible_read', 'Leyó ' + getBookFullTitle(currentBook) + ' ' + currentChapter, 'bible');
  }

  renderChapter();
  updateProgress();
}

async function updateProgress() {
  const readCount = getTotalRead(currentBook.key);
  const total = currentChapters.length;
  const pct = total > 0 ? Math.round(readCount / total * 100) : 0;
  const fill = document.querySelector('.progress-bar-fill');
  const text = document.querySelector('.progress-text');
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = readCount + ' de ' + total + ' capítulos leídos';

  const sel = document.getElementById('chapterSelect');
  if (sel) {
    for (let i = 0; i < sel.options.length; i++) {
      const c = i + 1;
      const marked = readMap[currentBook.key + ':' + c];
      sel.options[i].textContent = 'Capítulo ' + c + (marked ? ' ✓' : '');
    }
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.ensureSession();
  if (!session) { window.location.href = 'index.html'; return; }
  userId = session.user.id;

  const { data: space } = await window.supabase
    .from('spaces')
    .select('*')
    .or(`created_by.eq.${userId},partner_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!space) { window.location.href = 'link.html'; return; }
  spaceId = space.id;

  await initLayout();
  const ha = document.getElementById('headerAvatar');
  if (ha && window.currentUser) ha.textContent = (window.currentUser.name || '?').charAt(0).toUpperCase();
  await loadBibleIndex();
  await loadReadProgress();
  await loadFavorites();
  await renderWelcome();

  document.getElementById('searchFab').addEventListener('click', openSearchModal);
  document.getElementById('searchModalClose').addEventListener('click', closeSearchModal);
  document.getElementById('searchModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeSearchModal(); });
  document.getElementById('searchGlobalInput').addEventListener('input', (e) => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => doGlobalSearch(e.target.value), 400); });
  document.getElementById('searchGlobalInput').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearchModal(); });
});
