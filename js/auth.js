if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.update();
  }).catch(() => {});
}

let _cachedSession = null;

try {
  const stored = localStorage.getItem('rd_s');
  if (stored) _cachedSession = JSON.parse(stored);
} catch (e) {}

window.supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    _cachedSession = session;
    try { localStorage.setItem('rd_s', JSON.stringify(session)); } catch (e) {}
  } else if (event === 'SIGNED_OUT') {
    _cachedSession = null;
    try { localStorage.removeItem('rd_s'); } catch (e) {}
  }
});

window.auth = {
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

  async sendRecoveryLink(email) {
    const { data, error } = await window.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: 'https://wwolfieluism.github.io/rincon-de-fe-y-amor/profile.html'
      }
    });
    return { data, error };
  },

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

  async logout() {
    _cachedSession = null;
    try { localStorage.removeItem('rd_s'); } catch (e) {}
    await window.supabase.auth.signOut();
    window.location.href = 'index.html';
  },

  async getUser() {
    const session = await this.ensureSession();
    return session?.user || null;
  },

  async getSession() {
    const { data: { session } } = await window.supabase.auth.getSession();
    return session;
  },

  async ensureSession(timeoutMs) {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session) {
      _cachedSession = session;
      try { localStorage.setItem('rd_s', JSON.stringify(session)); } catch (e) {}
      return session;
    }

    if (_cachedSession) {
      try {
        const { data } = await window.supabase.auth.setSession({
          access_token: _cachedSession.access_token,
          refresh_token: _cachedSession.refresh_token
        });
        if (data?.session) {
          _cachedSession = data.session;
          try { localStorage.setItem('rd_s', JSON.stringify(data.session)); } catch (e) {}
          return data.session;
        }
      } catch (e) {}
      _cachedSession = null;
      try { localStorage.removeItem('rd_s'); } catch (e) {}
      return null;
    }

    const ms = timeoutMs || 15000;
    return Promise.race([
      new Promise(resolve => {
        const { data: { subscription } } = window.supabase.auth.onAuthStateChange(
          (event, s) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              subscription.unsubscribe();
              _cachedSession = s;
              try { localStorage.setItem('rd_s', JSON.stringify(s)); } catch (e) {}
              resolve(s);
            } else if (event === 'SIGNED_OUT') {
              subscription.unsubscribe();
              _cachedSession = null;
              try { localStorage.removeItem('rd_s'); } catch (e) {}
              resolve(null);
            }
          }
        );
      }),
      new Promise(resolve => setTimeout(() => resolve(null), ms))
    ]);
  },

  async getProfile(userId) {
    const { data, error } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
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
