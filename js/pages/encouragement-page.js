function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

let encouragementChannel = null;
let loadController = null;

function formatChatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (target.getTime() === today.getTime()) return 'Hoy';
  if (target.getTime() === yesterday.getTime()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isNewDay(prevDate, currentDate) {
  if (!prevDate) return true;
  const a = new Date(prevDate);
  const b = new Date(currentDate);
  return a.getFullYear() !== b.getFullYear()
    || a.getMonth() !== b.getMonth()
    || a.getDate() !== b.getDate();
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

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
  const time = formatTime(msg.created_at);

  const lastMsg = chatContainer.lastElementChild;
  if (isNewDay(lastMsg?.dataset?.date, msg.created_at)) {
    const sep = document.createElement('div');
    sep.className = 'chat-date-sep';
    sep.innerHTML = `<span>${formatChatDate(msg.created_at)}</span>`;
    chatContainer.appendChild(sep);
  }

  const row = document.createElement('div');
  row.className = 'chat-message-row ' + (isMine ? 'mine' : 'other');
  row.dataset.date = msg.created_at;

  let avatarHtml = '';
  if (!isMine) {
    avatarHtml = `<div class="chat-avatar">${name.charAt(0).toUpperCase()}</div>`;
  }

  row.innerHTML = `
    ${avatarHtml}
    <div class="chat-bubble ${isMine ? 'mine' : 'other'}">
      ${msg.text}
      <div class="chat-meta">${time}</div>
    </div>
  `;
  chatContainer.appendChild(row);
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
  let lastDate = null;

  items.forEach(m => {
    const isMine = m.sender_id === userId;
    const name = isMine ? 'Tú' : partnerName;
    const time = formatTime(m.created_at);

    if (isNewDay(lastDate, m.created_at)) {
      html += `<div class="chat-date-sep"><span>${formatChatDate(m.created_at)}</span></div>`;
    }
    lastDate = m.created_at;

    let avatarHtml = '';
    if (!isMine) {
      avatarHtml = `<div class="chat-avatar">${name.charAt(0).toUpperCase()}</div>`;
    }

    html += `
      <div class="chat-message-row ${isMine ? 'mine' : 'other'}">
        ${avatarHtml}
        <div class="chat-bubble ${isMine ? 'mine' : 'other'}">
          ${m.text}
          <div class="chat-meta">${time}</div>
        </div>
      </div>
    `;
  });

  if (items.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon"><i class="ti ti-message-2" style="font-size:48px;opacity:0.15"></i></div>
        <div class="empty-title">Conversación vacía</div>
        <div class="empty-subtitle">Envía el primer mensaje</div>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;

  const input = document.getElementById('encouragementInput');
  const sendBtn = document.getElementById('sendBtn');

  if (loadController) loadController.abort();
  loadController = new AbortController();
  const signal = loadController.signal;

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
    appendMessage({ text, sender_id: userId, created_at: new Date().toISOString() }, userId, partnerName);
    input.value = '';
    sendBtn.disabled = false;
  }

  sendBtn.addEventListener('click', sendMessage, { signal });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  }, { signal });
}

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

  const partnerName = window.currentPartner ? window.currentPartner.name || 'Pareja' : 'Pareja';
  encouragementChannel = window.supabase
    .channel('encouragement-' + space.id)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'encouragement',
      filter: 'space_id=eq.' + space.id,
    }, (payload) => {
      if (payload.new.sender_id !== session.user.id) {
        appendMessage(payload.new, session.user.id, partnerName);
      }
    })
    .subscribe();
});

window.addEventListener('beforeunload', () => {
  if (encouragementChannel) {
    window.supabase.removeChannel(encouragementChannel);
  }
});
