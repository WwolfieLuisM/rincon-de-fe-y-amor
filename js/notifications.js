let _messaging = null;

function getMessaging() {
  if (typeof firebase === 'undefined') return null;
  if (_messaging) return _messaging;
  const app = firebase.initializeApp({
    apiKey: "AIzaSyCoJCMqWTAgP12-BFqi4Kwt58F0FK8J8po",
    authDomain: "prayerprojectapp.firebaseapp.com",
    projectId: "prayerprojectapp",
    storageBucket: "prayerprojectapp.firebasestorage.app",
    messagingSenderId: "527928200076",
    appId: "1:527928200076:web:79f7ba46de2427bd3fe4a9"
  }, 'messaging-app');
  _messaging = firebase.messaging(app);
  return _messaging;
}

const Notifications = {
  init: async function(userId) {
    try {
      const messaging = getMessaging();
      if (!messaging) return null;

      messaging.onMessage((payload) => {
        Notifications.showInApp(payload);
      });

      if (Notification.permission === 'granted') {
        const swReg = await navigator.serviceWorker.ready;
        const token = await messaging.getToken({
          vapidKey: 'BGeRmKLKpX5wDfkyYLKUXPvM-1mLe8Iit8XJIXaqR1kLiz2a4GHMjnQxjC4kl0Eeclqb9KnJRiRLEN9dy3v6qig',
          serviceWorkerRegistration: swReg
        });
        if (token) await Notifications.saveToken(userId, token);
      }

      return Notification.permission;
    } catch (e) {
      console.error('FCM init error:', e);
      return null;
    }
  },

  requestPermission: async function(userId) {
    try {
      const messaging = getMessaging();
      if (!messaging) return null;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;

      const swReg = await navigator.serviceWorker.ready;
      const token = await messaging.getToken({
        vapidKey: 'BGeRmKLKpX5wDfkyYLKUXPvM-1mLe8Iit8XJIXaqR1kLiz2a4GHMjnQxjC4kl0Eeclqb9KnJRiRLEN9dy3v6qig',
        serviceWorkerRegistration: swReg
      });
      if (token) await Notifications.saveToken(userId, token);

      return token;
    } catch (e) {
      console.error('FCM requestPermission error:', e);
      return null;
    }
  },

  saveToken: async function(userId, token) {
    const { error } = await window.supabase
      .from('push_subscriptions')
      .upsert({ user_id: userId, fcm_token: token, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) console.error('Error saving FCM token:', error);
  },

  showInApp: function(payload) {
    const { title, body } = payload.notification;
    const toast = document.getElementById('toast');
    if (toast) {
      toast.innerHTML = '🔔 ' + title + ': ' + body;
      toast.className = 'toast success show';
      setTimeout(() => toast.classList.remove('show'), 4000);
    }
  },

  getHistory: async function(spaceId, limit = 20) {
    const { data } = await window.supabase
      .from('activity')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  },

  getUnreadCount: async function(spaceId, userId, since) {
    const { count } = await window.supabase
      .from('activity')
      .select('*', { count: 'exact', head: true })
      .eq('space_id', spaceId)
      .neq('user_id', userId)
      .gte('created_at', since)
      .not('module', 'is', null);
    return count || 0;
  }
};
