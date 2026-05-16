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

async function handleAuthenticated(session) {
  const userId = session.user.id;

  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    await window.supabase.auth.signOut();
    window.location.href = 'index.html';
    return;
  }

  const pendingName = localStorage.getItem('pendingName') || session.user?.user_metadata?.name;
  if (pendingName) {
    const { data: existingProfile } = await window.supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (!existingProfile) {
      await window.supabase.from('profiles').upsert({ id: userId, name: pendingName });
    }
    localStorage.removeItem('pendingName');
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
    let data, error;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const result = await window.supabase
        .from('spaces')
        .insert({
          mode: 'solo',
          name: 'Espacio Personal',
          created_by: userId,
          code: code
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
      if (!error) break;
      if (error.code !== '23505') break;
    }

    if (error) {
      if (error.code === 'PGRST301' || error.code === '401' || error.message?.includes('JWT')) {
        await window.supabase.auth.signOut();
        window.location.href = 'index.html';
        return;
      }
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

    let data, error, code;
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCode();
      const result = await window.supabase
        .from('spaces')
        .insert({
          mode: 'couple',
          name: name,
          created_by: userId,
          code: code
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
      if (!error) break;
      if (error.code !== '23505') break;
    }

    if (error) {
      if (error.code === 'PGRST301' || error.code === '401' || error.message?.includes('JWT')) {
        await window.supabase.auth.signOut();
        window.location.href = 'index.html';
        return;
      }
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
      if (error.code === 'PGRST301' || error.code === '401' || error.message?.includes('JWT')) {
        await window.supabase.auth.signOut();
        window.location.href = 'index.html';
        return;
      }
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

    const updates = { partner_id: userId };
    if (space.mode === 'solo') updates.mode = 'couple';
    const { error: updateError } = await window.supabase
      .from('spaces')
      .update(updates)
      .eq('id', space.id);

    if (updateError) {
      if (updateError.code === 'PGRST301' || updateError.code === '401' || updateError.message?.includes('JWT')) {
        await window.supabase.auth.signOut();
        window.location.href = 'index.html';
        return;
      }
      showToast('Error: ' + updateError.message, 'error');
      return;
    }

    await window.auth.logActivity(space.id, userId, 'space_joined', 'Se unió al espacio', 'link');
    showToast('Te has unido ✓', 'success');
    window.location.href = 'dashboard.html';
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabase.auth.getSession();

  if (session) {
    await handleAuthenticated(session);
    return;
  }

  window.supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      await handleAuthenticated(session);
    }
  });

  setTimeout(async () => {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      window.location.href = 'index.html';
    }
  }, 2000);
});
