function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.getSession();
  if (session) {
    window.location.href = 'link.html';
    return;
  }

  const nameInput = document.getElementById('nameInput');
  const emailInput = document.getElementById('emailInput');
  const registerBtn = document.getElementById('registerBtn');
  const magicSentMsg = document.getElementById('magicSentMsg');

  registerBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
      showToast('Completa todos los campos', 'error');
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Enviando enlace...';

    localStorage.setItem('pending_name', name);
    localStorage.setItem('pending_email', email);

    const { error } = await window.auth.signInWithMagicLink(email);
    if (error) {
      console.error('Magic link error:', error);
      showToast('Error: ' + (error.message || JSON.stringify(error)), 'error');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Crear cuenta';
      return;
    }

    magicSentMsg.style.display = 'block';
    showToast('Enlace enviado ✨ revisa tu correo', 'success');
  });

  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') registerBtn.click();
  });
});
