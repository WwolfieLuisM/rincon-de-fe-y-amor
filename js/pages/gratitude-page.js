function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

async function loadPage(userId, space) {
  const headerAvatar = document.getElementById('headerAvatar');
  if (window.currentUser) {
    headerAvatar.textContent = (window.currentUser.name || '?').charAt(0).toUpperCase();
  }

  const { data: gratitudes } = await window.supabase
    .from('gratitude')
    .select('*')
    .eq('space_id', space.id)
    .order('created_at', { ascending: true });

  const items = gratitudes || [];
  const container = document.getElementById('app');
  const partnerName = window.currentPartner ? window.currentPartner.name || 'Pareja' : 'Pareja';

  let html = '<div class="chat-container" id="chatContainer">';

  if (items.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon"><i class="ti ti-star" style="font-size:48px;opacity:0.15"></i></div>
        <div class="empty-title">Comparte tu gratitud</div>
        <div class="empty-subtitle">Escribe algo por lo que agradeces hoy</div>
      </div>
    `;
  } else {
    items.forEach(g => {
      const isMine = g.user_id === userId;
      const name = isMine ? 'Tú' : partnerName;
      const time = new Date(g.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      html += `
        <div class="chat-bubble ${isMine ? 'mine' : 'other'}">
          ${g.text}
          <div class="chat-meta">${name} · ${time}</div>
        </div>
      `;
    });
  }

  html += '</div>';
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;

  const input = document.getElementById('gratitudeInput');
  const sendBtn = document.getElementById('sendBtn');

  async function sendGratitude() {
    const text = input.value.trim();
    if (!text) return;

    sendBtn.disabled = true;

    const { error } = await window.supabase
      .from('gratitude')
      .insert({ space_id: space.id, user_id: userId, text });

    if (error) {
      showToast('Error: ' + error.message, 'error');
      sendBtn.disabled = false;
      return;
    }

    await window.auth.logActivity(space.id, userId, 'gratitude', text, 'gratitude');
    input.value = '';
    sendBtn.disabled = false;
    appendGratitude({ user_id: userId, text, created_at: new Date().toISOString() }, userId, partnerName);
  }

  sendBtn.addEventListener('click', sendGratitude);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendGratitude();
  });

  setupRealtime(space.id, userId, partnerName);
}

function appendGratitude(g, userId, partnerName) {
  const container = document.getElementById('chatContainer');
  if (!container) return;

  const emptyState = container.querySelector('.empty-state');
  if (emptyState) container.innerHTML = '';

  const isMine = g.user_id === userId;
  const name = isMine ? 'Tú' : partnerName;
  const time = new Date(g.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (isMine ? 'mine' : 'other');
  bubble.innerHTML = `${g.text}<div class="chat-meta">${name} · ${time}</div>`;
  container.appendChild(bubble);
  container.parentElement.scrollTop = container.parentElement.scrollHeight;
}

let realtimeChannel = null;

function setupRealtime(spaceId, userId, partnerName) {
  if (realtimeChannel) return;

  realtimeChannel = window.supabase
    .channel('gratitude-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'gratitude',
        filter: `space_id=eq.${spaceId}`
      },
      (payload) => {
        const g = payload.new;
        if (g.user_id !== userId) {
          appendGratitude(g, userId, partnerName);
        }
      }
    )
    .subscribe();
}

window.addEventListener('beforeunload', () => {
  if (realtimeChannel) {
    window.supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
});

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
