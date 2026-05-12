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
  const magicBtn = document.getElementById('magicBtn');
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
    registerBtn.textContent = 'Registrando...';

    const { data, error } = await window.auth.register(email, password, name);
    if (error) {
      console.error('Register error:', error);
      showToast('Error: ' + (error.message || JSON.stringify(error)), 'error');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Crear cuenta';
      return;
    }

    if (!data?.user) {
      showToast('Error: No se pudo crear el usuario.', 'error');
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

    window.location.href = 'link.html';
  });

  magicBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
      showToast('Completa nombre y correo', 'error');
      return;
    }

    magicBtn.disabled = true;
    magicBtn.innerHTML = '<i class="ti ti-loader" style="font-size:18px"></i> Enviando...';

    localStorage.setItem('pending_name', name);
    localStorage.setItem('pending_email', email);

    const { error } = await window.auth.signInWithMagicLink(email);
    if (error) {
      console.error('Magic link error:', error);
      showToast('Error: ' + (error.message || JSON.stringify(error)), 'error');
      magicBtn.disabled = false;
      magicBtn.innerHTML = '<i class="ti ti-mail" style="font-size:18px"></i> Enviar enlace mágico';
      return;
    }

    magicSentMsg.style.display = 'block';
    showToast('Enlace enviado ✨ revisa tu correo', 'success');
    magicBtn.innerHTML = '<i class="ti ti-mail" style="font-size:18px"></i> Enviar enlace mágico';
    magicBtn.disabled = false;
  });

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') registerBtn.click();
  });
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') registerBtn.click();
  });
});
