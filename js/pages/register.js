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
  const passwordInput = document.getElementById('passwordInput');
  const registerBtn = document.getElementById('registerBtn');
  const magicSentMsg = document.getElementById('magicSentMsg');

  registerBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!name || !email || !password) {
      showToast('Completa todos los campos', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Enviando enlace...';

    localStorage.setItem('pending_name', name);
    localStorage.setItem('pending_email', email);
    localStorage.setItem('pending_password', password);

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

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') registerBtn.click();
  });
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') registerBtn.click();
  });
});
