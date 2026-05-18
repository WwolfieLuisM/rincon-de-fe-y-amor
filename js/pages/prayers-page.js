function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

const CATEGORY_ICONS = {
  faith: '<i class="ti ti-cross"></i>',
  family: '<i class="ti ti-users"></i>',
  health: '<i class="ti ti-heart-plus"></i>',
  work: '<i class="ti ti-briefcase"></i>',
  general: '<i class="ti ti-pray"></i>'
};

const CATEGORY_LABELS = {
  faith: 'Fe',
  family: 'Familia',
  health: 'Salud',
  work: 'Trabajo',
  general: 'General'
};

let prayersChannel = null;
let marksChannel = null;
let _currentTab = 'active';
let _activePrayers = [];
let _completedPrayers = [];
let _progressMap = {};
let _todayMarks = [];
let _currentUser = null;
let _currentSpace = null;
let _todayStr = null;

function createPrayerCardHtml(p, progress, todayMark, userId) {
  const pct = Math.min(100, Math.round((progress / p.days_goal) * 100));
  const icon = CATEGORY_ICONS[p.category] || '🙏';
  return `
    <div class="prayer-card" data-id="${p.id}">
      <div class="prayer-header">
        <div class="prayer-icon ${p.category}">${icon}</div>
        <div class="prayer-title">${p.title}</div>
        <div class="three-dot-wrap">
          <button class="three-dot-btn" data-id="${p.id}">⋮</button>
          <div class="three-dot-menu">
            <button class="three-dot-item" data-action="edit" data-id="${p.id}"><i class="ti ti-edit"></i> Editar</button>
            <button class="three-dot-item" data-action="answer" data-id="${p.id}"><i class="ti ti-check"></i> Respondida</button>
            <button class="three-dot-item danger" data-action="delete" data-id="${p.id}"><i class="ti ti-trash"></i> Eliminar</button>
          </div>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="prayer-progress-text">${progress} / ${p.days_goal} d\u00edas (${pct}%)</div>
      <div class="prayer-today">
        <span>Hoy:</span>
        <span class="${todayMark ? 'prayed' : 'not-prayed'}">${todayMark ? '<i class="ti ti-check"></i> Oraste' : '<i class="ti ti-clock"></i> Pendiente'}</span>
      </div>
      <div class="prayer-actions">
        <button class="btn-soft prayer-mark-btn" data-id="${p.id}" ${todayMark ? 'disabled style="opacity:0.4"' : ''}>
          ${todayMark ? '<i class="ti ti-check"></i> Oraste hoy' : 'Orar hoy <i class="ti ti-heart"></i>'}
        </button>
      </div>
    </div>
  `;
}

function addPrayerMarkListener(btn, prayers, userId, space, today) {
  btn.addEventListener('click', async () => {
    const prayerId = btn.dataset.id;
    const prayer = prayers.find(p => p.id === prayerId);
    if (!prayer) return;
    btn.disabled = true;
    const { error } = await window.supabase
      .from('prayer_marks')
      .insert({ prayer_id: prayerId, user_id: userId, marked_at: today });
    if (error) {
      if (error.code === '23505') { showToast('Ya marcaste esta oraci\u00f3n hoy', 'error'); btn.disabled = false; return; }
      showToast('Error: ' + error.message, 'error');
      btn.disabled = false;
      return;
    }
    const newProgress = await getPrayerProgress(prayerId, space, userId);
    if (newProgress >= prayer.days_goal) {
      await window.supabase.from('prayers').update({ completed: true }).eq('id', prayerId);
      showToast('\uD83C\uDF89 \u00a1Oraci\u00f3n completada!', 'success');
    } else {
      showToast('Oraci\u00f3n marcada \u2713', 'success');
    }
    await window.auth.logActivity(space.id, userId, 'prayer', 'Or\u00f3 por: ' + prayer.title, 'prayers');
    await loadPage(userId, space);
  });
}

