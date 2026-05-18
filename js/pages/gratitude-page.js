function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

const EMOJIS = ['❤️', '🙏', '👏', '🔥'];
const TYPE_LABELS = { testimony: 'Testimonio', prayer: 'Oración', goal: 'Meta' };
const TYPE_ICONS = { testimony: '⭐', prayer: '🙏', goal: '🎯' };

let selectedType = 'testimony';
let realtimeChannel = null;

function createCardHtml(g, userId, partnerName) {
  const isMine = g.user_id === userId;
  const name = isMine ? 'Tú' : partnerName;
  const date = new Date(g.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const category = g.category || 'testimony';
  const icon = TYPE_ICONS[category] || '⭐';
  const label = TYPE_LABELS[category] || 'Testimonio';
  const reactions = g.reactions || {};

  let reactionsHtml = EMOJIS.map(emoji => {
    const users = reactions[emoji] || [];
    const count = users.length;
    const active = users.includes(userId);
    return `
      <button class="reaction-btn ${active ? 'active' : ''}" data-id="${g.id}" data-emoji="${emoji}">
        ${emoji} <span class="reaction-count">${count || ''}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="testimony-card" data-id="${g.id}">
      <div class="testimony-header">
        <div class="testimony-avatar">${name.charAt(0).toUpperCase()}</div>
        <span class="testimony-author">${name}</span>
        <span class="testimony-date">${date}</span>
      </div>
      <div class="testimony-text">${g.text}</div>
      <div class="testimony-badge ${category}">${icon} ${label}</div>
      <div class="testimony-reactions" data-id="${g.id}">
        ${reactionsHtml}
      </div>
    </div>
  `;
}

function updateCardReactions(g, userId) {
  const reactions = g.reactions || {};
  const container = document.querySelector(`.testimony-reactions[data-id="${g.id}"]`);
  if (!container) return;

  container.innerHTML = EMOJIS.map(emoji => {
    const users = reactions[emoji] || [];
    const count = users.length;
    const active = users.includes(userId);
    return `
      <button class="reaction-btn ${active ? 'active' : ''}" data-id="${g.id}" data-emoji="${emoji}">
        ${emoji} <span class="reaction-count">${count || ''}</span>
      </button>
    `;
  }).join('');
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

  let html = '<div class="testimony-feed" id="testimonyFeed">';

  if (!items || items.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon"><i class="ti ti-star" style="font-size:48px;opacity:0.15"></i></div>
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
    const btn = e.target.closest('.reaction-btn');
    if (!btn) return;

    const id = btn.dataset.id;
    const emoji = btn.dataset.emoji;

    try {
      await window.supabase.rpc('toggle_reaction', {
        p_gratitude_id: id,
        p_user_id: userId,
        p_emoji: emoji
      });
    } catch (err) {
      console.error('Reaction error:', err);
    }
  });

  setupInput(userId, space);
  setupRealtime(space.id, userId, partnerName);
}

function setupInput(userId, space) {
  const input = document.getElementById('gratitudeInput');
  const sendBtn = document.getElementById('sendBtn');

  const typeSelector = document.createElement('div');
  typeSelector.className = 'type-selector';
  typeSelector.innerHTML = `
    <div class="type-option testimony active" data-type="testimony">⭐ Testimonio</div>
    <div class="type-option prayer" data-type="prayer">🙏 Oración</div>
    <div class="type-option goal" data-type="goal">🎯 Meta</div>
  `;

  const inputBar = document.querySelector('.chat-input-bar');
  inputBar.parentNode.insertBefore(typeSelector, inputBar);

  typeSelector.addEventListener('click', (e) => {
    const opt = e.target.closest('.type-option');
    if (!opt) return;
    typeSelector.querySelectorAll('.type-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    selectedType = opt.dataset.type;
    input.placeholder = selectedType === 'testimony' ? 'Comparte tu testimonio...'
      : selectedType === 'prayer' ? 'Comparte tu oración...'
      : 'Comparte tu meta...';
  });

  async function sendTestimony() {
    const text = input.value.trim();
    if (!text) return;

    sendBtn.disabled = true;

    const { error } = await window.supabase
      .from('gratitude')
      .insert({ space_id: space.id, user_id: userId, text, category: selectedType });

    if (error) {
      showToast('Error: ' + error.message, 'error');
      sendBtn.disabled = false;
      return;
    }

    await window.auth.logActivity(space.id, userId, 'testimony', text, 'gratitude');
    input.value = '';
    sendBtn.disabled = false;
    showToast('Testimonio compartido ✅', 'success');
    await loadPage(userId, space);
  }

  sendBtn.addEventListener('click', sendTestimony);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendTestimony();
  });
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
      const g = payload.new;
      updateCardReactions(g, userId);
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
});
