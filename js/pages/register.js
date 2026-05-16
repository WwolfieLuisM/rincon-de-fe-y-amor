function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

let registerMode = 'magic';

window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.getSession();
  if (session) {
    await window.supabase.auth.signOut();
  }

  const nameInput = document.getElementById('nameInput');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const confirmPwInput = document.getElementById('confirmPasswordInput');
  const registerBtn = document.getElementById('registerBtn');
  const pwGroup = document.getElementById('pwGroupRegister');
  const confirmPwGroup = document.getElementById('confirmPwGroup');

  document.getElementById('registerTabMagic').addEventListener('click', () => {
    registerMode = 'magic';
    document.getElementById('registerTabMagic').classList.add('active');
    document.getElementById('registerTabPw').classList.remove('active');
    pwGroup.style.display = 'none';
    confirmPwGroup.style.display = 'none';
    registerBtn.textContent = 'Registrarme';
    registerBtn.disabled = false;
  });

  document.getElementById('registerTabPw').addEventListener('click', () => {
    registerMode = 'password';
    document.getElementById('registerTabPw').classList.add('active');
    document.getElementById('registerTabMagic').classList.remove('active');
    pwGroup.style.display = '';
    confirmPwGroup.style.display = '';
    registerBtn.textContent = 'Crear cuenta';
    registerBtn.disabled = false;
  });

  registerBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
      showToast('Completa todos los campos', 'error');
      return;
    }

    registerBtn.disabled = true;

    if (registerMode === 'magic') {
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
      return;
    }

    const password = passwordInput.value;
    const confirmPw = confirmPwInput.value;
    if (!password || password.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); registerBtn.disabled = false; return; }
    if (password !== confirmPw) { showToast('Las contraseñas no coinciden', 'error'); registerBtn.disabled = false; return; }

    registerBtn.textContent = 'Creando cuenta...';
    const { error } = await window.auth.registerWithPassword(email, password, name);
    registerBtn.disabled = false;
    registerBtn.textContent = 'Crear cuenta';

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

  emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') registerBtn.click(); });
  if (confirmPwInput) confirmPwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') registerBtn.click(); });
});
