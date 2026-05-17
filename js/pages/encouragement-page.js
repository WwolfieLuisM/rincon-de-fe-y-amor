function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

let encouragementChannel = null;

function appendMessage(msg, userId, partnerName) {
  const container = document.getElementById('app');
  if (!container) return;

  let chatContainer = container.querySelector('.chat-container');
  if (!chatContainer) {
    chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    container.innerHTML = '';
    container.appendChild(chatContainer);
  }

  const emptyState = chatContainer.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  const isMine = msg.sender_id === userId;
  const name = isMine ? 'Tú' : partnerName;
  const time = new Date(msg.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (isMine ? 'mine encouragement' : 'other');
  bubble.innerHTML = `${msg.text}<div class="chat-meta">${name} · ${time}</div>`;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function loadPage(userId, space) {
  const headerAvatar = document.getElementById('headerAvatar');
  if (window.currentUser) {
    headerAvatar.textContent = (window.currentUser.name || '?').charAt(0).toUpperCase();
  }

  const { data: messages } = await window.supabase
    .from('encouragement')
    .select('*')
    .eq('space_id', space.id)
    .order('created_at', { ascending: true });

  const items = messages || [];
  const container = document.getElementById('app');
  const partnerName = window.currentPartner ? window.currentPartner.name || 'Pareja' : 'Pareja';

  let html = '<div class="chat-container">';

  if (items.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon"><i class="ti ti-message-2" style="font-size:48px;opacity:0.15"></i></div>
        <div class="empty-title">Comparte ánimo</div>
        <div class="empty-subtitle">Envía palabras de aliento a tu pareja</div>
      </div>
    `;
  } else {
    items.forEach(m => {
      const isMine = m.sender_id === userId;
      const name = isMine ? 'Tú' : partnerName;
      const time = new Date(m.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      html += `
        <div class="chat-bubble ${isMine ? 'mine encouragement' : 'other'}">
          ${m.text}
          <div class="chat-meta">${name} · ${time}</div>
        </div>
      `;
    });
  }

  html += '</div>';
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;

  const input = document.getElementById('encouragementInput');
  const sendBtn = document.getElementById('sendBtn');

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    sendBtn.disabled = true;

    const { error } = await window.supabase
      .from('encouragement')
      .insert({ space_id: space.id, sender_id: userId, text });

    if (error) {
      showToast('Error: ' + error.message, 'error');
      sendBtn.disabled = false;
      return;
    }

    await window.auth.logActivity(space.id, userId, 'encouragement', text, 'encouragement');
    input.value = '';
    sendBtn.disabled = false;
    showToast('Mensaje enviado ✅', 'success');
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
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

  const partnerName = window.currentPartner ? window.currentPartner.name || 'Pareja' : 'Pareja';
  encouragementChannel = window.supabase
    .channel('encouragement-' + space.id)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'encouragement',
      filter: 'space_id=eq.' + space.id,
    }, (payload) => {
      appendMessage(payload.new, session.user.id, partnerName);
    })
    .subscribe();
});

window.addEventListener('beforeunload', () => {
  if (encouragementChannel) {
    window.supabase.removeChannel(encouragementChannel);
  }
});
