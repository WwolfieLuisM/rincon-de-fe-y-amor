// js/auth.js
// Versión definitiva - Recuperación de contraseña funcionando

(function() {
  'use strict';

  if (window.auth) return;

  window.auth = {
    // ============================================
    // 🔐 RECUPERACIÓN DE CONTRASEÑA (CORREGIDO)
    // ============================================
    async sendRecoveryLink(email) {
      try {
        // ✅ Usamos la URL COMPLETA, no window.location.origin
        const { data, error } = await window.supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://wwolfieluism.github.io/rincon-de-fe-y-amor/recover.html'
        });
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.error('Send recovery link error:', err);
        return { data: null, error: err };
      }
    },

    // ============================================
    // MAGIC LINK (registro y login sin contraseña)
    // ============================================
    async registerViaMagicLink(email, name) {
      const { data, error } = await window.supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { name },
          emailRedirectTo: 'https://wwolfieluism.github.io/rincon-de-fe-y-amor/link.html'
        }
      });
      return { data, error };
    },

    async sendMagicLink(email) {
      const { data, error } = await window.supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: 'https://wwolfieluism.github.io/rincon-de-fe-y-amor/link.html'
        }
      });
      return { data, error };
    },

    // ============================================
    // LOGIN / REGISTRO CON CONTRASEÑA
    // ============================================
    async loginWithPassword(email, password) {
      const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    },

    async registerWithPassword(email, password, name) {
      const { data, error } = await window.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: 'https://wwolfieluism.github.io/rincon-de-fe-y-amor/link.html'
        }
      });
      return { data, error };
    },

    // ============================================
    // CAMBIAR CONTRASEÑA (estando logueado)
    // ============================================
    async changePassword(currentPassword, newPassword, userEmail) {
      if (currentPassword) {
        const { error: signInError } = await window.supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword
        });
        if (signInError) return { error: signInError };
      }
      const { data, error } = await window.supabase.auth.updateUser({ password: newPassword });
      return { data, error };
    },

    // ============================================
    // LOGOUT
    // ============================================
    async logout() {
      try { localStorage.removeItem('rd_s'); } catch (e) {}
      await window.supabase.auth.signOut();
      window.location.href = 'index.html';
    },

    // ============================================
    // SESIÓN Y USUARIO
    // ============================================
    async getUser() {
      const session = await this.ensureSession();
      return session?.user || null;
    },

    async getSession() {
      const { data: { session } } = await window.supabase.auth.getSession();
      return session;
    },

    ensureSession: async function() {
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session?.user) return session;
      } catch(e) {}

      try {
        const key = 'sb-qktdrlhdzfefjwhxqjws-auth-token';
        const raw = localStorage.getItem(key);
        if (raw) {
          const stored = JSON.parse(raw);
          const token = stored?.access_token || stored?.body?.access_token;
          const refresh = stored?.refresh_token || stored?.body?.refresh_token;
          if (token && refresh) {
            const { data, error } = await window.supabase.auth.setSession({
              access_token: token,
              refresh_token: refresh
            });
            if (!error && data?.session) return data.session;
          }
        }
      } catch(e) {}

      return null;
    },

    // ============================================
    // PERFIL (profiles)
    // ============================================
    async getProfile(userId) {
      const { data, error } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) return null;
      return data;
    },

    async updateProfile(userId, updates) {
      const { data, error } = await window.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      return { data, error };
    },

    // ============================================
    // TRADUCCIÓN DE ERRORES
    // ============================================
    translateError(msg) {
      if (!msg) return msg;
      const map = {
        'Invalid login credentials': 'Credenciales inválidas',
        'Email not confirmed': 'Correo no confirmado',
        'User already registered': 'El usuario ya está registrado',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
        'Email rate limit exceeded': 'Demasiados intentos, espera un momento',
        'Invalid email': 'Correo electrónico inválido',
        'New password should be different from the old password': 'La nueva contraseña debe ser diferente a la actual',
        'The email is already registered': 'El correo ya está registrado',
        'Missing email or password': 'Falta el correo o la contraseña',
        'request rate limit reached': 'Demasiados intentos, espera un momento',
        'Token has expired or is invalid': 'El enlace ha expirado o es inválido',
        'Signup requires a valid password': 'La contraseña debe tener al menos 6 caracteres',
      };
      const lower = msg.toLowerCase();
      for (const [en, es] of Object.entries(map)) {
        if (lower.includes(en.toLowerCase())) return es;
      }
      return msg;
    },

    // ============================================
    // ACTIVIDAD RECIENTE
    // ============================================
    async logActivity(spaceId, userId, type, text, module) {
      try {
        await window.supabase
          .from('activity')
          .insert({ space_id: spaceId, user_id: userId, type, text, module });
      } catch (e) {
        console.error('Activity log error:', e);
      }
    }
  };

  // Inicializar Service Worker (si existe)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.update();
    }).catch(() => {});
  }

  // Limpiar localStorage al cerrar sesión
  window.supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      try { localStorage.removeItem('rd_s'); } catch (e) {}
    }
  });

  console.log('✅ auth.js cargado correctamente');
})();