function setupPrayersRealtime(spaceId, userId) {
  if (prayersChannel) window.supabase.removeChannel(prayersChannel);
  if (marksChannel) window.supabase.removeChannel(marksChannel);

  prayersChannel = window.supabase
    .channel('prayers-' + spaceId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'prayers',
      filter: 'space_id=eq.' + spaceId,
    }, async (payload) => {
      if (payload.new.created_by === userId) return;
      if (_currentTab !== 'active') return;
      if (payload.new.completed) return;
      const p = payload.new;
      const progress = await getPrayerProgress(p.id, _currentSpace, userId);
      const todayMark = _todayMarks.find(m => m.prayer_id === p.id && m.user_id === userId) || null;
      const list = document.getElementById('prayersList');
      if (!list) return;
      const empty = list.querySelector('.empty-state');
      if (empty) empty.remove();
      list.insertAdjacentHTML('afterbegin', createPrayerCardHtml(p, progress, todayMark, userId));
      _activePrayers.unshift(p);
      _progressMap[p.id] = progress;
      const tab = document.querySelector('.tab[data-tab="active"]');
      if (tab) tab.textContent = 'Activas (' + _activePrayers.length + ')';
      const card = list.querySelector('.prayer-card[data-id="' + p.id + '"]');
      const btn = card?.querySelector('.prayer-mark-btn');
      if (btn) addPrayerMarkListener(btn, _activePrayers, userId, _currentSpace, _todayStr);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'prayers',
      filter: 'space_id=eq.' + spaceId,
    }, (payload) => {
      if (payload.new.created_by === userId) return;
      const p = payload.new;
      if (!payload.old.completed && p.completed) {
        loadPage(userId, _currentSpace);
        return;
      }
      const progress = _progressMap[p.id] || 0;
      const todayMark = _todayMarks.find(m => m.prayer_id === p.id && m.user_id === userId) || null;
      const existing = document.querySelector('.prayer-card[data-id="' + p.id + '"]');
      if (existing) {
        existing.outerHTML = createPrayerCardHtml(p, progress, todayMark, userId);
        const newCard = document.querySelector('.prayer-card[data-id="' + p.id + '"]');
        const btn = newCard?.querySelector('.prayer-mark-btn');
        if (btn) addPrayerMarkListener(btn, _activePrayers, userId, _currentSpace, _todayStr);
      }
      const idx = _activePrayers.findIndex(a => a.id === p.id);
      if (idx !== -1) _activePrayers[idx] = p;
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'prayers',
      filter: 'space_id=eq.' + spaceId,
    }, (payload) => {
      const card = document.querySelector('.prayer-card[data-id="' + payload.old.id + '"]');
      if (card) card.remove();
      _activePrayers = _activePrayers.filter(a => a.id !== payload.old.id);
      _completedPrayers = _completedPrayers.filter(a => a.id !== payload.old.id);
      const tab = document.querySelector('.tab[data-tab="active"]');
      if (tab) tab.textContent = 'Activas (' + _activePrayers.length + ')';
    })
    .subscribe();

  marksChannel = window.supabase
    .channel('prayer-marks-' + spaceId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'prayer_marks',
    }, async (payload) => {
      if (payload.new.user_id === userId) return;
      const prayerId = payload.new.prayer_id;
      if (!_activePrayers.some(p => p.id === prayerId) && !_completedPrayers.some(p => p.id === prayerId)) return;
      if (_currentTab !== 'active') return;
      const card = document.querySelector('.prayer-card[data-id="' + prayerId + '"]');
      if (!card) return;
      const newProgress = await getPrayerProgress(prayerId, _currentSpace, userId);
      const prayer = _activePrayers.find(p => p.id === prayerId);
      if (!prayer) return;
      if (newProgress >= prayer.days_goal) {
        await window.supabase.from('prayers').update({ completed: true }).eq('id', prayerId);
        card.remove();
        _activePrayers = _activePrayers.filter(a => a.id !== prayerId);
        const tab = document.querySelector('.tab[data-tab="active"]');
        if (tab) tab.textContent = 'Activas (' + _activePrayers.length + ')';
        return;
      }
      const todayMark = _todayMarks.find(m => m.prayer_id === prayerId && m.user_id === userId) || null;
      card.outerHTML = createPrayerCardHtml(prayer, newProgress, todayMark, userId);
      _progressMap[prayerId] = newProgress;
      const newCard = document.querySelector('.prayer-card[data-id="' + prayerId + '"]');
      const btn = newCard?.querySelector('.prayer-mark-btn');
      if (btn) addPrayerMarkListener(btn, _activePrayers, userId, _currentSpace, _todayStr);
    })
    .subscribe();
}

