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
      showToast('Error: ' + error.message, 'error');
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
