function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

const MILESTONE_MESSAGES = {
  7: '¡Una semana orando juntos! 🌟',
  30: '¡Un mes de fidelidad! 🎉',
  100: '¡Cien días de racha! 🏆',
  365: '¡Un año entero! 🎊',
  1000: '¡MIL DÍAS! Increíble 🙌'
};

function fireConfetti() {
  const colors = ['#e8547a', '#a855f7', '#fbbf24', '#fff', '#f472b6'];
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const size = 6 + Math.random() * 8;
    const rot = Math.random() * 360;
    piece.style.cssText = `left:${left}%;width:${size}px;height:${size*0.6}px;background:${color};animation-delay:${delay}s;transform:rotate(${rot}deg)`;
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 3000);
}

async function loadPage(userId, space) {
  const today = new Date().toISOString().split('T')[0];
  const userName = window.currentUser ? window.currentUser.name || 'Tú' : 'Tú';
  const partnerName = window.currentPartner ? window.currentPartner.name : 'Pareja';

  const headerAvatar = document.getElementById('headerAvatar');
  headerAvatar.textContent = userName.charAt(0).toUpperCase();

  const [streak, todayMarks, history, verse] = await Promise.all([
    window.streakService.getStreak(space.id),
    window.streakService.getTodayMarks(space.id, today),
    window.streakService.getHistory(space.id, 7),
    window.streakService.getSharedVerse()
  ]);

  const count = streak ? streak.count : 0;
  const best = streak ? (streak.best_count || 0) : 0;
  const shieldDays = streak ? (streak.shield_days || 0) : 0;
  const shieldsAtLevel = window.streakService.calculateShields(count);
  const userMarked = todayMarks.includes(userId);
  const partnerMarked = space.mode === 'couple' ? todayMarks.length >= 2 : true;
  const anyMarked = todayMarks.length > 0;

  const nextMilestone = [7, 30, 100, 365, 1000].find(m => count < m) || count + 1;
  const progressToNext = count > 0 ? (count / nextMilestone) * 100 : 0;
  const circumference = 2 * Math.PI * 72;
  const offset = circumference - (progressToNext / 100) * circumference;

  let html = '';

  html += `
    <div style="padding:16px">
      <div class="streak-hero-card">
        <div class="streak-hero-ring">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="72" fill="none" stroke="#1e1e1e" stroke-width="8"/>
            <circle id="streakProgressRing" cx="90" cy="90" r="72" fill="none" stroke="var(--accent)" stroke-width="8"
              stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
              stroke-linecap="round" transform="rotate(-90 90 90)"
              style="transition: stroke-dashoffset 0.8s ease"/>
          </svg>
          <div class="streak-hero-number" id="streakHeroNumber">${count}</div>
        </div>
        <div class="streak-hero-label">días de racha</div>
        <div class="streak-user-chips">
          <div class="streak-chip ${userMarked ? 'marked' : ''}">
            <div class="chip-avatar">${userName.charAt(0).toUpperCase()}</div>
            <div class="chip-name">${userName}</div>
            <div class="chip-heart">${userMarked ? '❤️' : '🤍'}</div>
          </div>
          ${space.mode === 'couple' ? `
          <div class="streak-chip ${partnerMarked ? 'marked' : ''}">
            <div class="chip-avatar">${partnerName.charAt(0).toUpperCase()}</div>
            <div class="chip-name">${partnerName}</div>
            <div class="chip-heart">${partnerMarked ? '❤️' : '🤍'}</div>
          </div>` : ''}
        </div>
        <button class="streak-btn-pray ${userMarked ? 'done' : ''}" id="prayBtn" ${userMarked ? 'disabled' : ''}>
          ${userMarked ? '<i class="ti ti-check" style="font-size:20px"></i> Ya oraste hoy ✅' : '<i class="ti ti-flame" style="font-size:20px"></i> Oramos hoy 🙏'}
        </button>
      </div>
    </div>
  `;

  if (streak) {
    const shieldIcons = [];
    const usedShields = shieldsAtLevel - shieldDays;
    for (let i = 0; i < shieldDays; i++) shieldIcons.push('<span class="shield-icon shield-active">🛡️</span>');
    for (let i = 0; i < usedShields; i++) shieldIcons.push('<span class="shield-icon shield-used">🛡️</span>');
    const nextLevel = shieldsAtLevel === 0 ? 10 : shieldsAtLevel === 1 ? 100 : shieldsAtLevel === 5 ? 1000 : null;

    html += `
      <div style="padding:0 16px;margin-bottom:12px">
        <div class="streak-section-card">
          <div class="streak-section-title">🛡️ Escudos disponibles</div>
          <div class="streak-shields">${shieldIcons.length > 0 ? shieldIcons.join('') : '<span style="color:var(--text-3);font-size:14px">Sin escudos aún</span>'}</div>
          ${nextLevel ? `<div class="streak-section-sub">Siguiente nivel en ${nextLevel} días</div>` : '<div class="streak-section-sub">¡Nivel máximo! 🏆</div>'}
        </div>
      </div>
    `;

    html += `
      <div style="padding:0 16px;margin-bottom:12px">
        <div class="streak-section-card">
          <div class="streak-section-title">🏆 Mejor racha histórica</div>
          <div class="streak-best-number">${best} <span class="streak-best-label">días</span></div>
        </div>
      </div>
    `;

    html += `
      <div style="padding:0 16px;margin-bottom:12px">
        <div class="streak-section-card">
          <div class="streak-section-title">📖 Devocional compartido</div>
          ${verse ? `
            <div class="streak-verse-text">${verse.text}</div>
            <div class="streak-verse-ref">— ${verse.reference}</div>
          ` : '<div class="streak-section-sub">Cargando...</div>'}
        </div>
      </div>
    `;
  }

  html += `
    <div style="padding:0 16px;margin-bottom:12px">
      <div class="streak-section-card">
        <div class="streak-section-title">📅 Historial (7 días)</div>
        <div class="streak-history-grid">
          ${history.map(h => {
            const dayName = new Date(h.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase() + new Date(h.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).slice(1,3);
            const allMarked = space.mode === 'solo' ? h.userIds.length >= 1 : h.userIds.length >= 2;
            const someMarked = h.userIds.length > 0;
            const isToday = h.date === today;
            return `
              <div class="history-day ${isToday ? 'today' : ''}">
                <div class="history-dot ${allMarked ? 'done' : someMarked ? 'partial' : 'missed'}"></div>
                <div class="history-label">${dayName}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  document.getElementById('app').innerHTML = html;

  setTimeout(() => {
    const ring = document.getElementById('streakProgressRing');
    if (ring) ring.style.strokeDashoffset = offset;
  }, 50);

  const prayBtn = document.getElementById('prayBtn');
  if (prayBtn && !userMarked) {
    prayBtn.addEventListener('click', async () => {
      prayBtn.disabled = true;
      prayBtn.textContent = 'Registrando...';

      try {
        await window.streakService.markToday(space.id, userId, today);
      } catch (e) {
        if (e.message === 'ALREADY_MARKED') {
          showToast('Ya marcaste hoy', 'error');
        } else {
          showToast('Error al marcar', 'error');
        }
        prayBtn.disabled = false;
        prayBtn.innerHTML = '<i class="ti ti-flame" style="font-size:20px"></i> Oramos hoy 🙏';
        return;
      }

      const result = await window.streakService.checkAndUpdate(space.id, space.mode, userId, today);

      if (result.streakReset) {
        showToast('La racha se reinició 💔', 'error');
      } else if (result.shieldUsed) {
        showToast('Escudo usado · racha protegida 💪', 'success');
      } else if (result.milestone) {
        fireConfetti();
        const msg = MILESTONE_MESSAGES[result.milestone] || '¡' + result.milestone + ' días! 🔥';
        showToast(msg, 'success');
      } else {
        showToast('¡Oración registrada! 🔥', 'success');
      }

      await loadPage(userId, space);
    });
  }
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
