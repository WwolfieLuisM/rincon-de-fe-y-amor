function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

let goalsChannel = null;
let _currentGoalTab = 'active';
let _activeGoals = [];
let _completedGoals = [];
let _goalUserId = null;
let _goalSpace = null;

function createGoalCardHtml(g, userId, space) {
  const pct = Math.min(100, g.progress || 0);
  return `
    <div class="goal-card" data-id="${g.id}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <div class="goal-title">${g.title}</div>
          ${g.target_date ? '<div class="goal-date"><i class="ti ti-calendar"></i> ' + formatDate(g.target_date) + '</div>' : ''}
        </div>
        ${!g.completed ? `
        <div class="three-dot-wrap">
          <button class="three-dot-btn" data-id="${g.id}">⋮</button>
          <div class="three-dot-menu">
            <button class="three-dot-item" data-action="edit" data-id="${g.id}"><i class="ti ti-edit"></i> Editar</button>
            <button class="three-dot-item danger" data-action="delete" data-id="${g.id}"><i class="ti ti-trash"></i> Eliminar</button>
          </div>
        </div>` : ''}
      </div>
      <div style="margin-top:10px">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="prayer-progress-text">${pct}%</div>
      </div>
      ${!g.completed ? `
        <div class="goal-progress-btns">
          <button class="btn-10 goal-progress-btn" data-id="${g.id}" data-amt="10">+10%</button>
          <button class="btn-25 goal-progress-btn" data-id="${g.id}" data-amt="25">+25%</button>
          <button class="btn-complete goal-complete-btn" data-id="${g.id}">Completar</button>
        </div>
      ` : `
        <div style="font-size:12px;color:var(--success);margin-top:6px"><i class="ti ti-check"></i> Completada</div>
      `}
    </div>
  `;
}

function addGoalListeners(container, goals, userId, space) {
  container.querySelectorAll('.goal-progress-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const amt = parseInt(btn.dataset.amt);
      const goal = goals.find(g => g.id === id);
      if (!goal) return;

      const newProgress = Math.min(100, (goal.progress || 0) + amt);
      const updateData = { progress: newProgress };
      if (newProgress >= 100) updateData.completed = true;

      const { error } = await window.supabase.from('goals').update(updateData).eq('id', id);
      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }

      if (newProgress >= 100) {
        showToast('\uD83C\uDF89 \u00a1Meta completada!', 'success');
        await window.auth.logActivity(space.id, userId, 'goal', 'Meta completada: ' + goal.title, 'goals');
      } else {
        showToast('Progreso actualizado \u2713', 'success');
      }

      await loadPage(userId, space);
    });
  });

  container.querySelectorAll('.goal-complete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const { error } = await window.supabase.from('goals').update({ completed: true, progress: 100 }).eq('id', id);
      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }
      const goal = goals.find(g => g.id === id);
      if (goal) {
        await window.auth.logActivity(space.id, userId, 'goal', 'Meta completada: ' + goal.title, 'goals');
      }
      showToast('\uD83C\uDF89 \u00a1Meta completada!', 'success');
      await loadPage(userId, space);
    });
  });
}

function setupGoalsRealtime(spaceId, userId) {
  if (goalsChannel) window.supabase.removeChannel(goalsChannel);

  goalsChannel = window.supabase
    .channel('goals-' + spaceId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'goals',
      filter: 'space_id=eq.' + spaceId,
    }, (payload) => {
      const g = payload.new;
      if (g.completed) _completedGoals.unshift(g);
      else _activeGoals.unshift(g);
      if (_currentGoalTab === 'active' && !g.completed) {
        const list = document.getElementById('goalsList');
        if (!list) return;
        const empty = list.querySelector('.empty-state');
        if (empty) empty.remove();
        list.insertAdjacentHTML('afterbegin', createGoalCardHtml(g, userId, _goalSpace));
        const card = list.querySelector('.goal-card[data-id="' + g.id + '"]');
        if (card) addGoalListeners(card, _activeGoals, userId, _goalSpace);
      } else if (_currentGoalTab === 'completed' && g.completed) {
        const list = document.getElementById('goalsList');
        if (!list) return;
        const empty = list.querySelector('.empty-state');
        if (empty) empty.remove();
        list.insertAdjacentHTML('afterbegin', createGoalCardHtml(g, userId, _goalSpace));
      }
      const tab = document.querySelector('.tab[data-tab="active"]');
      if (tab) tab.textContent = 'Activas (' + _activeGoals.length + ')';
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'goals',
      filter: 'space_id=eq.' + spaceId,
    }, (payload) => {
      const g = payload.new;
      const wasCompleted = payload.old.completed;
      const isCompleted = g.completed;

      if (!wasCompleted && isCompleted) {
        _activeGoals = _activeGoals.filter(a => a.id !== g.id);
        _completedGoals.unshift(g);
        if (_currentGoalTab === 'active') {
          const card = document.querySelector('.goal-card[data-id="' + g.id + '"]');
          if (card) card.remove();
        }
        loadPage(userId, _goalSpace);
        return;
      }

      const existing = document.querySelector('.goal-card[data-id="' + g.id + '"]');
      if (existing) {
        existing.outerHTML = createGoalCardHtml(g, userId, _goalSpace);
        const newCard = document.querySelector('.goal-card[data-id="' + g.id + '"]');
        if (newCard && !g.completed) addGoalListeners(newCard, _activeGoals, userId, _goalSpace);
      }
      const idx = _activeGoals.findIndex(a => a.id === g.id);
      if (idx !== -1) _activeGoals[idx] = g;
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'goals',
      filter: 'space_id=eq.' + spaceId,
    }, (payload) => {
      const card = document.querySelector('.goal-card[data-id="' + payload.old.id + '"]');
      if (card) card.remove();
      _activeGoals = _activeGoals.filter(a => a.id !== payload.old.id);
      _completedGoals = _completedGoals.filter(a => a.id !== payload.old.id);
      const tab = document.querySelector('.tab[data-tab="active"]');
      if (tab) tab.textContent = 'Activas (' + _activeGoals.length + ')';
    })
    .subscribe();
}

