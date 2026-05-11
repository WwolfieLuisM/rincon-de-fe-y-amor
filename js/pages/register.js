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
    registerBtn.textContent = 'Registrando...';

    const { data, error } = await window.auth.register(email, password, name);
    if (error) {
      showToast('Error: ' + error.message, 'error');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Crear cuenta';
      return;
    }

    if (data?.user?.identities?.length === 0) {
      showToast('Este correo ya está registrado. Inicia sesión.', 'error');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Crear cuenta';
      return;
    }

    showToast('Cuenta creada ✓ Revisa tu correo para confirmar', 'success');
    setTimeout(() => { window.location.href = 'link.html'; }, 1500);
  });

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') registerBtn.click();
  });
});
