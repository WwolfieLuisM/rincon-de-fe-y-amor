function getLocalDateStr(d) {
  const dt = d || new Date();
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}

window.streakService = {
  async getStreak(spaceId) {
    const { data } = await window.supabase
      .from('streak')
      .select('*')
      .eq('space_id', spaceId)
      .maybeSingle();
    return data || null;
  },

  async getTodayMarks(spaceId, today) {
    const todayStr = today || getLocalDateStr();
    const { data } = await window.supabase
      .from('streak_marks')
      .select('user_id')
      .eq('space_id', spaceId)
      .eq('marked_at', todayStr);
    return data ? data.map(r => r.user_id) : [];
  },

  async markToday(spaceId, userId, today) {
    const todayStr = today || getLocalDateStr();
    const { error } = await window.supabase
      .from('streak_marks')
      .insert({ space_id: spaceId, user_id: userId, marked_at: todayStr });
    if (error && error.code === '23505') throw new Error('ALREADY_MARKED');
    if (error) throw error;
  },

  async checkAndUpdate(spaceId, mode, userId, today) {
    const todayStr = today || getLocalDateStr();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = getLocalDateStr(yesterday);

    const todayUsers = await this.getTodayMarks(spaceId, todayStr);
    const bothMarked = mode === 'solo' || (todayUsers.length >= 2);

    if (!bothMarked) return { updated: false };

    const streak = await this.getStreak(spaceId);
    let count = streak ? streak.count : 0;
    let best = streak ? (streak.best_count || 0) : 0;
    let shieldDays = streak ? (streak.shield_days || 0) : 0;
    let shieldUsed = false;
    let streakReset = false;
    let milestone = null;

    if (streak && streak.last_marked === yStr) {
      count += 1;
    } else if (streak && shieldDays > 0) {
      shieldDays -= 1;
      shieldUsed = true;
      await window.auth.logActivity(spaceId, userId, 'streak', 'Escudo usado · racha protegida 💪', 'streak');
    } else {
      if (streak && streak.count > 0) {
        streakReset = true;
        await window.auth.logActivity(spaceId, userId, 'streak', 'La racha se reinició 💔', 'streak');
      }
      count = 1;
    }

    if (count > best) best = count;

    const shieldsAtLevel = this.calculateShields(count);
    if (shieldsAtLevel > shieldDays) shieldDays = shieldsAtLevel;

    milestone = this.checkMilestone(count);

    const updateData = { count, best_count: best, last_marked: todayStr, shield_days: shieldDays };

    if (streak) {
      await window.supabase.from('streak').update(updateData).eq('id', streak.id);
    } else {
      await window.supabase.from('streak').insert({ space_id: spaceId, ...updateData });
    }

    await window.auth.logActivity(spaceId, userId, 'streak', 'Marcó oración del día ' + count, 'streak');

    if (streakReset) {
      await window.auth.logActivity(spaceId, userId, 'streak', 'La racha se reinició 💔', 'streak');
    }

    if (milestone) {
      await window.auth.logActivity(spaceId, userId, 'milestone', '¡Alcanzaron ' + milestone + ' días de racha! 🔥', 'streak');
    }

    return { updated: true, newCount: count, milestone, shieldUsed, streakReset, shieldDays };
  },

  async getHistory(spaceId, days) {
    const n = days || 7;
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(getLocalDateStr(d));
    }
    const { data } = await window.supabase
      .from('streak_marks')
      .select('user_id, marked_at')
      .eq('space_id', spaceId)
      .in('marked_at', dates);
    const marks = data || [];
    return dates.map(date => {
      const dayMarks = marks.filter(m => m.marked_at === date);
      return { date, userIds: dayMarks.map(m => m.user_id) };
    });
  },

  async getPartnerMarked(space, userId, today) {
    if (space.mode === 'solo') return true;
    const todayStr = today || getLocalDateStr();
    const otherId = space.created_by === userId ? space.partner_id : space.created_by;
    if (!otherId) return false;
    const { data } = await window.supabase
      .from('streak_marks')
      .select('id')
      .eq('space_id', space.id)
      .eq('user_id', otherId)
      .eq('marked_at', todayStr)
      .maybeSingle();
    return !!data;
  },

  async getSharedVerse() {
    if (window.Devotional) {
      try {
        const shared = await window.Devotional.getToday(true);
        if (shared && shared.verses) {
          return { reference: shared.verses.reference, text: shared.verses.text };
        }
      } catch (e) {}
    }
    const { data: dbVerses } = await window.supabase
      .from('verses')
      .select('*')
      .eq('mood', 'positive');
    if (dbVerses && dbVerses.length > 0) {
      const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const idx = day % dbVerses.length;
      return dbVerses[idx];
    }
    return null;
  },

  calculateShields(count) {
    if (count >= 1000) return 3;
    if (count >= 100) return 2;
    if (count >= 10) return 1;
    return 0;
  },

  checkMilestone(count) {
    const ms = [7, 30, 100, 365, 1000];
    return ms.includes(count) ? count : null;
  }
};
