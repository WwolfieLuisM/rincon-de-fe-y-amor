function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

const EMOJIS = ['❤️', '🙏', '👏', '🔥'];
const TYPE_LABELS = { testimony: 'Testimonio', prayer: 'Oración', goal: 'Meta' };
const TYPE_ICONS = { testimony: '⭐', prayer: '🙏', goal: '🎯' };

let realtimeChannel = null;

function showTestimonyModal(item, spaceId, userId) {
  const isEdit = !!item;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-title">${isEdit ? 'Editar testimonio' : 'Nuevo testimonio'}</div>
      <div class="input-group">
        <label class="input-label">Tipo</label>
        <select class="input-field" id="testimonyTypeInput">
          <option value="testimony" ${isEdit && item.category === 'testimony' ? 'selected' : ''}>⭐ Testimonio</option>
          <option value="prayer" ${isEdit && item.category === 'prayer' ? 'selected' : ''}>🙏 Oración</option>
          <option value="goal" ${isEdit && item.category === 'goal' ? 'selected' : ''}>🎯 Meta</option>
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Texto</label>
        <textarea class="input-field" id="testimonyTextInput" rows="4" style="resize:none" placeholder="Comparte tu testimonio...">${isEdit ? item.text : ''}</textarea>
      </div>
      <button class="btn-primary w-full" id="saveTestimonyBtn">${isEdit ? 'Guardar cambios' : 'Compartir'}</button>
      <button class="btn-primary w-full" style="background:var(--surface-2);color:var(--text-2);margin-top:8px" id="cancelModalBtn">Cancelar</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const sheet = overlay.querySelector('.modal-sheet');
  setTimeout(() => sheet.style.transform = 'translateX(-50%) translateY(0)', 10);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('cancelModalBtn').addEventListener('click', () => overlay.remove());

  document.getElementById('saveTestimonyBtn').addEventListener('click', async () => {
    const textInput = document.getElementById('testimonyTextInput');
    const typeInput = document.getElementById('testimonyTypeInput');
    const text = textInput.value.trim();
    const category = typeInput.value;
    if (!text) { showToast('Escribe algo', 'error'); return; }

    if (isEdit) {
      const { error } = await window.supabase.from('gratitude').update({ text, category }).eq('id', item.id);
      if (error) { showToast('Error: ' + error.message, 'error'); return; }
      showToast('Testimonio actualizado ✓', 'success');
    } else {
      const { error } = await window.supabase.from('gratitude').insert({ space_id: spaceId, user_id: userId, text, category });
      if (error) { showToast('Error: ' + error.message, 'error'); return; }
      await window.auth.logActivity(spaceId, userId, 'testimony', text, 'gratitude');
      showToast('Testimonio compartido ✓', 'success');
    }

    overlay.remove();
    await loadPage(userId, { id: spaceId });
  });

  if (!isEdit) setTimeout(() => document.getElementById('testimonyTextInput').focus(), 200);
}

