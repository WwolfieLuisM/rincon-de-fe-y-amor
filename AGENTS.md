# AGENTS.md — Contexto permanente para IA

> Léeme completo ANTES de hacer cualquier cambio en el código.

---

## 1. Stack y despliegue

- **PWA estática** — Sin framework. Vanilla JS + CSS. Sin bundler.
- **Host:** GitHub Pages en `https://wwolfieluism.github.io/rincon-de-fe-y-amor/`
- **Service Worker** scope: `/rincon-de-fe-y-amor/`. Nombre: `rincon-fe-v8`
- **CDNs:** jsdelivr pinned `@supabase/supabase-js@2.49.0/dist/umd/supabase.min.js`; `@tabler/icons-webfont@latest`; Google Fonts Inter
- **Firebase Cloud Messaging (FCM)** — `firebase-app-compat` + `firebase-messaging-compat` desde `googleapis.com`
- **Package:** `package.json` vacío (sin scripts útiles). No hay npm run dev/test/lint.

## 2. Supabase

- **Project:** `qktdrlhdzfefjwhxqjws`
- **Supabase key (public anon):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdGRybGhkemZlZmp3aHhxandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTgzNjcsImV4cCI6MjA5NDAzNDM2N30.6vhmJQUtyQENxfBkxKl-dqWYTPEv_fMo2qPS2wzpdwQ`
- **Supabase URL:** `https://qktdrlhdzfefjwhxqjws.supabase.co`
- **Native localStorage key (sesión):** `sb-qktdrlhdzfefjwhxqjws-auth-token`
- **Client config:** `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`, `storage: window.localStorage`
- **Pinned CDN:** `@2.49.0/dist/umd/supabase.min.js` (no usar `@latest`)
- **Error handler:** `translateError()` en `auth.js` mapea errores de Supabase a español.

## 3. Archivos raíz (16 HTML pages)

| Archivo | Ruta | Propósito |
|---|---|---|
| `index.html` | `/rincon-de-fe-y-amor/` | Login + registro |
| `register.html` | `/rincon-de-fe-y-amor/register.html` | Registro con contraseña |
| `recover.html` | `/rincon-de-fe-y-amor/recover.html` | Recuperar contraseña |
| `dashboard.html` | `/rincon-de-fe-y-amor/dashboard.html` | Página principal |
| `prayers.html` | `/rincon-de-fe-y-amor/prayers.html` | Oraciones compartidas |
| `gratitude.html` | `/rincon-de-fe-y-amor/gratitude.html` | Testimonios/agradecimientos |
| `palabra.html` | `/rincon-de-fe-y-amor/palabra.html` | Biblia (lectura) |
| `devocional.html` | `/rincon-de-fe-y-amor/devocional.html` | Devocional diario |
| `encouragement.html` | `/rincon-de-fe-y-amor/encouragement.html` | Chat/ánimo |
| `goals.html` | `/rincon-de-fe-y-amor/goals.html` | Metas compartidas |
| `dates.html` | `/rincon-de-fe-y-amor/dates.html` | Fechas especiales |
| `streak.html` | `/rincon-de-fe-y-amor/streak.html` | Racha de oración |
| `notifications.html` | `/rincon-de-fe-y-amor/notifications.html` | Actividad/notificaciones |
| `profile.html` | `/rincon-de-fe-y-amor/profile.html` | Perfil de usuario |
| `more.html` | `/rincon-de-fe-y-amor/more.html` | Ajustes varios |
| `link.html` | `/rincon-de-fe-y-amor/link.html` | Vincular pareja (código) |

**Importante:** `start_url` del manifest es `/rincon-de-fe-y-amor/dashboard.html`. SW scope es `/rincon-de-fe-y-amor/`.

## 4. Estructura JS

### Global / Shared

