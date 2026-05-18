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
      <div class="modal-title">${prayer ? 'Editar oración' : 'Nueva oración'}</div>
      <div class="input-group">
        <label class="input-label">Título</label>
        <input class="input-field" id="prayerTitleInput" value="${prayer ? prayer.title : ''}" placeholder="¿Qué deseas orar?">
      </div>
      <div class="input-group">
        <label class="input-label">Categoría</label>
        <select class="input-field" id="prayerCategoryInput">
          <option value="general" ${prayer && prayer.category === 'general' ? 'selected' : ''}>General</option>
          <option value="faith" ${prayer && prayer.category === 'faith' ? 'selected' : ''}>Fe</option>
          <option value="family" ${prayer && prayer.category === 'family' ? 'selected' : ''}>Familia</option>
          <option value="health" ${prayer && prayer.category === 'health' ? 'selected' : ''}>Salud</option>
          <option value="work" ${prayer && prayer.category === 'work' ? 'selected' : ''}>Trabajo</option>
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Días meta</label>
        <input class="input-field" type="number" id="prayerGoalInput" value="${prayer ? prayer.days_goal : 21}" min="1" max="365">
      </div>
      <button class="btn-primary w-full" id="savePrayerBtn">${prayer ? 'Guardar cambios' : 'Crear oración'}</button>
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
      showToast('Ingresa un título', 'error');
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

      showToast('Oración actualizada ✓', 'success');
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

      await window.auth.logActivity(space.id, userId, 'prayer', 'Nueva oración: ' + title, 'prayers');
      showToast('Oración creada ✓', 'success');
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
      <p style="font-size:13px;color:var(--text-2);margin-bottom:12px"><i class="ti ti-heart" style="color:var(--success)"></i> ¿Cómo fue respondida esta oración?</p>
      <div class="input-group">
        <textarea class="input-field" id="answerNoteInput" rows="3" style="resize:none" placeholder="Describe cómo Dios respondió... (opcional)"></textarea>
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

    await window.auth.logActivity(space.id, userId, 'prayer', 'Oración respondida: ' + prayer.title, 'prayers');
    showToast('🎉 Oración marcada como respondida', 'success');
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

  let activeTab = 'active';
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      if (activeTab === 'active') {
        renderActivePrayers(activePrayers, progressMap, todayMarks, userId, space, today);
      } else {
        renderCompletedPrayers(completedPrayers);
      }
    });
  });

  renderActivePrayers(activePrayers, progressMap, todayMarks, userId, space, today);

  document.getElementById('addPrayerBtn').addEventListener('click', () => {
    showPrayerModal(null, space, userId);
  });
}

function renderActivePrayers(prayers, progressMap, todayMarks, userId, space, today) {
  const container = document.getElementById('prayersList');

  if (prayers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🙏</div>
        <div class="empty-title">No hay oraciones activas</div>
        <div class="empty-subtitle">Crea una nueva oración para empezar</div>
      </div>
    `;
    return;
  }

  let html = '';
  prayers.forEach(p => {
    const progress = progressMap[p.id] || 0;
    const pct = Math.min(100, Math.round((progress / p.days_goal) * 100));
    const icon = CATEGORY_ICONS[p.category] || '🙏';
    const todayMark = todayMarks.find(m => m.prayer_id === p.id && m.user_id === userId);

    html += `
      <div class="prayer-card">
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
        <div class="prayer-progress-text">${progress} / ${p.days_goal} días (${pct}%)</div>
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
  });

  container.innerHTML = html;

  container.querySelectorAll('.prayer-mark-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const prayerId = btn.dataset.id;
      const prayer = prayers.find(p => p.id === prayerId);
      if (!prayer) return;

      btn.disabled = true;

      const { error } = await window.supabase
        .from('prayer_marks')
        .insert({ prayer_id: prayerId, user_id: userId, marked_at: today });

      if (error) {
        if (error.code === '23505') {
          showToast('Ya marcaste esta oración hoy', 'error');
          btn.disabled = false;
          return;
        }
        showToast('Error: ' + error.message, 'error');
        btn.disabled = false;
        return;
      }

      const newProgress = await getPrayerProgress(prayerId, space, userId);
      if (newProgress >= prayer.days_goal) {
        await window.supabase.from('prayers').update({ completed: true }).eq('id', prayerId);
        showToast('🎉 ¡Oración completada!', 'success');
      } else {
        showToast('Oración marcada ✓', 'success');
      }

      await window.auth.logActivity(space.id, userId, 'prayer', 'Oró por: ' + prayer.title, 'prayers');
      await loadPage(userId, space);
    });
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
      if (!confirm('¿Eliminar esta oración?')) return;
      window.supabase.from('prayers').delete().eq('id', id).then(({ error }) => {
        if (error) { showToast('Error: ' + error.message, 'error'); return; }
        showToast('Oración eliminada', 'success');
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
        <div class="empty-icon">✅</div>
        <div class="empty-title">No hay oraciones completadas</div>
        <div class="empty-subtitle">Las oraciones con respuesta aparecerán aquí</div>
      </div>
    `;
    return;
  }

  let html = '';
  prayers.forEach(p => {
    const icon = CATEGORY_ICONS[p.category] || '🙏';
    html += `
      <div class="prayer-card" style="opacity:0.8">
        <div class="prayer-header">
          <div class="prayer-icon ${p.category}" style="opacity:0.6">${icon}</div>
          <div class="prayer-title" style="text-decoration:line-through;opacity:0.6">${p.title}</div>
        </div>
        ${p.answer_note ? `<div style="font-size:13px;color:var(--text-2);margin-top:6px;font-style:italic">"${p.answer_note}"</div>` : ''}
        <div style="font-size:12px;color:var(--success);margin-top:6px"><i class="ti ti-check"></i> Completada</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

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
