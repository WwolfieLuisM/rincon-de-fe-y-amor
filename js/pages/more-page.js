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

  let html = `
    <div class="page-content">
      <div class="more-item" id="aboutBtn">
        <div class="more-icon" style="background:#e8547a22;color:#e8547a">🙏</div>
        <div class="more-text">Acerca de</div>
        <div class="more-arrow">›</div>
      </div>
      <div class="more-item" id="donateBtn">
        <div class="more-icon" style="background:#fbbf2422;color:#fbbf24">❤️</div>
        <div class="more-text">Donativos</div>
        <div class="more-arrow">›</div>
      </div>
      <div class="more-item" id="shareBtn">
        <div class="more-icon" style="background:#2563eb22;color:#60a5fa">📤</div>
        <div class="more-text">Compartir app</div>
        <div class="more-arrow">›</div>
      </div>
      <div class="more-item" id="contactBtn">
        <div class="more-icon" style="background:#7c3aed22;color:#a78bfa">✉️</div>
        <div class="more-text">Contacto</div>
        <div class="more-arrow">›</div>
      </div>

      <div style="text-align:center;margin-top:32px;color:var(--text-3);font-size:12px">
        Rincón de Fe y Amor v1.0.0
      </div>
    </div>
  `;

  document.getElementById('app').innerHTML = html;

  document.getElementById('aboutBtn').addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-title">Acerca de</div>
        <p style="color:var(--text-2);font-size:14px;line-height:1.6;text-align:center">
          Rincón de Fe y Amor es un espacio espiritual para parejas y personas solas que desean crecer en su vida de oración y fortalecer su relación con Dios y con su ser amado.
        </p>
        <p style="color:var(--text-2);font-size:14px;line-height:1.6;text-align:center;margin-top:12px">
          🙏 Ora juntos · ✨ Compartan gratitud · 💬 Anímense · 🎯 Cumplan metas
        </p>
        <button class="btn-primary w-full" style="margin-top:16px;background:var(--surface-2);color:var(--text-2)" id="closeAboutBtn">Cerrar</button>
      </div>
    `;
    document.body.appendChild(overlay);
    const sheet = overlay.querySelector('.modal-sheet');
    setTimeout(() => sheet.style.transform = 'translateX(-50%) translateY(0)', 10);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('closeAboutBtn').addEventListener('click', () => overlay.remove());
  });

  document.getElementById('donateBtn').addEventListener('click', () => {
    showToast('Próximamente disponible', 'success');
  });

  document.getElementById('shareBtn').addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: 'Rincón de Fe y Amor',
        text: 'Una app espiritual para parejas. Ora, agradece y crece juntos.',
        url: 'https://github.com/WwolfieLuisM/rincon-de-fe-y-amor'
      }).catch(() => {});
    } else {
      showToast('Comparte esta app con tu pareja 💑', 'success');
    }
  });

  document.getElementById('contactBtn').addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-title">Contacto</div>
        <p style="color:var(--text-2);font-size:14px;line-height:1.6;text-align:center">
          ¿Tienes sugerencias o comentarios? Escríbenos para mejorar tu experiencia.
        </p>
        <p style="color:var(--accent);font-size:14px;text-align:center;margin-top:12px;word-break:break-all">
          soporte@rincondefeyamor.app
        </p>
        <button class="btn-primary w-full" style="margin-top:16px;background:var(--surface-2);color:var(--text-2)" id="closeContactBtn">Cerrar</button>
      </div>
    `;
    document.body.appendChild(overlay);
    const sheet = overlay.querySelector('.modal-sheet');
    setTimeout(() => sheet.style.transform = 'translateX(-50%) translateY(0)', 10);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('closeContactBtn').addEventListener('click', () => overlay.remove());
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