async function getPrayerProgress(prayerId, space, userId) {
  const { data: marks } = await window.supabase
    .from('prayer_marks')
    .select('*')
    .eq('prayer_id', prayerId);

  if (!marks || marks.length === 0) return 0;

  const partnerId = space?.partner_id || null;

  if (!partnerId) {
    const userDates = new Set();
    marks.forEach(m => {
      if (m.user_id === userId) userDates.add(m.marked_at);
    });
    return userDates.size;
  }

  const byDate = {};
  marks.forEach(m => {
    if (!byDate[m.marked_at]) byDate[m.marked_at] = new Set();
    byDate[m.marked_at].add(m.user_id);
  });

  let mutual = 0;
  for (const users of Object.values(byDate)) {
    if (users.has(userId) && users.has(partnerId)) mutual++;
  }
  return mutual;
}

function showPrayerModal(prayer, space, userId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-title">${prayer ? 'Editar oraci\u00f3n' : 'Nueva oraci\u00f3n'}</div>
      <div class="input-group">
        <label class="input-label">T\u00edtulo</label>
        <input class="input-field" id="prayerTitleInput" value="${prayer ? prayer.title : ''}" placeholder="\u00bfQu\u00e9 deseas orar?">
      </div>
      <div class="input-group">
        <label class="input-label">Categor\u00eda</label>
        <select class="input-field" id="prayerCategoryInput">
          <option value="general" ${prayer && prayer.category === 'general' ? 'selected' : ''}>General</option>
          <option value="faith" ${prayer && prayer.category === 'faith' ? 'selected' : ''}>Fe</option>
          <option value="family" ${prayer && prayer.category === 'family' ? 'selected' : ''}>Familia</option>
          <option value="health" ${prayer && prayer.category === 'health' ? 'selected' : ''}>Salud</option>
          <option value="work" ${prayer && prayer.category === 'work' ? 'selected' : ''}>Trabajo</option>
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">D\u00edas meta</label>
        <input class="input-field" type="number" id="prayerGoalInput" value="${prayer ? prayer.days_goal : 21}" min="1" max="365">
      </div>
      <button class="btn-primary w-full" id="savePrayerBtn">${prayer ? 'Guardar cambios' : 'Crear oraci\u00f3n'}</button>
      <button class="btn-primary w-full" style="background:var(--surface-2);color:var(--text-2);margin-top:8px" id="cancelModalBtn">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const sheet = overlay.querySelector('.modal-sheet');
  setTimeout(() => sheet.style.transform = 'translateX(-50%) translateY(0)', 10);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  document.getElementById('cancelModalBtn').addEventListener('click', () => overlay.remove());

  document.getElementById('savePrayerBtn').addEventListener('click', async () => {
    const titleInput = document.getElementById('prayerTitleInput');
    const categoryInput = document.getElementById('prayerCategoryInput');
    const goalInput = document.getElementById('prayerGoalInput');

    const title = titleInput.value.trim();
    const category = categoryInput.value;
    const daysGoal = parseInt(goalInput.value) || 21;

    if (!title) {
      showToast('Ingresa un t\u00edtulo', 'error');
      return;
    }

    if (prayer) {
      const { error } = await window.supabase
        .from('prayers')
        .update({ title, category, days_goal: daysGoal })
        .eq('id', prayer.id);

      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }

      showToast('Oraci\u00f3n actualizada \u2713', 'success');
    } else {
      const { error } = await window.supabase
        .from('prayers')
        .insert({
          space_id: space.id,
          created_by: userId,
          title,
          category,
          days_goal: daysGoal
        });

      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }

      await window.auth.logActivity(space.id, userId, 'prayer', 'Nueva oraci\u00f3n: ' + title, 'prayers');
      showToast('Oraci\u00f3n creada \u2713', 'success');
    }

    overlay.remove();
    await loadPage(userId, space);
  });
}

