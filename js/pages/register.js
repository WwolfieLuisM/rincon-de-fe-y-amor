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

  const nameInput = document.getElementById('nameInput');
  const emailInput = document.getElementById('emailInput');
  const registerBtn = document.getElementById('registerBtn');

  registerBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
      showToast('Completa todos los campos', 'error');
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Enviando enlace...';

    const { error } = await window.auth.registerViaMagicLink(email, name);
    registerBtn.disabled = false;
    registerBtn.textContent = 'Registrarme';

    if (error) {
      showToast('Error: ' + (error.message || 'No se pudo crear la cuenta'), 'error');
      return;
    }

    localStorage.setItem('pendingName', name);
    localStorage.setItem('pendingEmail', email);
    document.getElementById('confirmEmail').textContent = email;
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('confirmationScreen').style.display = 'block';
  });

  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') registerBtn.click();
  });
});
