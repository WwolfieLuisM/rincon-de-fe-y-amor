function getDaysSince(createdAt) {
  const s = new Date(createdAt);
  const start = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  const now = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  return Math.max(0, Math.floor((now - start) / 86400000));
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

function getInitialsFromName(name) {
  return getInitials(name);
}

window.initLayout = async function () {
  const session = await window.auth.getSession();
  if (!session) return;

  const userId = session.user.id;
  const profile = await window.auth.getProfile(userId);
  window.currentUser = profile || { id: userId, name: session.user.email?.split('@')[0] || 'User' };

  const { data: space } = await window.supabase
    .from('spaces')
    .select('*')
    .or(`created_by.eq.${userId},partner_id.eq.${userId}`)
    .single();
  if (!space) return;
  window.currentSpace = space;

  const otherId = space.created_by === userId ? space.partner_id : space.created_by;
  if (otherId) {
    const partnerProfile = await window.auth.getProfile(otherId);
    window.currentPartner = partnerProfile || { id: otherId, name: 'Pareja' };
  } else {
    window.currentPartner = null;
  }

  const userName = window.currentUser.name || 'Tú';
  const partnerName = window.currentPartner ? window.currentPartner.name : 'Pareja';
  const days = getDaysSince(space.created_at);

  const navItems = [
    { icon: '<i class="ti ti-dashboard"></i>', label: 'Dashboard', href: 'dashboard.html' },
    { icon: '<i class="ti ti-heart"></i>', label: 'Oraciones', href: 'prayers.html' },
    { icon: '<i class="ti ti-star"></i>', label: 'Gratitud', href: 'gratitude.html' },
    { icon: '<i class="ti ti-message-2"></i>', label: 'Ánimo', href: 'encouragement.html' },
    { icon: '<i class="ti ti-target"></i>', label: 'Metas', href: 'goals.html' },
    { icon: '<i class="ti ti-calendar"></i>', label: 'Fechas', href: 'dates.html' },
    { icon: '<i class="ti ti-user"></i>', label: 'Perfil', href: 'profile.html' },
    { icon: '<i class="ti ti-settings"></i>', label: 'Más', href: 'more.html' }
  ];

  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';

  let navHtml = navItems.map(item => {
    const active = item.href === currentPath ? ' active' : '';
    return `<a href="${item.href}" class="${active}"><span class="nav-icon">${item.icon}</span>${item.label}</a>`;
  }).join('');

  let codeHtml = '';
  if (space.mode === 'couple' && !space.partner_id) {
    codeHtml = `<div class="sidebar-code">Código: ${space.code}</div>`;
  }

  const sidebarHtml = `
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-avatars">
          <div class="sidebar-avatar">${getInitialsFromName(userName)}</div>
          ${space.mode === 'couple' ? `<div class="sidebar-avatar">${getInitialsFromName(partnerName)}</div>` : ''}
        </div>
        <div class="sidebar-names">${space.mode === 'couple' ? `${userName} & ${partnerName}` : userName}</div>
        <div class="sidebar-days">${space.mode === 'couple' ? `<i class="ti ti-flame" style="font-size:13px"></i> ${days} días juntos` : 'Modo Solo'}</div>
        ${codeHtml}
      </div>
      <div class="sidebar-nav">${navHtml}</div>
      <button class="sidebar-logout" id="logoutBtn">
        <span class="nav-icon"><i class="ti ti-logout"></i></span>Cerrar sesión
      </button>
    </div>
  `;

  document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (menuBtn && sidebar && overlay) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('open');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.auth.logout();
    });
  }
};
