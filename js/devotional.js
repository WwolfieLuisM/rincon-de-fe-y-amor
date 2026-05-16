window.Devotional = {
  async getToday(isShared) {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night';
    const dayStart = new Date(new Date().getFullYear(), 0, 0);
    const diff = new Date() - dayStart;
    const dayOfYear = Math.floor(diff / 86400000);

    let { data } = await window.supabase
      .from('devotionals')
      .select('*, verses(*)')
      .eq('is_shared', isShared)
      .eq('day_of_year', dayOfYear);

    if (!isShared && data && data.length > 0) {
      data = data.find(d => d.time_of_day === timeOfDay) || null;
    } else if (!isShared) {
      data = null;
    }

    if (!data) {
      const { data: fallback } = await window.supabase
        .from('devotionals')
        .select('*, verses(*)')
        .eq('is_shared', isShared)
        .is('day_of_year', null)
        .eq('time_of_day', isShared ? 'any' : timeOfDay)
        .limit(1)
        .maybeSingle();
      return fallback || null;
    }
    return data || null;
  },

  async markAsRead(userId, devotionalId) {
    const { error } = await window.supabase
      .from('devotional_reads')
      .insert({ user_id: userId, devotional_id: devotionalId });
    if (error && error.code !== '23505') console.error('Error marking devotional as read:', error);
  },

  async hasReadToday(userId, devotionalId) {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await window.supabase
      .from('devotional_reads')
      .select('id')
      .eq('user_id', userId)
      .eq('devotional_id', devotionalId)
      .gte('read_at', today)
      .maybeSingle();
    return !!data;
  },

  async getHistory(userId, limit = 5) {
    const { data } = await window.supabase
      .from('devotional_reads')
      .select('*, devotionals!inner(*, verses(*))')
      .eq('user_id', userId)
      .order('read_at', { ascending: false })
      .limit(limit);
    return data || [];
  },

  getTimeLabel() {
    const hour = new Date().getHours();
    if (hour < 12) return { label: 'Buenos días', icon: '🌅', time: 'morning', title: 'Devocional de la Mañana' };
    if (hour < 18) return { label: 'Buenas tardes', icon: '☀️', time: 'afternoon', title: 'Devocional de la Tarde' };
    return { label: 'Buenas noches', icon: '🌙', time: 'night', title: 'Devocional de la Noche' };
  }
};
