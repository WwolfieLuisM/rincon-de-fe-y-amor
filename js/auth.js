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