function showGoalModal(goal, space, userId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-title">${goal ? 'Editar meta' : 'Nueva meta'}</div>
      <div class="input-group">
        <label class="input-label">T\u00edtulo</label>
        <input class="input-field" id="goalTitleInput" value="${goal ? goal.title : ''}" placeholder="\u00bfCu\u00e1l es tu meta?">
      </div>
      <div class="input-group">
        <label class="input-label">Fecha l\u00edmite</label>
        <input class="input-field" type="date" id="goalDateInput" value="${goal && goal.target_date ? goal.target_date : ''}">
      </div>
      <button class="btn-primary w-full" id="saveGoalBtn">${goal ? 'Guardar cambios' : 'Crear meta'}</button>
      <button class="btn-primary w-full" style="background:var(--surface-2);color:var(--text-2);margin-top:8px" id="cancelModalBtn">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);
  const sheet = overlay.querySelector('.modal-sheet');
  setTimeout(() => sheet.style.transform = 'translateX(-50%) translateY(0)', 10);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById('cancelModalBtn').addEventListener('click', () => overlay.remove());

  document.getElementById('saveGoalBtn').addEventListener('click', async () => {
    const title = document.getElementById('goalTitleInput').value.trim();
    const targetDate = document.getElementById('goalDateInput').value;

    if (!title) {
      showToast('Ingresa un t\u00edtulo', 'error');
      return;
    }

    if (goal) {
      const { error } = await window.supabase
        .from('goals')
        .update({ title, target_date: targetDate || null })
        .eq('id', goal.id);

      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }
      showToast('Meta actualizada \u2713', 'success');
    } else {
      const { error } = await window.supabase
        .from('goals')
        .insert({
          space_id: space.id,
          title,
          target_date: targetDate || null
        });

      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }
      await window.auth.logActivity(space.id, userId, 'goal', 'Nueva meta: ' + title, 'goals');
      showToast('Meta creada \u2713', 'success');
    }

    overlay.remove();
    await loadPage(userId, space);
  });
}

async function loadPage(userId, space) {
  const headerAvatar = document.getElementById('headerAvatar');
  if (window.currentUser) {
    headerAvatar.textContent = (window.currentUser.name || '?').charAt(0).toUpperCase();
  }

  const { data: goals } = await window.supabase
    .from('goals')
    .select('*')
    .eq('space_id', space.id)
    .order('created_at', { ascending: false });

  const items = goals || [];
  _currentGoalTab = 'active';
  _activeGoals = items.filter(g => !g.completed);
  _completedGoals = items.filter(g => g.completed);
  _goalUserId = userId;
  _goalSpace = space;

  let html = '<div class="page-content">';

  html += `
    <div class="tabs">
      <button class="tab active" data-tab="active">Activas (${_activeGoals.length})</button>
      <button class="tab" data-tab="completed">Completadas (${_completedGoals.length})</button>
    </div>
    <div id="goalsList"></div>
  `;

  html += '</div>';
  document.getElementById('app').innerHTML = html;

  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _currentGoalTab = tab.dataset.tab;
      renderGoals(_currentGoalTab === 'active' ? _activeGoals : _completedGoals, userId, space);
    });
  });

  renderGoals(_activeGoals, userId, space);
  setupGoalsRealtime(space.id, userId);

  document.getElementById('addGoalBtn').addEventListener('click', () => {
    showGoalModal(null, space, userId);
  });
}

function renderGoals(goals, userId, space) {
  const container = document.getElementById('goalsList');

  if (goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">\uD83C\uDFAF</div>
        <div class="empty-title">No hay metas</div>
        <div class="empty-subtitle">Crea una nueva meta para empezar</div>
      </div>
    `;
    return;
  }

  let html = '';
  goals.forEach(g => {
    html += createGoalCardHtml(g, userId, space);
  });

  container.innerHTML = html;
  addGoalListeners(container, goals, userId, space);

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
    const goal = goals.find(g => g.id === id);
    if (item.dataset.action === 'edit' && goal) {
      showGoalModal(goal, space, userId);
    } else if (item.dataset.action === 'delete') {
      if (!confirm('\u00bfEliminar esta meta?')) return;
      window.supabase.from('goals').delete().eq('id', id).then(({ error }) => {
        if (error) { showToast('Error: ' + error.message, 'error'); return; }
        showToast('Meta eliminada', 'success');
        loadPage(userId, space);
      });
    }
  });
}

window.addEventListener('beforeunload', () => {
  if (goalsChannel) window.supabase.removeChannel(goalsChannel);
});

window.addEventListener('DOMContentLoaded', async () => {
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
