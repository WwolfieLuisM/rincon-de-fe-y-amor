function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.getSession();
  if (session) {
    await window.supabase.auth.signOut();
  }

  const loginBtn = document.getElementById('loginBtn');
  const emailInput = document.getElementById('emailInput');
  const magicLinkSent = document.getElementById('magicLinkSent');

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) {
      showToast('Ingresa tu correo', 'error');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Enviando...';

    const { error } = await window.auth.sendMagicLink(email);

    if (error) {
      const notFound = error.message?.toLowerCase().includes('not found')
        || error.code === 'user_not_found';
      showToast(notFound ? '❌ Este correo no está registrado. Regístrate primero' : 'Error: ' + error.message, 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Enviar enlace mágico';
      return;
    }

    magicLinkSent.style.display = 'block';
    showToast('Enlace enviado ✓ revisa tu correo', 'success');
    loginBtn.textContent = 'Enviar enlace mágico';
    loginBtn.disabled = false;
  });

  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
});