| Archivo | Rol |
|---|---|
| `js/supabase.js` | Crea `window.supabase` con `createClient()`. Incluido en TODAS las páginas. |
| `js/auth.js` | `window.auth` — `ensureSession()`, `getUser()`, `getSession()`, `logout()`, `translateError()`, `logActivity()`. Incluye también `sw.js` register y `onAuthStateChange`. |
| `js/devotional.js` | `window.Devotional` — `getToday(isShared)`, `markAsRead()`, `hasReadToday()`, `getHistory()`, `getTimeLabel()`. |
| `js/streak.js` | `window.streakService` — `getStreak()`, `getTodayMarks()`, `markToday()`, `checkAndUpdate()`, `getHistory()`, `getSharedVerse()`, `calculateShields()`, `checkMilestone()`. |
| `js/notifications.js` | `window.Notifications` — `init()`, `requestPermission()`, `saveToken()`, `showInApp()`, `getHistory()`, `getUnreadCount()`. FCM con Firebase. |
| `components/layout.js` | `window.initLayout()` — sidebar, header, menú, logout, avatares, días juntos. |

### Páginas (`js/pages/`)

Cada página HTML carga su correspondiente `*-page.js` o `*.js`. Cada `*-page.js` contiene una función `loadPage(userId, space)` llamada al final desde un listener `DOMContentLoaded`.

**Patrón común en TODAS las páginas:**
```js
window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.ensureSession();
  if (!session) { window.location.href = 'index.html'; return; }
  const { data: space } = await window.supabase
    .from('spaces')
    .select('*')
    .or(`created_by.eq.${session.user.id},partner_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle();
  if (!space) { window.location.href = 'link.html'; return; }
  await initLayout();
  await loadPage(session.user.id, space);
});
```

Variables globales compartidas: `window.currentUser`, `window.currentPartner`, `window.currentSpace`.

## 5. Sistema de diseño / CSS

```css
:root {
  --bg: #0a0a0a;
  --surface: #111111;
  --surface-2: #1a1a1a;
  --border: #1e1e1e;
  --border-2: #2a2a2a;
  --accent: #e8547a;
  --accent-rgb: 232, 84, 122;
  --accent-dark: #c73f63;
  --text-1: #f0f0f0;
  --text-2: #888888;
  --text-3: #444444;
  --success: #4ade80;
  --warning: #fbbf24;
  --radius: 14px;
  --radius-sm: 10px;
  --radius-full: 100px;
  --glass-bg: rgba(10, 10, 10, 0.55);
  --glass-blur: 12px;
  --glass-border: rgba(255, 255, 255, 0.06);
}
```

- **Max width:** `390px` centrado (viewport de celular)
- **Header:** sticky top, `56px` height, fondo `#0d0d0d`, borde `var(--border)`
- **Glassmorphism:** `.glass-card` con `background: var(--glass-bg)`, `backdrop-filter: blur(var(--glass-blur))`, `border: 1px solid var(--glass-border)`
- **Backgrounds:** `body` usa `img/*-bg.webp` según la página (diferente bg para login, dashboard, prayers, etc.)
- **Iconos:** Tabler Icons (`<i class="ti ti-heart"></i>`)
- **Inputs password:** Toggle ojo con `ti-eye` / `ti-eye-off`
- **Version cache busters:** TODAS las URLs de JS/CSS llevan `?v=N`. Incrementar al desplegar cambios.

### Clases CSS recurrentes

| Clase | Propósito |
|---|---|
| `.input-field` | Input estándar |
| `.input-group` | Wrapper label + input |
| `.input-label` | Label de input |
| `.password-wrap` | Wrapper para input password + toggle |
| `.password-toggle` | Botón ojo en password |
| `.btn-primary` | Botón primario (accent) |
| `.btn-danger` | Botón de eliminar |
| `.btn-10` / `.btn-25` / `.btn-complete` | Botones de progreso en metas |
| `.card` | Card estándar |
| `.glass-card` | Card con glassmorphism |
| `.prayer-card` | Card de oración |
| `.goal-card` | Card de meta |
| `.activity-card` | Card de actividad |
| `.streak-card` | Card de racha |
| `.progress-bar` / `.progress-fill` | Barra de progreso |
| `.three-dot-wrap` / `.three-dot-btn` / `.three-dot-menu` | Menú contextual ⋮ |
| `.toast` | Toast flotante (show/error/success) |
| `.avatar-small` | Avatar 32px |
| `.auth-bg` | Fondo de login |
| `.auth-page` | Página de autenticación |
| `.auth-card` | Card de login/register |
| `.app-bg` | Fondo de app con overlay |

