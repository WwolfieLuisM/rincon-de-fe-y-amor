function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

let loginMode = 'magic';

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.getSession();
  if (session) {
    await window.supabase.auth.signOut();
  }

  const loginBtn = document.getElementById('loginBtn');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const pwGroup = document.getElementById('pwGroupLogin');
  const magicLinkSent = document.getElementById('magicLinkSent');

  document.getElementById('loginTabMagic').addEventListener('click', () => {
    loginMode = 'magic';
    document.getElementById('loginTabMagic').classList.add('active');
    document.getElementById('loginTabPw').classList.remove('active');
    pwGroup.style.display = 'none';
    magicLinkSent.style.display = 'none';
    loginBtn.textContent = 'Iniciar sesión';
    loginBtn.disabled = false;
  });

  document.getElementById('loginTabPw').addEventListener('click', () => {
    loginMode = 'password';
    document.getElementById('loginTabPw').classList.add('active');
    document.getElementById('loginTabMagic').classList.remove('active');
    pwGroup.style.display = '';
    magicLinkSent.style.display = 'none';
    loginBtn.textContent = 'Iniciar sesión';
    loginBtn.disabled = false;
  });

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) { showToast('Ingresa tu correo', 'error'); return; }

    loginBtn.disabled = true;

    if (loginMode === 'magic') {
      loginBtn.textContent = 'Enviando...';
      const { error } = await window.auth.sendMagicLink(email);
      if (error) {
        showToast('❌ ' + error.message, 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar sesión';
        return;
      }
      magicLinkSent.style.display = 'block';
      showToast('Enlace enviado ✓ revisa tu correo', 'success');
      loginBtn.textContent = 'Iniciar sesión';
      loginBtn.disabled = false;
      return;
    }

    const password = passwordInput.value;
    if (!password) { showToast('Ingresa tu contraseña', 'error'); loginBtn.disabled = false; return; }
    loginBtn.textContent = 'Iniciando sesión...';
    const { error } = await window.auth.loginWithPassword(email, password);
    if (error) {
      showToast('❌ ' + error.message, 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Iniciar sesión';
      return;
    }
    window.location.href = 'dashboard.html';
  });

  emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginBtn.click(); });
  if (passwordInput) passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginBtn.click(); });
});
