function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.getSession();
  if (session) {
    const { data: space } = await window.supabase
      .from('spaces')
      .select('id')
      .or(`created_by.eq.${session.user.id},partner_id.eq.${session.user.id}`)
      .maybeSingle();
    if (space) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'link.html';
    }
    return;
  }

  const loginBtn = document.getElementById('loginBtn');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      showToast('Completa todos los campos', 'error');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Iniciando...';

    const { data, error } = await window.auth.login(email, password);
    if (error) {
      showToast('Error: ' + error.message, 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Iniciar sesión';
      return;
    }

    const { data: space } = await window.supabase
      .from('spaces')
      .select('id')
      .or(`created_by.eq.${data.user.id},partner_id.eq.${data.user.id}`)
      .maybeSingle();

    if (space) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'link.html';
    }
  });

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
});