## 6. Lógica de negocio

### Streak (Racha de oración) — `streak.js` + `streak-page.js`

**Tablas:** `streak` (space_id, count, best_count, last_marked, shield_days), `streak_marks` (space_id, user_id, marked_at)

**Flujo `checkAndUpdate()`:**
1. Obtiene marks de hoy → ambos marcaron? (solo → 1 user, couple → 2 users)
2. Si no ambos → return sin update
3. Si `last_marked === ayer` → count+1
4. Si no, pero hay shield_days → shield-1 (protegido)
5. Si no → reset (count=1)
6. Si count > best → actualiza best
7. `calculateShields(count)`: ≥1000→3, ≥100→2, ≥10→1, <10→0

**Nota importante:** La versión actual de `streak-page.js` (restaurada desde commit `f6af4c8`) usa la lógica VIEJA de shield levels (0/1/5/10). NO coincide con `streak.js` actual (0/1/2/3). Si se modifica `streak-page.js`, actualizar línea 104 para usar nuevos valores.

### Oraciones — `prayers-page.js`

**Tablas:** `prayers` (id, space_id, user_id, title, category, days_goal, progress, answered, answered_at, created_at), `prayer_marks` (id, prayer_id, user_id, marked_at)

- Categorías: faith, family, health, work, general
- 3 tabs: Activas, Respondidas, Mis oraciones
- El progreso cuenta SOLO días mutuos (ambos marcaron la misma fecha)
- Realtime: 2 canales (`prayers-{spaceId}` + `prayer-marks-{spaceId}`)
- `prayer_marks` NO tiene `space_id` — se filtra por prayer_id en el callback
- Menú ⋮: Editar, Respondida, Eliminar (visible siempre)

### Metas — `goals-page.js`

**Tabla:** `goals` (id, space_id, title, target_date, progress, completed, created_at)
**NO tiene** `user_id` — solo `space_id`.

- Tabs: Activas, Completadas
- Botones: +10%, +25%, Completar
- Realtime: canal `goals-{spaceId}` (INSERT, UPDATE, DELETE)
- Menú ⋮: Editar, Eliminar (solo en activas)

### Fechas especiales — `dates-page.js`

**Tabla:** `special_dates` (id, space_id, user_id, title, date, reminder_days, created_at)

- `daysUntilNext()` calcula próxima ocurrencia (puede ser el próximo año)
- Realtime: canal `dates-{spaceId}` → recarga completa si el partner cambia algo
- Menú ⋮: Editar, Eliminar

### Testimonios/Gratitud — `gratitude-page.js`

**Tabla:** `gratitude` (id, space_id, user_id, content, category, created_at)

- Tabs: Todos, Míos (filtro `isMine`)
- Menú ⋮: solo visible si `isMine` (editar, eliminar)
- Categorías: Dios, Pareja, Familia, Trabajo, Salud, Otro

### Dashboard — `dashboard.js`

- Muestra tarjetas con cards de cada módulo
- Versículo diario aleatorio del array `VERSES` (30+ versículos hardcodeados)
- Botones shortcode: Oraciones, Testimonios, Devocional, La Palabra, Metas, Fechas, Racha
- Notificación de cumpleaños/ aniversario, tarjeta de invitar pareja
- Contador de días juntos

### Devocional — `devotional-page.js`

- Carga devocional del día según hora (mañana/tarde/noche)
- `Devotional.getToday(true)` para el compartido, `getToday(false)` para personal
- `markAsRead()` registra lectura

### Palabra (Biblia) — `palabra-page.js`

- Carga capítulos completos desde `data/biblia/` (JSON)
- Buscador de libros
- Navegación entre capítulos
- **IMPORTANTE:** El DOM de versículos se construye con `DocumentFragment` + `createElement`, NO con `innerHTML` (evita crash en selección de texto en móvil). CSS: `touch-action: manipulation; user-select: none` en móvil, `user-select: text` en desktop via `@media (hover: hover)`.

### Autenticación — `auth.js`

- Magic link (OTP), email+password, recovery link
- `ensureSession()`: primero intenta `getSession()`, si falla lee la clave nativa `sb-qktdrlhdzfefjwhxqjws-auth-token` del localStorage y llama `setSession()`
- Traducción de errores a español vía `translateError()`

