function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

function getDaysSince(createdAt) {
  const s = new Date(createdAt);
  const start = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  const now = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  return Math.max(0, Math.floor((now - start) / 86400000));
}

async function loadPage(userId, space) {
  const headerAvatar = document.getElementById('headerAvatar');
  if (window.currentUser) {
    headerAvatar.textContent = (window.currentUser.name || '?').charAt(0).toUpperCase();
  }

  const session = await window.auth.getSession();
  const email = session?.user?.email || '';
  window.currentUserEmail = email;

  const userName = window.currentUser?.name || 'Usuario';
  const initial = userName.charAt(0).toUpperCase();

  const [streakRes, prayerMarksRes, gratitudeRes, bibleProgressRes, bibleFavRes] = await Promise.all([
    window.supabase.from('streak').select('count').eq('space_id', space.id).maybeSingle(),
    window.supabase.from('prayer_marks').select('id', { count: 'exact' }).eq('user_id', userId),
    window.supabase.from('gratitude').select('id', { count: 'exact' }).eq('user_id', userId),
    window.supabase.from('reading_progress').select('id', { count: 'exact' }).eq('user_id', userId).eq('space_id', space.id),
    window.supabase.from('bible_favorites').select('id', { count: 'exact' }).eq('user_id', userId).eq('space_id', space.id)
  ]);

  const streakCount = streakRes.data?.count || 0;
  const prayerCount = prayerMarksRes.count || 0;
  const gratitudeCount = gratitudeRes.count || 0;
  const bibleReadCount = bibleProgressRes.count || 0;
  const bibleFavCount = bibleFavRes.count || 0;
  const daysTogether = space.mode === 'couple' ? getDaysSince(space.created_at) : 0;

  let html = `
    <div class="profile-header">
      <div class="profile-avatar">${initial}</div>
      <div class="profile-name">
        <span id="profileNameDisplay">${userName}</span>
        <button id="editNameBtn" style="background:none;border:none;color:var(--accent);font-size:14px;margin-left:8px;cursor:pointer" aria-label="Editar nombre"><i class="ti ti-edit"></i></button>
      </div>
      <div class="profile-email">${email}</div>
    </div>

    <div class="page-content">
      <div style="display:none" id="editNameRow">
        <div class="input-group">
          <input class="input-field" id="nameInput" value="${userName}">
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <button class="btn-primary" id="saveNameBtn" style="flex:1;padding:10px">Guardar</button>
          <button class="btn-primary" id="cancelNameBtn" style="flex:1;padding:10px;background:var(--surface-2);color:var(--text-2)">Cancelar</button>
        </div>
      </div>

      <div class="grid-2">
        <div class="stat-card">
          <div class="stat-number">${streakCount}</div>
          <div class="stat-label"><i class="ti ti-flame"></i> Racha</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${prayerCount}</div>
          <div class="stat-label"><i class="ti ti-heart"></i> Oraciones</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${gratitudeCount}</div>
          <div class="stat-label"><i class="ti ti-star"></i> Gratitudes</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${space.mode === 'couple' ? daysTogether : '-'}</div>
          <div class="stat-label">${space.mode === 'couple' ? '<i class="ti ti-hearts"></i> Días juntos' : '<i class="ti ti-user"></i> Modo Solo'}</div>
        </div>
      </div>

      ${space.mode === 'solo' && !space.partner_id && space.code ? `
      <div class="section-label" style="padding:0;margin-top:24px">Espacio</div>
      <div style="padding:0 0 8px;font-size:13px;color:var(--text-2)">Modo Solo · Código: <strong style="letter-spacing:2px;color:var(--accent)">${space.code}</strong> <i class="ti ti-copy" style="cursor:pointer;font-size:14px" onclick="navigator.clipboard.writeText('${space.code}');showToast('Código copiado','success')"></i></div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:16px">
        <div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--text-1)">¿Unirte a tu pareja?</div>
        <div class="input-group">
          <input class="input-field" id="joinCodeInput" placeholder="Código de 6 letras" style="text-transform:uppercase;letter-spacing:2px" maxlength="6">
        </div>
        <button class="btn-primary w-full" id="joinPartnerBtn">Unirme</button>
      </div>
      ` : ''}

      <div class="section-label" style="padding:0;margin-top:24px">La Palabra</div>
      <div style="padding:0 0 4px;font-size:13px;color:var(--text-2)">${bibleReadCount} capítulos leídos</div>
      <div style="padding:0 0 8px;font-size:13px;color:var(--text-2)">${bibleFavCount} favoritos</div>
      <a href="palabra.html" class="btn-primary w-full" style="display:block;text-align:center;padding:10px;text-decoration:none;margin-bottom:12px"><i class="ti ti-book"></i> Leer la Biblia</a>

      <div class="section-label" style="padding:0;margin-top:24px">Cuenta</div>
      <div class="more-item" id="changePasswordBtn" style="margin-bottom:0">
        <div class="more-icon" style="background:#2563eb22;color:#60a5fa"><i class="ti ti-key"></i></div>
        <div class="more-text">Cambiar contraseña</div>
        <div class="more-arrow">›</div>
      </div>
    </div>
  `;

  document.getElementById('app').innerHTML = html;

  document.getElementById('editNameBtn').addEventListener('click', () => {
    document.getElementById('profileNameDisplay').style.display = 'none';
    document.getElementById('editNameBtn').style.display = 'none';
    document.getElementById('editNameRow').style.display = 'block';
  });

  document.getElementById('cancelNameBtn').addEventListener('click', () => {
    document.getElementById('profileNameDisplay').style.display = 'inline';
    document.getElementById('editNameBtn').style.display = 'inline';
    document.getElementById('editNameRow').style.display = 'none';
  });

  document.getElementById('saveNameBtn').addEventListener('click', async () => {
    const name = document.getElementById('nameInput').value.trim();
    if (!name) {
      showToast('El nombre no puede estar vacío', 'error');
      return;
    }

    const { error } = await window.auth.updateProfile(userId, { name });
    if (error) {
      showToast('Error: ' + error.message, 'error');
      return;
    }

    showToast('Nombre actualizado ✓', 'success');
    window.currentUser.name = name;
    loadPage(userId, space);
  });

  document.getElementById('changePasswordBtn').addEventListener('click', openChangePasswordModal);

  const joinBtn = document.getElementById('joinPartnerBtn');
  const joinInput = document.getElementById('joinCodeInput');
  if (joinBtn && joinInput) {
    joinBtn.addEventListener('click', async () => {
      const code = joinInput.value.trim().toUpperCase();
      if (!code || code.length !== 6) {
        showToast('Ingresa un código válido de 6 letras', 'error');
        return;
      }

      joinBtn.disabled = true;
      joinBtn.textContent = 'Buscando...';

      const { data: targetSpace, error: findError } = await window.supabase
        .from('spaces')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (findError || !targetSpace) {
        showToast('Código inválido. Verifica e intenta de nuevo.', 'error');
        joinBtn.disabled = false;
        joinBtn.textContent = 'Unirme';
        return;
      }

      if (targetSpace.partner_id) {
        showToast('Este espacio ya tiene pareja', 'error');
        joinBtn.disabled = false;
        joinBtn.textContent = 'Unirme';
        return;
      }

      if (targetSpace.id === space.id) {
        showToast('Este es tu propio espacio', 'error');
        joinBtn.disabled = false;
        joinBtn.textContent = 'Unirme';
        return;
      }

      joinBtn.textContent = 'Eliminando espacio actual...';
      await window.supabase.from('activity').delete().eq('space_id', space.id);
      await window.supabase.from('prayer_marks').delete().eq('space_id', space.id);
      await window.supabase.from('prayers').delete().eq('space_id', space.id);
      await window.supabase.from('streak_marks').delete().eq('space_id', space.id);
      await window.supabase.from('streak').delete().eq('space_id', space.id);
      await window.supabase.from('gratitude').delete().eq('space_id', space.id);
      await window.supabase.from('encouragement').delete().eq('space_id', space.id);
      await window.supabase.from('goals').delete().eq('space_id', space.id);
      await window.supabase.from('special_dates').delete().eq('space_id', space.id);
      const { error: delError } = await window.supabase.from('spaces').delete().eq('id', space.id);

      if (delError) {
        showToast('Error al eliminar espacio: ' + delError.message, 'error');
        joinBtn.disabled = false;
        joinBtn.textContent = 'Unirme';
        return;
      }

      joinBtn.textContent = 'Uniéndote...';
      const updates = { partner_id: userId };
      if (targetSpace.mode === 'solo') updates.mode = 'couple';
      const { error: updateError } = await window.supabase
        .from('spaces')
        .update(updates)
        .eq('id', targetSpace.id);

      if (updateError) {
        showToast('Error al unirte: ' + updateError.message, 'error');
        joinBtn.disabled = false;
        joinBtn.textContent = 'Unirme';
        return;
      }

      await window.auth.logActivity(targetSpace.id, userId, 'space_joined', 'Se unió al espacio', 'profile');
      showToast('Te has unido ✓', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    });

    joinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') joinBtn.click();
    });
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.ensureSession();
  if (!session) { window.location.href = 'index.html'; return; }

  const { data: space } = await window.supabase
    .from('spaces')
    .select('*')
    .or(`created_by.eq.${session.user.id},partner_id.eq.${session.user.id}`)
    .maybeSingle();

  if (space) {
    await initLayout();
    await loadPage(session.user.id, space);
  } else {
    showPageSlim(session.user.id, session.user.email);
  }
});

