const VERSES = [
  { ref: 'Filipenses 4:13', text: 'Todo lo puedo en Cristo que me fortalece.' },
  { ref: 'Jeremías 29:11', text: 'Porque yo sé los pensamientos que tengo acerca de vosotros, pensamientos de paz, y no de mal.' },
  { ref: 'Salmos 121:1-2', text: 'Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro? Mi socorro viene de Jehová.' },
  { ref: 'Proverbios 3:5-6', text: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.' },
  { ref: 'Salmos 23:4', text: 'Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo.' },
  { ref: 'Romanos 8:28', text: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien.' },
  { ref: 'Isaías 41:10', text: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo.' },
  { ref: 'Salmos 34:17-18', text: 'Claman los justos, y Jehová oye, y los libra de todas sus angustias.' },
  { ref: 'Mateo 19:6', text: 'Así que no son ya más dos, sino una sola carne; por tanto, lo que Dios juntó, no lo separe el hombre.' },
  { ref: '1 Corintios 13:4-5', text: 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso.' },
  { ref: 'Salmos 37:4', text: 'Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón.' },
  { ref: 'Josué 1:9', text: 'Esfuérzate y sé valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo.' },
  { ref: 'Salmos 27:1', text: 'Jehová es mi luz y mi salvación; ¿de quién temeré?' },
  { ref: 'Romanos 15:13', text: 'Y el Dios de esperanza os llene de todo gozo y paz en el creer.' },
  { ref: 'Salmos 46:10', text: 'Estad quietos, y sabed que yo soy Dios.' },
  { ref: 'Efesios 4:32', text: 'Antes sed benignos unos con otros, misericordiosos, perdonándoos unos a otros.' },
  { ref: 'Salmos 121:3-4', text: 'No dará tu pie al resbaladero, ni se dormirá el que te guarda.' },
  { ref: 'Deuteronomio 31:6', text: 'Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo de ellos.' },
  { ref: 'Salmos 16:8', text: 'A Jehová he puesto siempre delante de mí; porque está a mi diestra, no seré conmovido.' },
  { ref: '1 Pedro 5:7', text: 'Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros.' },
  { ref: 'Salmos 34:8', text: 'Gustad y ved que es bueno Jehová; dichoso el hombre que confía en él.' },
  { ref: 'Colosenses 3:14', text: 'Y sobre todas estas cosas vestíos de amor, que es el vínculo perfecto.' },
  { ref: 'Salmos 91:1-2', text: 'El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente.' },
  { ref: 'Mateo 11:28', text: 'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.' },
  { ref: 'Salmos 119:105', text: 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.' },
  { ref: 'Romanos 12:12', text: 'Gozosos en la esperanza; sufridos en la tribulación; constantes en la oración.' },
  { ref: 'Salmos 30:5', text: 'Porque un momento será su ira, pero su favor dura toda la vida.' },
  { ref: 'Gálatas 6:9', text: 'No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos.' },
  { ref: 'Salmos 55:22', text: 'Echa sobre Jehová tu carga, y él te sustentará.' },
  { ref: 'Efesios 5:25', text: 'Maridos, amad a vuestras mujeres, así como Cristo amó a la iglesia.' },
  { ref: 'Salmos 62:8', text: 'Confiad en él en todo tiempo; derramad delante de él vuestro corazón.' },
  { ref: 'Salmos 118:24', text: 'Este es el día que hizo Jehová; nos gozaremos y alegraremos en él.' },
  { ref: 'Romanos 12:10', text: 'Amaos los unos a los otros con amor fraternal.' },
  { ref: 'Salmos 86:7', text: 'En el día de mi angustia te llamaré, porque tú me respondes.' },
  { ref: '2 Timoteo 1:7', text: 'Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.' },
  { ref: 'Salmos 145:18', text: 'Cercano está Jehová a todos los que le invocan, a todos los que le invocan de veras.' },
  { ref: 'Juan 14:27', text: 'La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da.' },
  { ref: 'Salmos 37:5', text: 'Encomienda a Jehová tu camino, y confía en él; y él hará.' },
  { ref: 'Nahúm 1:7', text: 'Jehová es bueno, fortaleza en el día de la angustia; y conoce a los que en él confían.' },
  { ref: 'Salmos 63:1', text: 'Dios, Dios mío eres tú; de madrugada te buscaré; mi alma tiene sed de ti.' },
  { ref: '1 Juan 4:19', text: 'Nosotros le amamos a él, porque él nos amó primero.' },
  { ref: 'Salmos 92:1-2', text: 'Bueno es alabarte, oh Jehová, y cantar salmos a tu nombre, oh Altísimo.' },
  { ref: 'Efesios 5:33', text: 'Y la mujer respete a su marido, y el marido ame a su mujer.' },
  { ref: 'Salmos 100:5', text: 'Porque Jehová es bueno; para siempre es su misericordia.' },
  { ref: 'Salmos 138:3', text: 'El día que clamé, me respondiste; me fortaleciste con vigor en mi alma.' },
  { ref: 'Proverbios 18:22', text: 'El que halla esposa halla el bien, y alcanza la benevolencia de Jehová.' },
  { ref: 'Salmos 42:1', text: 'Como el ciervo brama por las corrientes de las aguas, así clama por ti, oh Dios, el alma mía.' },
  { ref: 'Romanos 15:7', text: 'Por tanto, recibíos los unos a los otros, como también Cristo nos recibió.' },
  { ref: 'Salmos 143:8', text: 'Hazme oír por la mañana tu misericordia, porque en ti he confiado.' },
  { ref: 'Salmos 136:26', text: 'Alabad al Dios de los cielos, porque para siempre es su misericordia.' }
];

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2500);
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / 86400000);
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1) return 'ahora';
  if (diff < 60) return diff + 'm';
  if (diff < 1440) return Math.floor(diff / 60) + 'h';
  return Math.floor(diff / 1440) + 'd';
}

function getActivityIcon(type) {
  const map = {
    prayer: { icon: '<i class="ti ti-heart"></i>', cls: 'prayer' },
    gratitude: { icon: '<i class="ti ti-star"></i>', cls: 'gratitude' },
    encouragement: { icon: '<i class="ti ti-message-2"></i>', cls: 'message' },
    message: { icon: '<i class="ti ti-message-2"></i>', cls: 'message' },
    goal: { icon: '<i class="ti ti-target"></i>', cls: 'goal' },
    date: { icon: '<i class="ti ti-calendar"></i>', cls: 'date' },
    streak: { icon: '<i class="ti ti-flame"></i>', cls: 'streak' },
    devotional: { icon: '<i class="ti ti-heart-handshake"></i>', cls: 'prayer' },
    milestone: { icon: '<i class="ti ti-celebration"></i>', cls: 'streak' },
    space_created: { icon: '<i class="ti ti-hearts"></i>', cls: 'date' },
    space_joined: { icon: '<i class="ti ti-link"></i>', cls: 'date' },
    bible_read: { icon: '<i class="ti ti-book"></i>', cls: 'message' }
  };
  return map[type] || { icon: '<i class="ti ti-pin"></i>', cls: 'prayer' };
}

function getTodayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

async function loadDevotionalVerse() {
  try {
    const devotional = await window.Devotional.getToday(false);
    if (devotional && devotional.verses) {
      return devotional;
    }
  } catch (e) {
    console.error('Error loading devotional verse:', e);
  }
  return null;
}

async function loadVerse() {
  const day = getDayOfYear();

  const { data: dbVerses } = await window.supabase
    .from('verses')
    .select('*')
    .eq('mood', 'positive');
  if (dbVerses && dbVerses.length > 0) {
    const idx = day % dbVerses.length;
    return { verse: dbVerses[idx], timeLabel: null };
  }

  try {
    const idxRes = await fetch('data/biblia/index.json');
    const index = await idxRes.json();
    const book = index[day % index.length];
    const bkRes = await fetch('data/biblia/' + book.key + '.json');
    const chapters = await bkRes.json();
    const ch = chapters[day % chapters.length];
    const v = ch[day % ch.length];
    return {
      verse: {
        reference: book.shortTitle + ' ' + (day % chapters.length + 1) + ':' + (day % ch.length + 1),
        text: v
      },
      timeLabel: null
    };
  } catch (e) {
    const idx = day % VERSES.length;
    return {
      verse: { reference: VERSES[idx].ref, text: VERSES[idx].text },
      timeLabel: null
    };
  }
}

async function loadPage(userId, space) {
  const today = getTodayStr();

  let timeLabel = null;
  let devotionalData = await loadDevotionalVerse();
  let verse = null;
  if (devotionalData && devotionalData.verses) {
    verse = { text: devotionalData.verses.text, reference: devotionalData.verses.reference };
    timeLabel = window.Devotional.getTimeLabel();
  }
  if (!verse) {
    const fallback = await loadVerse();
    verse = fallback.verse;
    timeLabel = fallback.timeLabel;
  }

  const [streakRes, activitiesRes, gratitudesRes, todayMarkRes, datesRes] = await Promise.all([
    window.supabase.from('streak').select('*').eq('space_id', space.id).maybeSingle(),
    window.supabase.from('activity').select('*').eq('space_id', space.id).order('created_at', { ascending: false }).limit(7),
    window.supabase.from('gratitude').select('*').eq('space_id', space.id).order('created_at', { ascending: false }).limit(5),
    window.supabase.from('streak_marks').select('*').eq('space_id', space.id).eq('user_id', userId).eq('marked_at', today).maybeSingle(),
    window.supabase.from('special_dates').select('*').eq('space_id', space.id)
  ]);

  const streak = streakRes.data || null;
  const activities = activitiesRes.data || [];
  const gratitudes = gratitudesRes.data || [];
  const todayMark = todayMarkRes.data;
  const dates = datesRes.data || [];

  const partnerMarked = space.mode === 'couple' ? await checkPartnerMarked(space, userId, today) : false;

  const userName = window.currentUser ? window.currentUser.name || 'Tú' : 'Tú';
  const userInitial = userName ? userName.charAt(0).toUpperCase() : '?';
  const partnerName = window.currentPartner ? window.currentPartner.name || 'Pareja' : 'Pareja';

  const headerAvatar = document.getElementById('headerAvatar');
  headerAvatar.textContent = userInitial;

  const todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('headerDate').textContent = todayDate.charAt(0).toUpperCase() + todayDate.slice(1);

  let html = '<h2 class="sr-only">Dashboard — actividad reciente, racha de oración y versículo del día</h2>';

  if (verse) {
    html += `
      <div style="padding:16px">
        <div class="verse-card" onclick="window.location.href='devocional.html'" style="cursor:pointer">
          ${timeLabel ? `<div class="verse-greeting">${timeLabel.label} ${timeLabel.icon}</div>` : ''}
          <div class="verse-quote">"</div>
          <div class="verse-text">${verse.text}</div>
          <div class="verse-ref">— ${verse.reference}</div>
        </div>
      </div>
    `;
  }

  const streakCount = streak ? streak.count : 0;
  const streakBest = streak ? (streak.best_count || 0) : 0;

  html += `
    <div style="padding:0 16px">
      <div class="streak-widget" onclick="window.location.href='streak.html'" style="cursor:pointer">
        <div style="display:flex;align-items:center;gap:16px">
          <div>
            <div class="streak-number">${streakCount}</div>
            <div class="streak-label">días de racha ${streakBest > streakCount ? '· Mejor ' + streakBest : ''}</div>
          </div>
          <div style="flex:1"></div>
          <div class="streak-hearts" onclick="event.stopPropagation();window.location.href='streak.html'">
            <span${!todayMark ? ' class="heart-inactive"' : ''}><i class="ti ti-heart" style="font-size:22px"></i></span>
            ${space.mode === 'couple' ? `<span${!partnerMarked ? ' class="heart-inactive"' : ''}><i class="ti ti-heart" style="font-size:22px"></i></span>` : ''}
            <span class="separator">·</span>
            <span class="check-icon">${todayMark ? '<i class="ti ti-check" style="color:var(--success)"></i>' : '<i class="ti ti-clock"></i>'}</span>
          </div>
        </div>
        ${space.mode === 'couple' ? `<div style="font-size:12px;color:var(--text-3);margin-top:4px">${userName} ${todayMark ? '<i class="ti ti-check" style="color:var(--success)"></i>' : '<i class="ti ti-clock"></i>'} & ${partnerName} ${partnerMarked ? '<i class="ti ti-check" style="color:var(--success)"></i>' : '<i class="ti ti-clock"></i>'}</div>` : ''}
        <div class="streak-verse">— 1 Corintios 13:4 · El amor es paciente, es bondadoso...</div>
        <a href="streak.html" class="streak-link" onclick="event.stopPropagation()">Ver racha completa <i class="ti ti-arrow-right" style="font-size:11px"></i></a>
      </div>
    </div>
  `;

  const prayedToday = todayMark || false;

  html += `
    <button class="btn-pray ${prayedToday ? 'done' : ''}" id="prayBtn" ${prayedToday ? 'disabled' : ''}>
      ${prayedToday ? '<i class="ti ti-check" style="font-size:18px"></i> Ya oraste hoy <i class="ti ti-celebration"></i>' : '<i class="ti ti-heart" style="font-size:18px"></i> Oramos hoy'}
    </button>
  `;

  let alertCount = 0;

  if (!prayedToday) {
    alertCount++;
    html += `
      <div style="padding:0 16px;margin-bottom:8px">
        <div class="alert-refined">
          <div class="alert-icon" style="background:#e8547a22;color:#e8547a"><i class="ti ti-bell"></i></div>
          <div class="alert-body">
            <div class="alert-title">¡No has orado hoy!</div>
            <div class="alert-sub">Mantén tu racha activa</div>
          </div>
          <button class="btn-soft" id="alertPrayBtn">ORAR AHORA</button>
        </div>
      </div>
    `;
  }

  const upcomingDates = dates.filter(d => {
    const today2 = new Date();
    const dateObj = new Date(d.date);
    let next = new Date(today2.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    if (next <= today2) next.setFullYear(today2.getFullYear() + 1);
    const diff = Math.ceil((next - today2) / 86400000);
    return diff <= 7 && diff >= 0;
  });

  upcomingDates.forEach(d => {
    alertCount++;
    const today2 = new Date();
    const dateObj = new Date(d.date);
    let next = new Date(today2.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    if (next <= today2) next.setFullYear(today2.getFullYear() + 1);
    const diff = Math.ceil((next - today2) / 86400000);
    const text = diff === 0 ? '<i class="ti ti-celebration"></i> ¡Hoy!' : `<i class="ti ti-calendar"></i> En ${diff} días`;
    html += `
      <div style="padding:0 16px;margin-bottom:8px">
        <div class="alert-refined">
          <div class="alert-icon" style="background:#fbbf2422;color:#fbbf24"><i class="ti ti-cake"></i></div>
          <div class="alert-body">
            <div class="alert-title">${d.title}</div>
            <div class="alert-sub">${text} · Planifica algo especial</div>
          </div>
          <a href="dates.html" class="btn-soft">VER</a>
        </div>
      </div>
    `;
  });

  if (alertCount > 0) {
    document.getElementById('notifDot').style.display = 'block';
  }

  if (gratitudes.length > 0) {
    html += `<div class="section-label">Últimas gratitudes</div>`;
    gratitudes.forEach(g => {
      const isMine = g.user_id === userId;
      html += `
        <div style="padding:0 16px;margin-bottom:8px">
          <div class="activity-card" onclick="window.location.href='gratitude.html'">
            <div class="activity-icon gratitude"><i class="ti ti-star"></i></div>
            <div class="activity-info">
              <div class="activity-name">${isMine ? 'Tú' : partnerName}</div>
              <div class="activity-text">${g.text}</div>
            </div>
            <div class="activity-time">${timeAgo(g.created_at)}</div>
          </div>
        </div>
      `;
    });
  }

  if (activities.length > 0) {
    html += `<div class="section-label">Actividad reciente</div>`;
    activities.forEach(a => {
      const icon = getActivityIcon(a.type);
      const isMine = a.user_id === userId;
      let name = isMine ? 'Tú' : partnerName;
      let text = a.text || 'Actividad';
      let link = 'dashboard.html';
      if (a.module === 'prayers') link = 'prayers.html';
      else if (a.module === 'gratitude') link = 'gratitude.html';
      else if (a.module === 'encouragement') link = 'encouragement.html';
      else if (a.module === 'goals') link = 'goals.html';
      else if (a.module === 'dates') link = 'dates.html';
      else if (a.module === 'bible') link = 'palabra.html';
      else if (a.module === 'devotional') link = 'devocional.html';
      else if (a.module === 'streak') link = 'streak.html';

      html += `
        <div style="padding:0 16px;margin-bottom:8px">
          <div class="activity-card" onclick="window.location.href='${link}'">
            <div class="activity-icon ${icon.cls}">${icon.icon}</div>
            <div class="activity-info">
              <div class="activity-name">${name}</div>
              <div class="activity-text">${text}</div>
            </div>
            <div class="activity-time">${timeAgo(a.created_at)}</div>
          </div>
        </div>
      `;
    });
  }

  if (activities.length === 0 && gratitudes.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon"><i class="ti ti-seedling" style="font-size:48px;opacity:0.15"></i></div>
        <div class="empty-title">Comienza tu viaje espiritual</div>
        <div class="empty-subtitle">Empieza registrando tus oraciones y gratitudes</div>
      </div>
    `;
  }

  document.getElementById('app').innerHTML = html;

  const prayBtn = document.getElementById('prayBtn');
  if (prayBtn && !prayedToday) {
    prayBtn.addEventListener('click', async () => {
      prayBtn.disabled = true;

      const { error: markError } = await window.supabase
        .from('streak_marks')
        .insert({ space_id: space.id, user_id: userId, marked_at: today });

      if (markError) {
        if (markError.code === '23505') {
          showToast('Ya marcaste hoy', 'error');
        } else {
          showToast('Error: ' + markError.message, 'error');
        }
        prayBtn.disabled = false;
        return;
      }

      await window.auth.logActivity(space.id, userId, 'streak', 'Marcó oración del día', 'dashboard');

      const { data: partnerMark } = await window.supabase
        .from('streak_marks')
        .select('*')
        .eq('space_id', space.id)
        .eq('marked_at', today)
        .neq('user_id', userId)
        .maybeSingle();

      const bothMarked = space.mode === 'solo' || partnerMark;

      if (bothMarked) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];

        let updateData = {};
        if (streak && streak.last_marked === yStr) {
          updateData = { count: (streak.count || 0) + 1, last_marked: today };
        } else if (streak && streak.shield_days > 0) {
          updateData = { shield_days: streak.shield_days - 1, last_marked: today };
        } else {
          updateData = { count: 1, last_marked: today };
        }

        if (streak) {
          await window.supabase.from('streak').update(updateData).eq('id', streak.id);
        } else {
          await window.supabase.from('streak').insert({ space_id: space.id, ...updateData });
        }
      }

      showToast('¡Oración registrada!', 'success');
      await loadPage(userId, space);
    });
  }

  const alertPrayBtn = document.getElementById('alertPrayBtn');
  if (alertPrayBtn) {
    alertPrayBtn.addEventListener('click', () => {
      if (prayBtn) prayBtn.click();
    });
  }
}

async function checkPartnerMarked(space, userId, today) {
  if (space.mode === 'solo') return true;
  const otherId = space.created_by === userId ? space.partner_id : space.created_by;
  if (!otherId) return false;
  const { data } = await window.supabase
    .from('streak_marks')
    .select('id')
    .eq('space_id', space.id)
    .eq('user_id', otherId)
    .eq('marked_at', today)
    .maybeSingle();
  return !!data;
}

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) { window.location.href = 'index.html'; return; }

  const { data: space } = await window.supabase
    .from('spaces')
    .select('*')
    .or(`created_by.eq.${session.user.id},partner_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!space) { window.location.href = 'link.html'; return; }

  await initLayout();
  await loadPage(session.user.id, space);
});
