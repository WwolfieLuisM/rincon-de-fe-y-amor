if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('firebase-messaging-sw.js').then(reg => {
    reg.update();
  }).catch(() => {});
}

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
    await window.supabase.auth.signOut();
    window.location.href = 'index.html';
  },

  async getUser() {
    const { data: { user } } = await window.supabase.auth.getUser();
    return user;
  },

  async getSession() {
    const { data: { session } } = await window.supabase.auth.getSession();
    return session;
  },

  async ensureSession(timeoutMs) {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session) return session;
    const ms = timeoutMs || 5000;
    return new Promise(resolve => {
      const timer = setTimeout(() => resolve(null), ms);
      const { data: { subscription } } = window.supabase.auth.onAuthStateChange((event, s) => {
        if (event === 'SIGNED_IN' && s) {
          clearTimeout(timer);
          subscription.unsubscribe();
          resolve(s);
        }
      });
    });
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