async function showPageSlim(userId, email) {
  if (window.initLayout) await initLayout();
  const avatar = document.getElementById('headerAvatar');
  if (avatar) avatar.textContent = '?';
  document.getElementById('app').innerHTML = `
    <div class="page-content" style="padding-top:80px;text-align:center">
      <div class="profile-avatar" style="margin:0 auto 12px">?</div>
      <div style="color:var(--text-2);margin-bottom:24px;font-size:13px">${email}</div>
      <p style="color:var(--text-3);font-size:13px;margin-bottom:24px">Aún no tienes un espacio. Crea tu espacio para comenzar.</p>
      <div class="more-item" id="changePwSlim" style="margin-bottom:0">
        <div class="more-icon" style="background:#2563eb22;color:#60a5fa"><i class="ti ti-key"></i></div>
        <div class="more-text">Cambiar contraseña</div>
        <div class="more-arrow">›</div>
      </div>
      <button class="btn-primary w-full" id="goCreateSpace" style="margin-top:24px">Crear mi espacio</button>
    </div>
  `;
  document.getElementById('changePwSlim').addEventListener('click', () => openChangePasswordModal());
  document.getElementById('goCreateSpace').addEventListener('click', () => { window.location.href = 'link.html'; });
}

function openChangePasswordModal() {
  const session = window.currentUserEmail || '';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-title">Cambiar contraseña</div>
      <div class="input-group">
        <label class="input-label">Contraseña actual <span style="color:rgba(255,255,255,0.3);font-size:11px">(déjalo vacío si no tienes)</span></label>
        <input class="input-field" type="password" id="currentPasswordInput" placeholder="••••••••" autocomplete="current-password">
      </div>
      <div class="input-group">
        <label class="input-label">Nueva contraseña (mín. 6 caracteres)</label>
        <input class="input-field" type="password" id="newPasswordInput" placeholder="••••••••" autocomplete="new-password">
      </div>
      <div class="input-group">
        <label class="input-label">Confirmar nueva contraseña</label>
        <input class="input-field" type="password" id="confirmPasswordInput" placeholder="••••••••" autocomplete="new-password">
      </div>
      <button class="btn-primary w-full" id="savePasswordBtn">Guardar contraseña</button>
      <button class="btn-primary w-full" style="background:var(--surface-2);color:var(--text-2);margin-top:8px" id="cancelPasswordBtn">Cancelar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  const sheet = overlay.querySelector('.modal-sheet');
  setTimeout(() => sheet.style.transform = 'translateX(-50%) translateY(0)', 10);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('cancelPasswordBtn').addEventListener('click', () => overlay.remove());
  document.getElementById('savePasswordBtn').addEventListener('click', async () => {
    const currentPw = document.getElementById('currentPasswordInput').value;
    const newPw = document.getElementById('newPasswordInput').value;
    const confirmPw = document.getElementById('confirmPasswordInput').value;
    if (!newPw || newPw.length < 6) { showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error'); return; }
    if (newPw !== confirmPw) { showToast('Las contraseñas no coinciden', 'error'); return; }
    const session2 = await window.auth.getSession();
    const email = session2?.user?.email;
    if (!email) { showToast('No se pudo obtener tu correo', 'error'); return; }
    const { error } = await window.auth.changePassword(currentPw, newPw, email);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    showToast('Contraseña actualizada ✓', 'success');
    overlay.remove();
  });
}
