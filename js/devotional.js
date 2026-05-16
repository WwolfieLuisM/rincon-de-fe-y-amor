window.Devotional = {
  async getToday(isShared) {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night';
    const dayStart = new Date(new Date().getFullYear(), 0, 0);
    const diff = new Date() - dayStart;
    const dayOfYear = Math.floor(diff / 86400000);

    let { data: devotional } = await window.supabase
      .from('devotionals')
      .select('*')
      .eq('is_shared', isShared)
      .eq('day_of_year', dayOfYear);

    if (!isShared && devotional && devotional.length > 0) {
      devotional = devotional.find(d => d.time_of_day === timeOfDay) || null;
    } else if (!isShared) {
      devotional = null;
    }

    if (!devotional) {
      const { data: fallback } = await window.supabase
        .from('devotionals')
        .select('*')
        .eq('is_shared', isShared)
        .is('day_of_year', null)
        .eq('time_of_day', isShared ? 'any' : timeOfDay)
        .limit(1)
        .maybeSingle();
      devotional = fallback || null;
    }

    if (devotional && devotional.verse_id) {
      const { data: verse } = await window.supabase
        .from('verses')
        .select('*')
        .eq('id', devotional.verse_id)
        .maybeSingle();
      if (verse) devotional.verses = verse;
    }

    return devotional || null;
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
      .select('*, devotionals!inner(*)')
      .eq('user_id', userId)
      .order('read_at', { ascending: false })
      .limit(limit);
    const result = data || [];
    for (const item of result) {
      if (item.devotionals && item.devotionals.verse_id) {
        const { data: verse } = await window.supabase
          .from('verses')
          .select('*')
          .eq('id', item.devotionals.verse_id)
          .maybeSingle();
        if (verse) item.devotionals.verses = verse;
      }
    }
    return result;
  },

  getTimeLabel() {
    const hour = new Date().getHours();
    if (hour < 12) return { label: 'Buenos días', icon: '🌅', time: 'morning', title: 'Devocional de la Mañana' };
    if (hour < 18) return { label: 'Buenas tardes', icon: '☀️', time: 'afternoon', title: 'Devocional de la Tarde' };
    return { label: 'Buenas noches', icon: '🌙', time: 'night', title: 'Devocional de la Noche' };
  }
};