function showAnswerModal(prayer, userId, space) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-title">Marcar como respondida</div>
      <p style="font-size:13px;color:var(--text-2);margin-bottom:12px"><i class="ti ti-heart" style="color:var(--success)"></i> \u00bfC\u00f3mo fue respondida esta oraci\u00f3n?</p>
      <div class="input-group">
        <textarea class="input-field" id="answerNoteInput" rows="3" style="resize:none" placeholder="Describe c\u00f3mo Dios respondi\u00f3... (opcional)"></textarea>
      </div>
      <button class="btn-primary w-full" id="confirmAnswerBtn">Marcar como respondida</button>
      <button class="btn-primary w-full" style="background:var(--surface-2);color:var(--text-2);margin-top:8px" id="cancelModalBtn">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);
  const sheet = overlay.querySelector('.modal-sheet');
  setTimeout(() => sheet.style.transform = 'translateX(-50%) translateY(0)', 10);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('cancelModalBtn').addEventListener('click', () => overlay.remove());

  document.getElementById('confirmAnswerBtn').addEventListener('click', async () => {
    const note = document.getElementById('answerNoteInput').value.trim();
    const updates = { completed: true };
    if (note) updates.answer_note = note;

    const { error } = await window.supabase
      .from('prayers')
      .update(updates)
      .eq('id', prayer.id);

    if (error) {
      showToast('Error: ' + error.message, 'error');
      return;
    }

    await window.auth.logActivity(space.id, userId, 'prayer', 'Oraci\u00f3n respondida: ' + prayer.title, 'prayers');
    showToast('\uD83C\uDF89 Oraci\u00f3n marcada como respondida', 'success');
    overlay.remove();
    await loadPage(userId, space);
  });

  setTimeout(() => document.getElementById('answerNoteInput').focus(), 200);
}

async function loadPage(userId, space) {
  const { data: prayers } = await window.supabase
    .from('prayers')
    .select('*')
    .eq('space_id', space.id)
    .order('created_at', { ascending: false });

  const items = prayers || [];
  const activePrayers = items.filter(p => !p.completed);
  const completedPrayers = items.filter(p => p.completed);

  const progressMap = {};
  for (const p of activePrayers) {
    progressMap[p.id] = await getPrayerProgress(p.id, space, userId);
  }

  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  let todayMarks = [];
  if (activePrayers.length > 0) {
    const { data: marks } = await window.supabase
      .from('prayer_marks')
      .select('*')
      .eq('marked_at', today)
      .in('prayer_id', activePrayers.map(p => p.id));
    todayMarks = marks || [];
  }

  const headerAvatar = document.getElementById('headerAvatar');
  if (headerAvatar && window.currentUser) {
    headerAvatar.textContent = (window.currentUser.name || '?').charAt(0).toUpperCase();
  }

  let html = '<div class="page-content">';
  html += `
    <div class="tabs">
      <button class="tab active" data-tab="active">Activas (${activePrayers.length})</button>
      <button class="tab" data-tab="completed">Completadas (${completedPrayers.length})</button>
    </div>
    <div id="prayersList"></div>
  `;

  html += '</div>';
  document.getElementById('app').innerHTML = html;

  _currentTab = 'active';
  _activePrayers = activePrayers;
  _completedPrayers = completedPrayers;
  _progressMap = progressMap;
  _todayMarks = todayMarks;
  _currentUser = userId;
  _currentSpace = space;
  _todayStr = today;

  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _currentTab = tab.dataset.tab;
      if (_currentTab === 'active') {
        renderActivePrayers(_activePrayers, _progressMap, _todayMarks, _currentUser, _currentSpace, _todayStr);
      } else {
        renderCompletedPrayers(_completedPrayers);
      }
    });
  });

  renderActivePrayers(activePrayers, progressMap, todayMarks, userId, space, today);

  setupPrayersRealtime(space.id, userId);

  document.getElementById('addPrayerBtn').addEventListener('click', () => {
    showPrayerModal(null, space, userId);
  });
}

