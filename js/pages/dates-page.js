function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

function daysUntilNext(dateStr) {
  const today = new Date();
  const d = new Date(dateStr);
  let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next <= today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

const TYPE_LABELS = {
  anniversary: 'Aniversario',
  birthday: 'Cumpleaños',
  special: 'Especial',
  general: 'General'
};

function showDateModal(dateItem, space, userId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-title">${dateItem ? 'Editar fecha' : 'Nueva fecha'}</div>
      <div class="input-group">
        <label class="input-label">Título</label>
        <input class="input-field" id="dateTitleInput" value="${dateItem ? dateItem.title : ''}" placeholder="Ej. Aniversario">
      </div>
      <div class="input-group">
        <label class="input-label">Fecha</label>
        <input class="input-field" type="date" id="dateInput" value="${dateItem ? dateItem.date : ''}">
      </div>
      <div class="input-group">
        <label class="input-label">Tipo</label>
        <select class="input-field" id="dateTypeInput">
          <option value="anniversary" ${dateItem && dateItem.type === 'anniversary' ? 'selected' : ''}>Aniversario</option>
          <option value="birthday" ${dateItem && dateItem.type === 'birthday' ? 'selected' : ''}>Cumpleaños</option>
          <option value="special" ${dateItem && dateItem.type === 'special' ? 'selected' : ''}>Especial</option>
          <option value="general" ${dateItem && dateItem.type === 'general' ? 'selected' : ''}>General</option>
        </select>
      </div>
      <button class="btn-primary w-full" id="saveDateBtn">${dateItem ? 'Guardar cambios' : 'Crear fecha'}</button>
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

  document.getElementById('saveDateBtn').addEventListener('click', async () => {
    const title = document.getElementById('dateTitleInput').value.trim();
    const dateVal = document.getElementById('dateInput').value;
    const type = document.getElementById('dateTypeInput').value;

    if (!title || !dateVal) {
      showToast('Completa todos los campos', 'error');
      return;
    }

    if (dateItem) {
      const { error } = await window.supabase
        .from('special_dates')
        .update({ title, date: dateVal, type })
        .eq('id', dateItem.id);

      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }
      showToast('Fecha actualizada ✓', 'success');
    } else {
      const { error } = await window.supabase
        .from('special_dates')
        .insert({ space_id: space.id, user_id: userId, title, date: dateVal, type });

      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }
      await window.auth.logActivity(space.id, userId, 'date', 'Nueva fecha: ' + title, 'dates');
      showToast('Fecha creada ✓', 'success');
    }

    overlay.remove();
    loadPage(userId, space);
  });
}

async function loadPage(userId, space) {
  const headerAvatar = document.getElementById('headerAvatar');
  if (window.currentUser) {
    headerAvatar.textContent = (window.currentUser.name || '?').charAt(0).toUpperCase();
  }

  const { data: dates } = await window.supabase
    .from('special_dates')
    .select('*')
    .eq('space_id', space.id)
    .order('date', { ascending: true });

  const items = dates || [];
  items.sort((a, b) => daysUntilNext(a.date) - daysUntilNext(b.date));

  let html = '<div class="page-content">';

  if (items.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <div class="empty-title">No hay fechas especiales</div>
        <div class="empty-subtitle">Agrega aniversarios, cumpleaños y más</div>
      </div>
    `;
  } else {
    items.forEach(d => {
      const days = daysUntilNext(d.date);
      let badge = '';
      if (days === 0) {
        badge = '<span class="badge badge-today">🎉 ¡Hoy!</span>';
      } else {
        badge = `<span class="badge badge-soon">En ${days} días</span>`;
      }

      const typeLabel = TYPE_LABELS[d.type] || 'General';

      html += `
        <div class="date-card">
          <div class="date-info">
            <div class="date-title">${d.title}</div>
            <div class="date-type">${typeLabel} · ${formatDateDisplay(d.date)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${badge}
            <button class="btn-soft date-del-btn" data-id="${d.id}" style="color:#f87171;border-color:#f8717133">✕</button>
          </div>
        </div>
      `;
    });
  }

  html += '</div>';
  document.getElementById('app').innerHTML = html;

  document.querySelectorAll('.date-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta fecha?')) return;
      const { error } = await window.supabase.from('special_dates').delete().eq('id', btn.dataset.id);
      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }
      showToast('Fecha eliminada', 'success');
      loadPage(userId, space);
    });
  });

  document.getElementById('addDateBtn').addEventListener('click', () => {
    showDateModal(null, space, userId);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) { window.location.href = 'index.html'; return; }

  const { data: space } = await window.supabase
    .from('spaces')
    .select('*')
    .or(`created_by.eq.${session.user.id},partner_id.eq.${session.user.id}`)
    .single();
  if (!space) { window.location.href = 'link.html'; return; }

  await initLayout();
  await loadPage(session.user.id, space);
});
