let bibleIndex = [];
let currentBook = null;
let currentChapters = [];
let currentChapter = 0;
let readMap = {};
let favSet = new Set();
let userId = null;
let spaceId = null;

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

function getChaptersCount(book) {
  return book.chapters || 0;
}

function getBookTitle(book) {
  return book.shortTitle || book.title || book.key;
}

function getBookFullTitle(book) {
  return book.title || book.shortTitle || book.key;
}

async function loadBookChapters(key) {
  const res = await fetch('data/biblia/' + key + '.json');
  currentChapters = await res.json();
}

function getTotalRead(bookKey) {
  let count = 0;
  for (const k in readMap) {
    if (k.startsWith(bookKey + ':')) count++;
  }
  return count;
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
  html += '</div>';

  html += '<div class="book-selector"><select id="bookSelect"><option value="">Selecciona un libro...</option></select></div>';
  html += '<div class="empty-select"><i class="ti ti-chevron-up" style="font-size:24px;display:block;margin-bottom:8px;opacity:0.3"></i> Selecciona un libro para comenzar</div>';
  html += '</div>';

  document.getElementById('app').innerHTML = html;

  document.getElementById('tabAT').addEventListener('click', () => popBooks('AT'));
  document.getElementById('tabNT').addEventListener('click', () => popBooks('NT'));
  document.getElementById('bookSelect').addEventListener('change', (e) => {
    if (e.target.value) onBookSelect(e.target.value);
  });

  popBooks('AT');
}

function popBooks(testament) {
  const tabAT = document.getElementById('tabAT');
  const tabNT = document.getElementById('tabNT');
  tabAT.classList.toggle('active', testament === 'AT');
  tabNT.classList.toggle('active', testament === 'NT');

  const sel = document.getElementById('bookSelect');
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

async function onBookSelect(key) {
  const book = bibleIndex.find(b => b.key === key);
  if (!book) return;
  currentBook = book;
  currentChapter = 0;

  await loadBookChapters(key);

  const chapterCount = currentChapters.length;
  const readCount = getTotalRead(key);

  let html = '<div class="reader-card">';
  html += '<div class="chapter-title">' + getBookFullTitle(book) + '</div>';
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
  html += '</div>';

  html += '<div id="versesContainer"></div>';
  html += '<button class="mark-read-btn" id="markReadBtn">Marcar como leído</button>';
  html += '</div>';

  document.getElementById('app').innerHTML = html;

  document.getElementById('chapterSelect').addEventListener('change', (e) => {
    currentChapter = parseInt(e.target.value);
    renderChapter();
  });
  document.getElementById('prevChapBtn').addEventListener('click', () => {
    const sel = document.getElementById('chapterSelect');
    if (sel.selectedIndex > 0) { sel.selectedIndex--; sel.dispatchEvent(new Event('change')); }
  });
  document.getElementById('nextChapBtn').addEventListener('click', () => {
    const sel = document.getElementById('chapterSelect');
    if (sel.selectedIndex < sel.options.length - 1) { sel.selectedIndex++; sel.dispatchEvent(new Event('change')); }
  });
  document.getElementById('markReadBtn').addEventListener('click', toggleMarkRead);

  currentChapter = 1;
  document.getElementById('chapterSelect').value = '1';
  renderChapter();
}

function renderChapter() {
  if (!currentBook || !currentChapters.length || !currentChapter) return;
  const idx = currentChapter - 1;
  const verses = currentChapters[idx];
  if (!verses) return;

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
    markBtn.textContent = isRead ? '✓ Capítulo leído' : 'Marcar como leído';
    markBtn.classList.toggle('done', isRead);
  }

  let html = '<div class="chapter-title">' + getBookFullTitle(currentBook) + ' ' + currentChapter + '</div>';

  verses.forEach((text, i) => {
    const vNum = i + 1;
    const key2 = currentBook.key + ':' + currentChapter + ':' + vNum;
    const isFav = favSet.has(key2);
    html += '<div class="verse">';
    html += '<div class="verse-num">' + vNum + '</div>';
    html += '<div class="verse-text">' + text + '</div>';
    html += '<button class="verse-fav' + (isFav ? ' favorited' : '') + '" data-key="' + key2 + '" data-verse="' + vNum + '" data-text="' + escapeAttr(text) + '"><i class="ti ti-heart"></i></button>';
    html += '</div>';
  });

  const container = document.getElementById('versesContainer');
  if (container) {
    container.innerHTML = html;
    container.querySelectorAll('.verse-fav').forEach(btn => {
      btn.addEventListener('click', toggleFav);
    });
  }
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
}

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
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
  await loadBibleIndex();
  await loadReadProgress();
  await loadFavorites();
  await renderWelcome();
});