function renderActivePrayers(prayers, progressMap, todayMarks, userId, space, today) {
  const container = document.getElementById('prayersList');

  if (prayers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">\uD83D\uDE4F</div>
        <div class="empty-title">No hay oraciones activas</div>
        <div class="empty-subtitle">Crea una nueva oraci\u00f3n para empezar</div>
      </div>
    `;
    return;
  }

  let html = '';
  prayers.forEach(p => {
    const progress = progressMap[p.id] || 0;
    const todayMark = todayMarks.find(m => m.prayer_id === p.id && m.user_id === userId);
    html += createPrayerCardHtml(p, progress, todayMark, userId);
  });

  container.innerHTML = html;

  container.querySelectorAll('.prayer-mark-btn').forEach(btn => {
    addPrayerMarkListener(btn, prayers, userId, space, today);
  });

  container.addEventListener('click', (e) => {
    const dotBtn = e.target.closest('.three-dot-btn');
    if (dotBtn) {
      e.stopPropagation();
      document.querySelectorAll('.three-dot-menu.open').forEach(m => { if (m.closest('.three-dot-wrap') !== dotBtn.parentElement) m.classList.remove('open'); });
      dotBtn.parentElement.querySelector('.three-dot-menu').classList.toggle('open');
      return;
    }

    const item = e.target.closest('.three-dot-item');
    if (!item) return;
    item.closest('.three-dot-menu').classList.remove('open');
    const id = item.dataset.id;
    const prayer = prayers.find(p => p.id === id);
    if (item.dataset.action === 'edit' && prayer) {
      showPrayerModal(prayer, space, userId);
    } else if (item.dataset.action === 'answer' && prayer) {
      showAnswerModal(prayer, userId, space);
    } else if (item.dataset.action === 'delete') {
      if (!confirm('\u00bfEliminar esta oraci\u00f3n?')) return;
      window.supabase.from('prayers').delete().eq('id', id).then(({ error }) => {
        if (error) { showToast('Error: ' + error.message, 'error'); return; }
        showToast('Oraci\u00f3n eliminada', 'success');
        loadPage(userId, space);
      });
    }
  });

}

function renderCompletedPrayers(prayers) {
  const container = document.getElementById('prayersList');

  if (prayers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">\u2705</div>
        <div class="empty-title">No hay oraciones completadas</div>
        <div class="empty-subtitle">Las oraciones con respuesta aparecer\u00e1n aqu\u00ed</div>
      </div>
    `;
    return;
  }

  let html = '';
  prayers.forEach(p => {
    const icon = CATEGORY_ICONS[p.category] || '\uD83D\uDE4F';
    html += `
      <div class="prayer-card" style="opacity:0.8">
        <div class="prayer-header">
          <div class="prayer-icon ${p.category}" style="opacity:0.6">${icon}</div>
          <div class="prayer-title" style="text-decoration:line-through;opacity:0.6">${p.title}</div>
        </div>
        ${p.answer_note ? '<div style="font-size:13px;color:var(--text-2);margin-top:6px;font-style:italic">"' + p.answer_note + '"</div>' : ''}
        <div style="font-size:12px;color:var(--success);margin-top:6px"><i class="ti ti-check"></i> Completada</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.addEventListener('beforeunload', () => {
  if (prayersChannel) window.supabase.removeChannel(prayersChannel);
  if (marksChannel) window.supabase.removeChannel(marksChannel);
});

window.addEventListener('DOMContentLoaded', async () => {
  document.querySelector('.prayers-bg') || document.body.insertAdjacentHTML('afterbegin', '<div class="prayers-bg"></div>');
  const session = await window.auth.ensureSession();
  if (!session) { window.location.href = 'index.html'; return; }

  const { data: space } = await window.supabase
    .from('spaces')
    .select('*')
    .or(`created_by.eq.${session.user.id},partner_id.eq.${session.user.id}`)
    .maybeSingle();
  if (!space) { window.location.href = 'link.html'; return; }

  await initLayout();
  await loadPage(session.user.id, space);
});

document.addEventListener('click', () => {
  document.querySelectorAll('.three-dot-menu.open').forEach(m => m.classList.remove('open'));
});
