function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1) return 'ahora';
  if (diff < 60) return diff + 'm';
  if (diff < 1440) return Math.floor(diff / 60) + 'h';
  return Math.floor(diff / 1440) + 'd';
}

function getNotifIcon(type) {
  const map = {
    prayer: '<i class="ti ti-heart" style="color:#e8547a"></i>',
    gratitude: '<i class="ti ti-star" style="color:#fbbf24"></i>',
    encouragement: '<i class="ti ti-message-2" style="color:#60a5fa"></i>',
    goal: '<i class="ti ti-target" style="color:#34d399"></i>',
    date: '<i class="ti ti-calendar" style="color:#f472b6"></i>',
    streak: '<i class="ti ti-flame" style="color:#fb923c"></i>',
    devotional: '<i class="ti ti-heart-handshake" style="color:#c084fc"></i>',
    milestone: '<i class="ti ti-celebration" style="color:#fbbf24"></i>',
    bible_read: '<i class="ti ti-book" style="color:#60a5fa"></i>',
    notification: '<i class="ti ti-bell" style="color:#e8547a"></i>'
  };
  return map[type] || '<i class="ti ti-pin" style="color:var(--text-3)"></i>';
}

async function loadPage(userId, space) {
  const headerAvatar = document.getElementById('headerAvatar');
  if (window.currentUser) {
    headerAvatar.textContent = (window.currentUser.name || '?').charAt(0).toUpperCase();
  }

  localStorage.setItem('lastNotifVisit_' + space.id, new Date().toISOString());

  const items = await Notifications.getHistory(space.id);

  let html = '<div class="page-content">';

  if (items.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon"><i class="ti ti-bell-off" style="font-size:48px;opacity:0.15"></i></div>
        <div class="empty-title">No hay notificaciones</div>
        <div class="empty-subtitle">Las actividades de tu espacio aparecerán aquí</div>
      </div>
    `;
  } else {
    items.forEach(n => {
      const isMine = n.user_id === userId;
      const name = isMine ? 'Tú' : (window.currentPartner ? window.currentPartner.name || 'Pareja' : 'Pareja');
      html += `
        <div style="padding:0 16px;margin-bottom:8px">
          <div class="activity-card">
            <div class="activity-icon" style="background:transparent">${getNotifIcon(n.type)}</div>
            <div class="activity-info">
              <div class="activity-name">${name}</div>
              <div class="activity-text">${n.text}</div>
            </div>
            <div class="activity-time">${timeAgo(n.created_at)}</div>
          </div>
        </div>
      `;
    });
  }

  html += '</div>';
  document.getElementById('app').innerHTML = html;
}

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.ensureSession();
  if (!session) { window.location.href = 'index.html'; return; }

  const { data: space } = await window.supabase
    .from('spaces')
    .select('*')
    .or(`created_by.eq.${session.user.id},partner_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!space) { window.location.href = 'link.html'; return; }

  await initLayout();
  await loadPage(session.user.id, space);
});
