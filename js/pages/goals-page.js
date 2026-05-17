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

function showGoalModal(goal, space, userId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-title">${goal ? 'Editar meta' : 'Nueva meta'}</div>
      <div class="input-group">
        <label class="input-label">Título</label>
        <input class="input-field" id="goalTitleInput" value="${goal ? goal.title : ''}" placeholder="¿Cuál es tu meta?">
      </div>
      <div class="input-group">
        <label class="input-label">Fecha límite</label>
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
      showToast('Ingresa un título', 'error');
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
      showToast('Meta actualizada ✓', 'success');
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
      showToast('Meta creada ✓', 'success');
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

  let activeTab = 'active';

  const { data: goals } = await window.supabase
    .from('goals')
    .select('*')
    .eq('space_id', space.id)
    .order('created_at', { ascending: false });

  const items = goals || [];
  const activeGoals = items.filter(g => !g.completed);
  const completedGoals = items.filter(g => g.completed);

  let html = '<div class="page-content">';

  html += `
    <div class="tabs">
      <button class="tab active" data-tab="active">Activas (${activeGoals.length})</button>
      <button class="tab" data-tab="completed">Completadas (${completedGoals.length})</button>
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
      activeTab = tab.dataset.tab;
      renderGoals(activeTab === 'active' ? activeGoals : completedGoals, userId, space);
    });
  });

  renderGoals(activeGoals, userId, space);

  document.getElementById('addGoalBtn').addEventListener('click', () => {
    showGoalModal(null, space, userId);
  });
}

function renderGoals(goals, userId, space) {
  const container = document.getElementById('goalsList');

  if (goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <div class="empty-title">No hay metas</div>
        <div class="empty-subtitle">Crea una nueva meta para empezar</div>
      </div>
    `;
    return;
  }

  let html = '';
  goals.forEach(g => {
    const pct = Math.min(100, g.progress || 0);
    html += `
      <div class="goal-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between">
          <div>
            <div class="goal-title">${g.title}</div>
            ${g.target_date ? `<div class="goal-date"><i class="ti ti-calendar"></i> ${formatDate(g.target_date)}</div>` : ''}
          </div>
          ${!g.completed ? `<button class="btn-soft goal-del-btn" data-id="${g.id}" style="color:#f87171;border-color:#f8717133">✕</button>` : ''}
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
  });

  container.innerHTML = html;

  document.querySelectorAll('.goal-progress-btn').forEach(btn => {
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
        showToast('🎉 ¡Meta completada!', 'success');
        await window.auth.logActivity(space.id, userId, 'goal', 'Meta completada: ' + goal.title, 'goals');
      } else {
        showToast('Progreso actualizado ✓', 'success');
      }

      await loadPage(userId, space);
    });
  });

  document.querySelectorAll('.goal-complete-btn').forEach(btn => {
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
      showToast('🎉 ¡Meta completada!', 'success');
      await loadPage(userId, space);
    });
  });

  document.querySelectorAll('.goal-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta meta?')) return;
      const { error } = await window.supabase.from('goals').delete().eq('id', btn.dataset.id);
      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }
      showToast('Meta eliminada', 'success');
      await loadPage(userId, space);
    });
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
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
