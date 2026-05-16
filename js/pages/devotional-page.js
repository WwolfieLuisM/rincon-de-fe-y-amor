function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

async function loadPage(userId, space) {
  const userName = window.currentUser ? window.currentUser.name || 'Tú' : 'Tú';
  const partnerName = window.currentPartner ? window.currentPartner.name : 'Pareja';
  const timeInfo = window.Devotional.getTimeLabel();

  document.getElementById('devHeaderTitle').textContent = timeInfo.title;
  document.getElementById('headerAvatar').textContent = userName.charAt(0).toUpperCase();

  const [personalDev, sharedDev] = await Promise.all([
    window.Devotional.getToday(false),
    space.mode === 'couple' ? window.Devotional.getToday(true) : null
  ]);

  let html = '';

  if (personalDev) {
    const alreadyRead = await window.Devotional.hasReadToday(userId, personalDev.id);

    if (!alreadyRead) {
      await window.Devotional.markAsRead(userId, personalDev.id);
      await window.auth.logActivity(space.id, userId, 'devotional', 'Leyó el devocional de ' + timeInfo.time, 'devotional');
    }

    const verse = personalDev.verses;

    html += `
      <div style="padding:16px">
        <div class="devocional-hero">
          <div class="devocional-greeting">${timeInfo.label}, ${userName.split(' ')[0]} ${timeInfo.icon}</div>
          <div class="devocional-time-badge ${timeInfo.time}">${timeInfo.time === 'morning' ? 'Mañana' : timeInfo.time === 'afternoon' ? 'Tarde' : 'Noche'}</div>
          ${alreadyRead ? '<div class="devocional-read-badge"><i class="ti ti-check" style="font-size:14px"></i> Leído hoy</div>' : ''}
          <div class="devocional-verse">"${verse.text}"</div>
          <div class="devocional-reference">— ${verse.reference}</div>
          <div class="devocional-reflection">${personalDev.reflection}</div>
          <div class="devocional-question">
            <div class="devocional-q-icon"><i class="ti ti-message-circle"></i></div>
            <div class="devocional-q-text">${personalDev.question}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div style="padding:16px">
        <div class="devocional-hero">
          <div class="devocional-greeting">${timeInfo.label}, ${userName.split(' ')[0]} ${timeInfo.icon}</div>
          <div style="text-align:center;padding:20px 0;color:var(--text-3)">
            <i class="ti ti-cloud" style="font-size:40px;display:block;margin-bottom:10px"></i>
            No hay devocional disponible para este momento
          </div>
        </div>
      </div>
    `;
  }

  if (sharedDev && space.mode === 'couple') {
    const verse = sharedDev.verses;
    html += `
      <div style="padding:0 16px;margin-bottom:12px">
        <div class="devocional-shared">
          <div class="devocional-shared-header"><i class="ti ti-heart-handshake"></i> Devocional Compartido</div>
          <div class="devocional-verse" style="font-size:15px">"${verse.text}"</div>
          <div class="devocional-reference">— ${verse.reference}</div>
          <div class="devocional-reflection" style="margin-top:10px">${sharedDev.reflection}</div>
          ${sharedDev.question ? `<div class="devocional-question" style="margin-top:12px">
            <div class="devocional-q-icon"><i class="ti ti-message-circle"></i></div>
            <div class="devocional-q-text">${sharedDev.question}</div>
          </div>` : ''}
          <div class="devocional-shared-footer">Comparte este momento con ${partnerName} 💕</div>
        </div>
      </div>
    `;
  }

  const history = await window.Devotional.getHistory(userId);
  if (history.length > 0) {
    html += `<div class="section-label">Historial de lecturas</div>`;
    html += `<div style="padding:0 16px;margin-bottom:12px">`;
    history.forEach(h => {
      const d = h.devotionals;
      if (!d) return;
      const v = d.verses;
      const date = new Date(h.read_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      html += `
        <div class="activity-card" style="margin-bottom:8px">
          <div class="activity-icon" style="background:#a855f722;color:#a855f7"><i class="ti ti-heart-handshake"></i></div>
          <div class="activity-info">
            <div class="activity-text" style="color:#e0e0e0">${d.time_of_day === 'morning' ? 'Mañana' : d.time_of_day === 'afternoon' ? 'Tarde' : 'Noche'}</div>
            <div class="activity-name" style="font-size:12px">${v ? v.reference : ''}</div>
          </div>
          <div class="activity-time">${date}</div>
        </div>
      `;
    });
    html += `</div>`;
  }

  document.getElementById('app').innerHTML = html;
}

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
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
