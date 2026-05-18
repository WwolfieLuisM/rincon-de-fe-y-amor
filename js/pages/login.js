function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.getSession();
  if (session) {
    await window.supabase.auth.signOut();
  }

  const loginBtn = document.getElementById('loginBtn');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) { showToast('Ingresa tu correo', 'error'); return; }
    const password = passwordInput.value;
    if (!password) { showToast('Ingresa tu contraseña', 'error'); return; }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Iniciando sesión...';
    const { error } = await window.auth.loginWithPassword(email, password);
    if (error) {
      showToast(window.auth.translateError(error.message), 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Iniciar sesión';
      return;
    }
    window.location.href = 'dashboard.html';
  });

  emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginBtn.click(); });
  passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginBtn.click(); });

  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('.input-field');
      const isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      btn.querySelector('i').className = isPw ? 'ti ti-eye-off' : 'ti ti-eye';
    });
  });
});
