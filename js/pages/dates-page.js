function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

let datesChannel = null;
let _datesUserId = null;
let _datesSpace = null;

function setupDatesRealtime(spaceId, userId) {
  if (datesChannel) window.supabase.removeChannel(datesChannel);

  datesChannel = window.supabase
    .channel('dates-' + spaceId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'special_dates',
      filter: 'space_id=eq.' + spaceId,
    }, (payload) => {
      if (payload.new.user_id === userId) return;
      loadPage(_datesUserId, _datesSpace);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'special_dates',
      filter: 'space_id=eq.' + spaceId,
    }, (payload) => {
      if (payload.new.user_id === userId) return;
      loadPage(_datesUserId, _datesSpace);
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'special_dates',
      filter: 'space_id=eq.' + spaceId,
    }, (payload) => {
      loadPage(_datesUserId, _datesSpace);
    })
    .subscribe();
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
  birthday: 'Cumplea\u00f1os',
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
        <label class="input-label">T\u00edtulo</label>
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
          <option value="birthday" ${dateItem && dateItem.type === 'birthday' ? 'selected' : ''}>Cumplea\u00f1os</option>
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
      showToast('Fecha actualizada \u2713', 'success');
    } else {
      const { error } = await window.supabase
        .from('special_dates')
        .insert({ space_id: space.id, user_id: userId, title, date: dateVal, type });

      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }
      await window.auth.logActivity(space.id, userId, 'date', 'Nueva fecha: ' + title, 'dates');
      showToast('Fecha creada \u2713', 'success');
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

  _datesUserId = userId;
  _datesSpace = space;

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
        <div class="empty-icon"><i class="ti ti-calendar" style="font-size:48px;opacity:0.15"></i></div>
        <div class="empty-title">No hay fechas especiales</div>
        <div class="empty-subtitle">Agrega aniversarios, cumplea\u00f1os y m\u00e1s</div>
      </div>
    `;
  } else {
    html += '<div id="datesList">';
    items.forEach(d => {
      const days = daysUntilNext(d.date);
      let badge = '';
      if (days === 0) {
        badge = '<span class="badge badge-today"><i class="ti ti-celebration"></i> \u00a1Hoy!</span>';
      } else {
        badge = '<span class="badge badge-soon">En ' + days + ' d\u00edas</span>';
      }

      const typeLabel = TYPE_LABELS[d.type] || 'General';

      html += `
        <div class="date-card">
          <div class="date-info">
            <div class="date-title">${d.title}</div>
            <div class="date-type">${typeLabel} \u00b7 ${formatDateDisplay(d.date)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${badge}
            <div class="three-dot-wrap">
              <button class="three-dot-btn" data-id="${d.id}">\u22ee</button>
              <div class="three-dot-menu">
                <button class="three-dot-item" data-action="edit" data-id="${d.id}"><i class="ti ti-edit"></i> Editar</button>
                <button class="three-dot-item danger" data-action="delete" data-id="${d.id}"><i class="ti ti-trash"></i> Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div>';
  document.getElementById('app').innerHTML = html;

  const container = document.getElementById('datesList');
  if (container) {
    container.addEventListener('click', (e) => {
      const dotBtn = e.target.closest('.three-dot-btn');
      if (dotBtn) {
        e.stopPropagation();
        const menu = dotBtn.parentElement.querySelector('.three-dot-menu');
        const wasOpen = menu.classList.contains('open');
        document.querySelectorAll('.three-dot-menu.open').forEach(m => {
          if (m.closest('.three-dot-wrap') !== dotBtn.parentElement) {
            m.classList.remove('open');
            const c = m.closest('.date-card');
            if (c) c.style.zIndex = '';
          }
        });
        menu.classList.toggle('open');
        const card = dotBtn.closest('.date-card');
        if (card) card.style.zIndex = wasOpen ? '' : '2';
        return;
      }

      const item = e.target.closest('.three-dot-item');
      if (!item) return;
      item.closest('.three-dot-menu').classList.remove('open');
      const card = item.closest('.date-card');
      if (card) card.style.zIndex = '';
      const id = item.dataset.id;
      const dateItem = items.find(d => d.id === id);
      if (item.dataset.action === 'edit' && dateItem) {
        showDateModal(dateItem, space, userId);
      } else if (item.dataset.action === 'delete') {
        if (!confirm('\u00bfEliminar esta fecha?')) return;
        window.supabase.from('special_dates').delete().eq('id', id).then(({ error }) => {
          if (error) { showToast('Error: ' + error.message, 'error'); return; }
          showToast('Fecha eliminada', 'success');
          loadPage(userId, space);
        });
      }
    });
  }

  document.getElementById('addDateBtn').addEventListener('click', () => {
    showDateModal(null, space, userId);
  });

  setupDatesRealtime(space.id, userId);
}

window.addEventListener('beforeunload', () => {
  if (datesChannel) window.supabase.removeChannel(datesChannel);
});

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.ensureSession();
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

document.addEventListener('click', () => {
  document.querySelectorAll('.three-dot-menu.open').forEach(m => {
    m.classList.remove('open');
    const card = m.closest('.date-card');
    if (card) card.style.zIndex = '';
  });
});