### Notificaciones — `notifications.js`

- FCM con Firebase. VAPID key hardcodeada.
- Permiso solicitado manualmente. Token guardado en tabla `push_subscriptions`
- `onMessage()` → `showInApp()` toast
- `getHistory()` desde tabla `activity`
- `getUnreadCount()` cuenta actividad no propia desde una fecha

## 7. Service Worker — `sw.js`

- **CACHE:** `rincon-fe-v8` (incrementar al cambiar el static list)
- **Static precache:** todos los HTML, CSS, JS, imágenes WebP + favicons
- **Estrategias:**
  - API calls (`supabase.co`, `googleapis.com`): network-only (no cache)
  - HTML: network-first, fallback a cache
  - JS/CSS: network-first, actualiza cache, fallback a cache
  - Images/assets: cache-first, fallback a network
- **FCM:** `onBackgroundMessage()` muestra notificación push
- **`notificationclick`:** abre URL del data payload o dashboard

## 8. WhatsApp

- El número `+53 63624567` NUNCA debe aparecer como texto visible en HTML.
- Se construye en JS: `waCode='53'` + `waNum='63624567'` → `5363624567`
- Usar en enlaces `https://wa.me/53${waNum}?text=...`

## 9. Convenciones de código

- **NO** añadir comentarios a menos que sea necesario para explicar lógica compleja
- **NO** crear archivos nuevos a menos que sea estrictamente necesario
- **SIEMPRE** leer el archivo completo antes de editarlo
- Usar template literals (backticks) para strings multilínea, NO single quotes (`'`)
- **PowerShell encoding:** `Set-Content` por defecto usa ANSI (Windows-1252). Siempre usar `git checkout <commit> -- <file>` para restaurar archivos, o `[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)`
- Cache busters: al modificar un JS/CSS, incrementar `?v=N` en TODOS los HTML que lo referencien
- Capacidad PWA cold start: asegurar que `ensureSession()` funcione sin servidor — leer la clave nativa de localStorage directamente
- Evitar `innerHTML` para contenido que el usuario pueda seleccionar (ej. versículos bíblicos) — usar `DocumentFragment` + `createElement`

## 10. Valores de CDN pinned

| Recurso | Versión |
|---|---|
| Supabase JS | `@2.49.0/dist/umd/supabase.min.js` |
| Tabler Icons CSS | `@latest` (CDN) |
| Firebase App | `10.12.0` (CDN compat) |
| Firebase Messaging | `10.12.0` (CDN compat) |
| Google Fonts Inter | Sin versión (CDN) |

## 11. Edge Functions (Supabase)

- `send-push-notification` v6 desplegada para enviar notificaciones push FCM
- Usa tabla `push_subscriptions` con `fcm_token` por usuario

## 12. Imágenes

Rutas en `/rincon-de-fe-y-amor/img/`. Cada bg tiene `.webp` (usado en producción) y `.png` (origen, más pesado, se puede eliminar). Favicons varios.

**Formatos:**
- Backgrounds: `[page]-bg.webp` + `[page]-bg.png` (origen)
- Icons: `icon-192.png`, `icon-512.png`, `icon.svg`, `favicon.ico`, `favicon.png`, `apple-touch-icon.png`

## 13. Precauciones al editar

1. **NUNCA** escribir archivos con PowerShell `Set-Content` sin especificar `-Encoding UTF8`
2. **NUNCA** usar single-quoted strings multilínea en JS (usar backticks)
3. **SIEMPRE** verificar que `calculateShields` en `streak.js` (0/1/2/3) y `streak-page.js` (espera 0/1/5/10) estén alineados si tocas streak
4. **SIEMPRE** incrementar cache buster (`?v=N`) en HTML al cambiar JS/CSS
5. **SIEMPRE** probar PWA cold start (cerrar navegador, abrir app, verificar sesión persiste)
6. La tabla `goals` NO tiene columna `user_id`
7. La tabla `prayer_marks` NO tiene columna `space_id`
8. El número de WhatsApp va partido en `waCode` + `waNum` para no aparecer como texto en HTML
