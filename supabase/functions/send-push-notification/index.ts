import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface SpaceRow {
  created_by: string;
  partner_id: string | null;
}

interface PushSubRow {
  fcm_token: string;
}

interface ActivityRecord {
  id: string;
  space_id: string;
  user_id: string;
  type: string;
  text: string;
  module: string;
  created_at: string;
}

function pemToBinary(pem: string): Uint8Array {
  const normalized = pem.replace(/\\n/g, '\n');
  const b64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
    .trim();
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function createJwt(clientEmail: string, privateKeyPem: string): Promise<string> {
  const enc = new TextEncoder();

  const toB64Url = (data: string | Uint8Array): string => {
    const bytes = typeof data === 'string' ? enc.encode(data) : data;
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const headerB64 = toB64Url(JSON.stringify(header));
  const claimsB64 = toB64Url(JSON.stringify(claims));
  const signatureInput = `${headerB64}.${claimsB64}`;

  const keyBytes = pemToBinary(privateKeyPem);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    enc.encode(signatureInput),
  );

  return `${signatureInput}.${toB64Url(new Uint8Array(sig))}`;
}

async function getAccessToken(sa: ServiceAccount): Promise<string | null> {
  try {
    const jwt = await createJwt(sa.client_email, sa.private_key);
    const params = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const responseText = await res.text();
    if (!res.ok) {
      console.error('OAuth response error:', res.status, responseText);
      return null;
    }
    const data = JSON.parse(responseText);
    return data.access_token || null;
  } catch (e) {
    console.error('getAccessToken error:', (e as Error).message);
    console.error('private_key preview:', sa.private_key.substring(0, 80));
    return null;
  }
}

function fetchFromSupabase(url: string, key: string, path: string) {
  return fetch(`${url}${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });
}

const MODULE_LABELS: Record<string, string> = {
  prayer: 'Oración',
  prayers: 'Oración',
  gratitude: 'Testimonio',
  chat: 'Chat',
  encouragement: 'Chat',
  goals: 'Metas',
  dates: 'Fechas',
  streak: 'Racha',
  dashboard: 'Dashboard',
  bible: 'La Palabra',
  devotional: 'Devocional',
  notification: 'Notificación',
};

const TYPE_ICONS: Record<string, string> = {
  prayer: '🙏',
  gratitude: '⭐',
  testimony: '⭐',
  chat: '💬',
  encouragement: '💬',
  goal: '🎯',
  date: '📅',
  streak: '🔥',
  devotional: '🤝',
  milestone: '🎉',
  bible_read: '📖',
  space_created: '💕',
  space_joined: '🔗',
};

serve(async (req) => {
  try {
    const body = await req.json() as { type?: string; table?: string; record?: ActivityRecord };
    const record = body.record;
    if (!record || !record.space_id || !record.user_id) {
      return new Response('ok', { status: 200 });
    }

    const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!saJson) {
      console.error('FIREBASE_SERVICE_ACCOUNT secret not found');
      return new Response('ok', { status: 200 });
    }
    const sa: ServiceAccount = JSON.parse(saJson);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseKey) {
      console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
      return new Response('ok', { status: 200 });
    }

    const spaceRes = await fetchFromSupabase(
      supabaseUrl,
      supabaseKey,
      `/rest/v1/spaces?id=eq.${record.space_id}&select=created_by,partner_id`,
    );
    const spaces: SpaceRow[] = await spaceRes.json();
    const space = spaces[0];
    if (!space) return new Response('ok', { status: 200 });

    const partnerId = space.created_by === record.user_id ? space.partner_id : space.created_by;
    if (!partnerId) return new Response('ok', { status: 200 });

    const tokenRes = await fetchFromSupabase(
      supabaseUrl,
      supabaseKey,
      `/rest/v1/push_subscriptions?user_id=eq.${partnerId}&select=fcm_token`,
    );
    const tokens: PushSubRow[] = await tokenRes.json();
    const fcmToken = tokens[0]?.fcm_token;
    if (!fcmToken) return new Response('ok', { status: 200 });

    const accessToken = await getAccessToken(sa);
    if (!accessToken) {
      console.error('Failed to get OAuth access token');
      return new Response('ok', { status: 200 });
    }

    const icon = TYPE_ICONS[record.type] || '🔔';
    const moduleLabel = MODULE_LABELS[record.module] || record.module || 'Actividad';
    const textBody = record.text ? (record.text.length > 100 ? record.text.substring(0, 100) + '...' : record.text) : 'Nueva actividad';

    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: {
              title: `${icon} ${moduleLabel}`,
              body: textBody,
            },
            data: {
              type: record.type,
              module: record.module || '',
              url: '/rincon-de-fe-y-amor/dashboard.html',
            },
          },
        }),
      },
    );

    if (!fcmRes.ok) {
      const errText = await fcmRes.text();
      console.error('FCM send error:', fcmRes.status, errText);
    }

    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error('send-push-notification error:', e);
    return new Response('ok', { status: 200 });
  }
});
