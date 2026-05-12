function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  const userId = session.user.id;

  const pendingName = localStorage.getItem('pending_name');
  const pendingPassword = localStorage.getItem('pending_password');
  if (pendingName || pendingPassword) {
    if (pendingPassword) {
      await window.supabase.auth.updateUser({ password: pendingPassword });
    }
    const { data: existingProfile } = await window.supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (!existingProfile) {
      await window.supabase.from('profiles').upsert({ id: userId, name: pendingName || 'Usuario' });
    }
    localStorage.removeItem('pending_name');
    localStorage.removeItem('pending_email');
    localStorage.removeItem('pending_password');
  }

  const { data: existingSpace } = await window.supabase
    .from('spaces')
    .select('*')
    .or(`created_by.eq.${userId},partner_id.eq.${userId}`)
    .maybeSingle();

  if (existingSpace) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('soloBtn').addEventListener('click', async () => {
    const { data, error } = await window.supabase
      .from('spaces')
      .insert({
        mode: 'solo',
        name: 'Espacio Personal',
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      showToast('Error: ' + error.message, 'error');
      return;
    }

    await window.auth.logActivity(data.id, userId, 'space_created', 'Espacio personal creado', 'link');
    window.location.href = 'dashboard.html';
  });

  document.getElementById('createCoupleBtn').addEventListener('click', async () => {
    const name = document.getElementById('spaceNameInput').value.trim();
    if (!name) {
      showToast('Ingresa un nombre para la pareja', 'error');
      return;
    }

    const code = generateCode();

    const { data, error } = await window.supabase
      .from('spaces')
      .insert({
        mode: 'couple',
        name: name,
        created_by: userId,
        code: code
      })
      .select()
      .single();

    if (error) {
      showToast('Error: ' + error.message, 'error');
      return;
    }

    showToast('Espacio creado ✓ Código: ' + code, 'success');
    window.location.href = 'dashboard.html';
  });

  document.getElementById('joinBtn').addEventListener('click', async () => {
    const code = document.getElementById('codeInput').value.trim().toUpperCase();
    if (!code || code.length !== 6) {
      showToast('Ingresa un código válido de 6 letras', 'error');
      return;
    }

    const { data: space, error } = await window.supabase
      .from('spaces')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      showToast('Error: ' + error.message, 'error');
      return;
    }

    if (!space) {
      showToast('Código inválido. Verifica e intenta de nuevo.', 'error');
      return;
    }

    if (space.partner_id) {
      showToast('Este espacio ya tiene pareja', 'error');
      return;
    }

    const { error: updateError } = await window.supabase
      .from('spaces')
      .update({ partner_id: userId })
      .eq('id', space.id);

    if (updateError) {
      showToast('Error: ' + updateError.message, 'error');
      return;
    }

    await window.auth.logActivity(space.id, userId, 'space_joined', 'Se unió al espacio', 'link');
    showToast('Te has unido ✓', 'success');
    window.location.href = 'dashboard.html';
  });
});
