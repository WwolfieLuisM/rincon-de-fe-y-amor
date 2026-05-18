function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

function openSheet(htmlContent) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-sheet">
      ${htmlContent}
    </div>
  `;
  document.body.appendChild(overlay);
  const sheet = overlay.querySelector('.modal-sheet');
  setTimeout(() => sheet.style.transform = 'translateX(-50%) translateY(0)', 10);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  return overlay;
}

async function loadPage(userId, space) {
  const headerAvatar = document.getElementById('headerAvatar');
  if (window.currentUser) {
    headerAvatar.textContent = (window.currentUser.name || '?').charAt(0).toUpperCase();
  }

  let html = `
    <div class="page-content">
      <div class="more-item" id="aboutBtn">
        <div class="more-icon" style="background:#e8547a22;color:#e8547a"><i class="ti ti-heart"></i></div>
        <div class="more-text">Acerca de</div>
        <div class="more-arrow"><i class="ti ti-chevron-right"></i></div>
      </div>
      <div class="more-item" id="donateBtn">
        <div class="more-icon" style="background:#fbbf2422;color:#fbbf24"><i class="ti ti-gift"></i></div>
        <div class="more-text">Donativos</div>
        <div class="more-arrow"><i class="ti ti-chevron-right"></i></div>
      </div>
      <div class="more-item" id="shareBtn">
        <div class="more-icon" style="background:#2563eb22;color:#60a5fa"><i class="ti ti-share"></i></div>
        <div class="more-text">Compartir app</div>
        <div class="more-arrow"><i class="ti ti-chevron-right"></i></div>
      </div>
      <div class="more-item" id="contactBtn">
        <div class="more-icon" style="background:#7c3aed22;color:#a78bfa"><i class="ti ti-mail"></i></div>
        <div class="more-text">Contacto</div>
        <div class="more-arrow"><i class="ti ti-chevron-right"></i></div>
      </div>

      <div style="text-align:center;margin-top:32px;color:var(--text-3);font-size:12px">
        Rincón de Fe y Amor v1.0.1
      </div>
    </div>
  `;

  document.getElementById('app').innerHTML = html;

  document.getElementById('aboutBtn').addEventListener('click', () => {
    openSheet(`
      <div class="modal-title">🌸 Acerca de</div>
      <p style="color:var(--text-2);font-size:14px;line-height:1.7;text-align:center">
        Rincón de Fe y Amor nace del deseo de crear un espacio sagrado donde las parejas puedan cultivar su vida espiritual juntos. En un mundo que corre sin descanso, esta app te invita a pausar, conectar con Dios y fortalecer el vínculo con tu ser amado a través de la oración, la gratitud y el compañerismo.
      </p>
      <p style="color:var(--text-1);font-size:14px;line-height:1.7;text-align:center;margin-top:14px;font-weight:500">
        🙏 Oren en unidad · ⭐ Compartan testimonios · 💬 Anímense mutuamente · 🎯 Cumplan metas juntos
      </p>
      <p style="color:var(--text-2);font-size:13px;line-height:1.6;text-align:center;margin-top:12px;font-style:italic">
        "Donde dos o tres se reúnen en mi nombre, allí estoy yo en medio de ellos." — Mateo 18:20
      </p>
      <button class="btn-primary w-full" style="margin-top:16px;background:var(--surface-2);color:var(--text-2)" id="closeAboutBtn">Cerrar</button>
    `);
    document.getElementById('closeAboutBtn').addEventListener('click', () => document.body.lastElementChild.remove());
  });

  document.getElementById('donateBtn').addEventListener('click', () => {
    openSheet(`
      <div class="modal-title">🎁 Donativos</div>
      <p style="color:var(--text-2);font-size:14px;line-height:1.6;text-align:center">
        Si esta app ha sido de bendición para tu relación, considera apoyarnos con un donativo voluntario. Tu contribución nos ayuda a mantener este proyecto vivo y seguir mejorando la experiencia para más parejas.
      </p>
      <div style="margin-top:14px;text-align:center">
        <img src="img/donativos.webp" alt="Tarjetas para donar" style="max-width:100%;border-radius:var(--radius-sm);border:1px solid var(--border)">
      </div>
      <p style="color:var(--text-3);font-size:12px;text-align:center;margin-top:8px">
        Desde el corazón, gracias por tu apoyo 🙏
      </p>
      <button class="btn-primary w-full" style="margin-top:16px;background:var(--surface-2);color:var(--text-2)" id="closeDonateBtn">Cerrar</button>
    `);
    document.getElementById('closeDonateBtn').addEventListener('click', () => document.body.lastElementChild.remove());
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
    const overlay = openSheet(`
      <div class="modal-title">💌 Contacto</div>
      <p style="color:var(--text-2);font-size:14px;line-height:1.6;text-align:center;margin-bottom:16px">
        Escríbenos, estaremos encantados de leerte
      </p>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a href="mailto:luisking89@gmail.com" class="contact-link"><i class="ti ti-mail" style="color:#ea4335"></i> luisking89@gmail.com</a>
        <a href="mailto:miguewolf06@gmail.com" class="contact-link"><i class="ti ti-mail" style="color:#ea4335"></i> miguewolf06@gmail.com</a>
        <a href="https://www.linkedin.com/in/luis-herrera-71739236a" target="_blank" class="contact-link"><i class="ti ti-brand-linkedin" style="color:#0a66c2"></i> LinkedIn</a>
        <a href="https://www.facebook.com/share/1EhKE5VJ5y/" target="_blank" class="contact-link"><i class="ti ti-brand-facebook" style="color:#1877f2"></i> Facebook</a>
        <button class="contact-link" id="whatsappBtn" style="text-align:left;cursor:pointer"><i class="ti ti-brand-whatsapp" style="color:#25d366"></i> WhatsApp</button>
      </div>
      <button class="btn-primary w-full" style="margin-top:16px;background:var(--surface-2);color:var(--text-2)" id="closeContactBtn">Cerrar</button>
    `);

    const wa1 = '53636245';
    const wa2 = '67';
    document.getElementById('whatsappBtn').addEventListener('click', () => {
      window.open('https://wa.me/' + wa1 + wa2 + '?text=¡Hola!', '_blank');
    });

    document.getElementById('closeContactBtn').addEventListener('click', () => overlay.remove());
  });
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
});
