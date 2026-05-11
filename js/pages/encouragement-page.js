function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
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
        <div class="empty-icon">💬</div>
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
    await loadPage(userId, space);
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
});