function createCardHtml(g, userId, partnerName) {
  const isMine = g.user_id === userId;
  const name = isMine ? 'Tú' : partnerName;
  const date = new Date(g.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const category = g.category || 'testimony';
  const icon = TYPE_ICONS[category] || '⭐';
  const label = TYPE_LABELS[category] || 'Testimonio';
  const reactions = g.reactions || {};

  const activeEmojis = EMOJIS.filter(emoji => {
    const users = reactions[emoji] || [];
    return users.length > 0;
  });

  let summaryHtml = '';
  if (activeEmojis.length > 0) {
    summaryHtml = '<div class="reaction-summary">' +
      activeEmojis.map(emoji => {
        const count = (reactions[emoji] || []).length;
        return `<span class="reaction-summary-item">${emoji} ${count}</span>`;
      }).join('') +
      '</div>';
  }

  const editDelHtml = isMine ? `
    <div style="display:flex;gap:8px;flex-shrink:0">
      <button class="btn-soft testimony-edit-btn" data-id="${g.id}">Editar</button>
      <button class="btn-soft testimony-del-btn" data-id="${g.id}" style="color:#f87171;border-color:#f8717133">✕</button>
    </div>
  ` : '';

  return `
    <div class="prayer-card testimony-card" data-id="${g.id}" data-userid="${g.user_id}">
      <div class="prayer-header">
        <div class="prayer-icon ${category}">${icon}</div>
        <div class="prayer-title">${name}</div>
        ${editDelHtml}
      </div>
      <div style="font-size:12px;color:var(--text-2);margin-bottom:8px">${date} · <span class="testimony-badge ${category}">${icon} ${label}</span></div>
      <div class="testimony-text">${g.text}</div>
      ${summaryHtml}
    </div>
  `;
}

function updateCardReactions(g, userId) {
  const reactions = g.reactions || {};
  const card = document.querySelector(`.testimony-card[data-id="${g.id}"]`);
  if (!card) return;

  const activeEmojis = EMOJIS.filter(emoji => {
    const users = reactions[emoji] || [];
    return users.length > 0;
  });

  let summaryHtml = '';
  if (activeEmojis.length > 0) {
    summaryHtml = '<div class="reaction-summary">' +
      activeEmojis.map(emoji => {
        const count = (reactions[emoji] || []).length;
        return `<span class="reaction-summary-item">${emoji} ${count}</span>`;
      }).join('') +
      '</div>';
  }

  let existing = card.querySelector('.reaction-summary');
  if (existing) existing.remove();
  if (summaryHtml) card.insertAdjacentHTML('beforeend', summaryHtml);
}

async function loadPage(userId, space) {
  const headerAvatar = document.getElementById('headerAvatar');
  if (window.currentUser) {
    headerAvatar.textContent = (window.currentUser.name || '?').charAt(0).toUpperCase();
  }

  const { data: items } = await window.supabase
    .from('gratitude')
    .select('*')
    .eq('space_id', space.id)
    .order('created_at', { ascending: false });

  const container = document.getElementById('app');
  const partnerName = window.currentPartner ? window.currentPartner.name || 'Pareja' : 'Pareja';

  let html = '<div class="page-content" id="testimonyFeed">';

  if (!items || items.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon">⭐</div>
        <div class="empty-title">Comparte tu testimonio</div>
        <div class="empty-subtitle">Escribe algo que Dios ha hecho en tu vida</div>
      </div>
    `;
  } else {
    items.forEach(g => {
      html += createCardHtml(g, userId, partnerName);
    });
  }

  html += '</div>';
  container.innerHTML = html;

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('.testimony-edit-btn');
    if (btn) {
      const g = items.find(i => i.id === btn.dataset.id);
      if (g) showTestimonyModal(g, space.id, userId);
      return;
    }

    const delBtn = e.target.closest('.testimony-del-btn');
    if (delBtn) {
      if (!confirm('¿Eliminar este testimonio?')) return;
      await window.supabase.from('gratitude').delete().eq('id', delBtn.dataset.id);
      showToast('Testimonio eliminado', 'success');
      await loadPage(userId, space);
      return;
    }
  });

  let longPressTimer = null;
  let longPressCard = null;

  container.addEventListener('touchstart', (e) => {
    const card = e.target.closest('.testimony-card');
    if (!card) return;
    longPressCard = card;
    longPressTimer = setTimeout(() => {
      showReactionPopup(card, userId);
    }, 500);
  }, { passive: true });

  container.addEventListener('touchend', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressCard = null;
  });

  container.addEventListener('touchmove', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  setupRealtime(space.id, userId, partnerName);
}

function showReactionPopup(card, userId) {
  const id = card.dataset.id;
  const rect = card.getBoundingClientRect();

  const popup = document.createElement('div');
  popup.className = 'reaction-popup';
  popup.innerHTML = EMOJIS.map(emoji =>
    `<button class="reaction-popup-btn" data-id="${id}" data-emoji="${emoji}">${emoji}</button>`
  ).join('');

  const top = rect.top - 60;
  popup.style.top = Math.max(10, top) + 'px';
  popup.style.left = '50%';
  popup.style.transform = 'translateX(-50%)';
  document.body.appendChild(popup);

  const removePopup = () => { if (popup.parentNode) popup.remove(); };

  popup.addEventListener('click', async (e) => {
    const btn = e.target.closest('.reaction-popup-btn');
    if (!btn) return;
    const gId = btn.dataset.id;
    const emoji = btn.dataset.emoji;
    try {
      await window.supabase.rpc('toggle_reaction', { p_gratitude_id: gId, p_user_id: userId, p_emoji: emoji });
    } catch (err) {
      console.error('Reaction error:', err);
    }
    removePopup();
  });

  setTimeout(() => {
    document.addEventListener('click', removePopup, { once: true });
    document.addEventListener('touchstart', removePopup, { once: true });
  }, 50);
}

function setupRealtime(spaceId, userId, partnerName) {
  if (realtimeChannel) {
    window.supabase.removeChannel(realtimeChannel);
  }

  realtimeChannel = window.supabase
    .channel('testimony-changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'gratitude',
      filter: `space_id=eq.${spaceId}`
    }, (payload) => {
      const g = payload.new;
      if (g.user_id !== userId) {
        const feed = document.getElementById('testimonyFeed');
        if (!feed) return;
        const emptyState = feed.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
        feed.insertAdjacentHTML('afterbegin', createCardHtml(g, userId, partnerName));
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'gratitude',
      filter: `space_id=eq.${spaceId}`
    }, (payload) => {
      updateCardReactions(payload.new, userId);
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'gratitude',
      filter: `space_id=eq.${spaceId}`
    }, (payload) => {
      const card = document.querySelector(`.testimony-card[data-id="${payload.old.id}"]`);
      if (card) card.remove();
    })
    .subscribe();
}

window.addEventListener('beforeunload', () => {
  if (realtimeChannel) {
    window.supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
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

  document.getElementById('addTestimonyBtn').addEventListener('click', () => {
    showTestimonyModal(null, space.id, session.user.id);
  });
});
