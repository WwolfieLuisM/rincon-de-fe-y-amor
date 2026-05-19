# MASTER.md — Referencia Total del Proyecto

> Consolidación de toda la documentación: FE-REFERENCE, SUPABASE-REFERENCE, DESIGN-REFERENCE, PROMPT-MASTER-REFERENCE, AGENTS + investigación de seguridad, Firebase, y best practices.

---

## ⚠️ REGLAS ESTRICTAS PARA IA

- LEE este archivo COMPLETO antes de hacer cualquier cambio
- CONSULTA secciones relevantes según el dominio (frontend → §2, backend → §3-4, diseño → §6, etc.)
- NO asumas NADA — si no está documentado aquí, PREGUNTA
- NO uses librerías sin verificar que ya están en el proyecto
- NO generes URLs o rutas que no puedas verificar
- Si no estás 100% seguro de algo, PREGUNTA primero
- Al terminar cambios, verifica que no hayas roto nada

---

## Índice

1. [Arquitectura del Proyecto](#1-arquitectura-del-proyecto)
2. [Frontend Reference — Anime.js v4, JS ES2024-2026, HTML, CSS](#2-frontend-reference)
3. [Supabase Reference — RLS, Edge Functions, pg_net, Cliente](#3-supabase-reference)
4. [Supabase Security — RLS avanzado, CSP, SRI, Auth Hardening](#4-supabase-security)
5. [Firebase Reference — Auth, Firestore, FCM, Hosting, Functions](#5-firebase-reference)
6. [Design System — DESIGN.md (Google Labs)](#6-design-system)
7. [Prompt Engineering — Prompt Master (nidhinjs)](#7-prompt-engineering)
8. [Programming Best Practices — Clean Code, SOLID, Async, Testing](#8-programming-best-practices)
9. [Real-World Lessons — Traps y lecciones del proyecto](#9-real-world-lessons)
10. [Memory Block — Historial de sesiones](#10-memory-block)

---

## 1. Arquitectura del Proyecto

### Stack
- **PWA estática** — Sin framework. Vanilla JS + CSS. Sin bundler.
- **Host:** GitHub Pages `https://wwolfieluism.github.io/rincon-de-fe-y-amor/`
- **Service Worker** scope: `/rincon-de-fe-y-amor/`. Nombre: `rincon-fe-v8`
- **Auth/Supabase:** Supabase (email+password, magic link)
- **Push:** Firebase Cloud Messaging (FCM)
- **CDNs:** Supabase `@2.49.0/umd/supabase.min.js`, Tabler Icons `@latest`, Google Fonts Inter
- **Package:** `package.json` vacío (sin scripts útiles)

### Páginas (16 HTML)
| Archivo | Ruta | Propósito |
|---|---|---|
| `index.html` | `/rincon-de-fe-y-amor/` | Login + registro |
| `register.html` | `/rincon-de-fe-y-amor/register.html` | Registro |
| `recover.html` | `/rincon-de-fe-y-amor/recover.html` | Recuperar contraseña |
| `dashboard.html` | `/rincon-de-fe-y-amor/dashboard.html` | Principal |
| `prayers.html` | `/rincon-de-fe-y-amor/prayers.html` | Oraciones |
| `gratitude.html` | `/rincon-de-fe-y-amor/gratitude.html` | Testimonios |
| `palabra.html` | `/rincon-de-fe-y-amor/palabra.html` | Biblia |
| `devocional.html` | `/rincon-de-fe-y-amor/devocional.html` | Devocional |
| `encouragement.html` | `/rincon-de-fe-y-amor/encouragement.html` | Chat/ánimo |
| `goals.html` | `/rincon-de-fe-y-amor/goals.html` | Metas |
| `dates.html` | `/rincon-de-fe-y-amor/dates.html` | Fechas |
| `streak.html` | `/rincon-de-fe-y-amor/streak.html` | Racha de oración |
| `notifications.html` | `/rincon-de-fe-y-amor/notifications.html` | Actividad |
| `profile.html` | `/rincon-de-fe-y-amor/profile.html` | Perfil |
| `more.html` | `/rincon-de-fe-y-amor/more.html` | Ajustes |
| `link.html` | `/rincon-de-fe-y-amor/link.html` | Vincular pareja |

### JS Global
| Archivo | Rol |
|---|---|
| `js/supabase.js` | `window.supabase` con `createClient()` |
| `js/auth.js` | `window.auth` — `ensureSession()`, `translateError()`, `logActivity()` |
| `js/devotional.js` | `window.Devotional` — devocional diario |
| `js/streak.js` | `window.streakService` — racha de oración, `calculateShields()` |
| `js/notifications.js` | `window.Notifications` — FCM push |
| `components/layout.js` | `window.initLayout()` — sidebar, header, menú, logout |

### Patrón común en todas las páginas
```js
window.addEventListener('DOMContentLoaded', async () => {
  const session = await window.auth.ensureSession();
  if (!session) { window.location.href = 'index.html'; return; }
  const { data: space } = await window.supabase
    .from('spaces').select('*')
    .or(`created_by.eq.${session.user.id},partner_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!space) { window.location.href = 'link.html'; return; }
  await initLayout();
  await loadPage(session.user.id, space);
});
```

### Lógica de negocio clave

**Streak (racha):** `checkAndUpdate()` — ambos deben marcar hoy. `last_marked === ayer` → count+1. Fallo con shield → shield-1. Fallo sin shield → reset (count=1). `calculateShields(count)`: ≥1000→3, ≥100→2, ≥10→1, <10→0.

**Oraciones:** 3 tabs (Activas, Respondidas, Mis oraciones). Progreso cuenta SOLO días mutuos. Realtime: 2 canales. `prayer_marks` NO tiene `space_id`.

**Metas:** Tabla `goals` NO tiene `user_id` — solo `space_id`.

**Palabra (Biblia):** DOM con `DocumentFragment` + `createElement` (NO `innerHTML`) para evitar crash en selección de texto móvil.

**WhatsApp:** `waCode='53'` + `waNum='63624567'` — NUNCA como texto visible en HTML.

### Diseño CSS
```css
--bg: #0a0a0a; --surface: #111; --surface-2: #1a1a1a;
--border: #1e1e1e; --border-2: #2a2a2a;
--accent: #e8547a; --accent-rgb: 232,84,122; --accent-dark: #c73f63;
--text-1: #f0f0f0; --text-2: #888; --text-3: #444;
--success: #4ade80; --warning: #fbbf24;
--radius: 14px; --radius-sm: 10px; --radius-full: 100px;
--glass-bg: rgba(10,10,10,0.55); --glass-blur: 12px; --glass-border: rgba(255,255,255,0.06);
```
Max width: 390px centrado. Glassmorphism. Tabler Icons. Cache busters `?v=N` en todos los JS/CSS.

---

## 2. Frontend Reference

### Anime.js v4 (v4.4.1)

**Web:** https://animejs.com | **CDN:** `https://esm.sh/animejs`

```js
import { animate, stagger, createTimeline, utils } from 'animejs';
```

**Básico:** `animate('.box', { x: 300, rotate: 180, scale: 1.5, duration: 1000, ease: 'outQuad' })`

**Keyframes:** `x: [{ to: 100, duration: 500 }, { to: 200, duration: 500 }]` o `rotate: { 0: 0, 50: 180, 100: 360 }`

**Stagger:** `delay: stagger(50)`. Grid: `stagger([1.1, 0.75], { grid: [13,13], from: 'center' })`

**Timeline:** `createTimeline({ defaults: { duration: 500 } }).add('.a', { x: 200 }).add('.b', { x: 200 }, '-=250')`. Posiciones: `0` (mismo inicio), `'<'` (mismo que previo), `'+=500'` (500ms después), `.label('mid')` + `'mid'`.

**SVG:**
- Motion path: `animate('.car', { ...createMotionPath('.circuit') })`
- Line drawing: `animate(createDrawable('.circuit'), { draw: '0 1' })`
- Morph: `animate('.shape-a', { d: morphTo('.shape-b') })`

**Scroll:** `animate('.reveal', { opacity: [0,1], autoplay: onScroll({ sync: true }) })`

**Text:** `splitText('h1', { chars: true })` → `animate(split.chars, { opacity: [0,1], delay: stagger(30) })`. Scramble: `scrambleText('.heading', { text: 'New text!', duration: 2000 })`

**Draggable:** `createDraggable('.circle', { container: '.container', releaseEase: createSpring({ stiffness: 120, damping: 6 }) })`

**Scope (responsive):** `createScope({ mediaQueries: { portrait: '(orientation: portrait)' } }).add(({ matches }) => { ... })`

**Engine:** `engine.speed = 2`, `engine.fps = 60`, `engine.pauseOnDocumentHidden = true`

**Spring easings:** `createSpring({ stiffness: 120, damping: 6, mass: 1, velocity: 0 })`

**Chaining utils:** `utils.random(1, 100).round().clamp(10, 50)`

**Alternativa a createDrawable (más confiable):**
```js
const path = document.getElementById('myPath');
const len = path.getTotalLength();
path.style.strokeDasharray = len;
path.style.strokeDashoffset = len;
await animate(path, { strokeDashoffset: [len, 0], duration: 1600, ease: 'outQuad' }).then();
```

**Breaking changes v3 → v4:**
| v3 | v4 |
|---|---|
| `import anime from 'animejs'` | `import { animate } from 'animejs'` |
| `anime({ targets: ... })` | `animate(targets, { ... })` |
| `easing: 'easeOutQuad'` | `ease: 'outQuad'` |
| `direction: 'reverse'` | `reversed: true` |
| `endDelay` | `loopDelay` |
| `round: 100` | `modifier: utils.round(2)` |
| `loop: 1` = 1 iteration | `loop: 1` = 1 repeat (2 iterations) |
| `begin/complete` | `onBegin/onComplete` |
| `animation.finished.then()` | `animation.then()` |
| `anime.timeline()` | `createTimeline()` |

### JavaScript ES2024–ES2026

**Promise.withResolvers() — ES2024:**
```js
const { promise, resolve, reject } = Promise.withResolvers();
```
Ideal para event-to-promise bridges, AbortSignal patterns.

**Array.fromAsync() — ES2024:**
```js
const arr = await Array.fromAsync(asyncGenerator);
```

**Set Methods — ES2025:**
```js
a.union(b), a.intersection(b), a.difference(b), a.symmetricDifference(b)
a.isSubsetOf(b), a.isSupersetOf(b), a.isDisjointFrom(b)
```
Todos retornan nuevos Sets (inmutables).

**Object.groupBy / Map.groupBy — ES2024:**
```js
const byType = Object.groupBy(inventory, item => item.type);
```

**Iterator Helpers — ES2025:**
```js
function* nums() { let i = 0; while(true) yield i++; }
nums().filter(n => n%2===0).take(5).map(n => n*10).toArray()
Iterator.from(iterable)
```

**Import Attributes — ES2025:**
```js
import data from './config.json' with { type: 'json' };
```

**RegExp v flag (Unicode Sets) — ES2024:**
```js
/[\p{Script_Extensions=Greek}&&\p{Lowercase}]/v  // intersección
/[\p{Punctuation}--\p{ASCII}]/v                    // substracción
```

**JSON.parse Source — ES2025:** `JSON.parse(str, (key, val, { source }) => ...)`. `JSON.rawJSON()` para BigInt lossless.

**Temporal API — ES2026 (Chrome 144+, Firefox 139+; Safari missing):**
```js
Temporal.Now.plainDateISO()
Temporal.PlainDate.from('2026-01-01').add({ months: 5 })
Temporal.Duration.from({ hours: 48 }).round({ smallestUnit: 'hours' })
```

**Error.cause — ES2022:**
```js
throw new Error('Failed', { cause: originalError });
```

### HTML

**Popover API:** `popovertarget` attribute. `popover.showPopover()`, `.hidePopover()`, `.togglePopover()`. Events: `beforetoggle`, `toggle`.

**Dialog:** `<dialog>`, `showModal()`, `close()`. CSS: `dialog::backdrop`, `@starting-style` para animaciones.

**Invoker Commands:** `commandfor` + `command` attributes. Standard commands: `toggle-popover`, `show-popover`, `hide-popover`, `show-modal`, `close`, `request-close`.

**Declarative Shadow DOM:** `<template shadowrootmode="open">`.

**Lazy loading iframes:** `<iframe loading="lazy">`.

### CSS

**Container Queries:** `container-type: inline-size; container-name: card`. `@container card (width > 700px) {...}`. Units: `cqw, cqh, cqi, cqb, cqmin, cqmax`.

**Cascade Layers:** `@layer reset, base, components, utilities;` `@import url('x.css') layer(framework);`

**CSS Nesting:** `&:hover`, `@media (width <= 600px)`, bare selectors (`h2 { }`), `&::before`, `&.primary`.

**Scroll-Driven Animations:** `animation-timeline: scroll()` or `view()`. `animation-range`. `scroll-timeline: --my-scroll`.

**:has():** `.card:has(img) {}`, `.form-group:has(input:focus) label {}`, `html:has(#dark-toggle:checked) {}`.

**color-mix():** `color-mix(in oklch, var(--brand) 80%, white)`.

**contrast-color() (2026):** `color: contrast-color(var(--btn-color))`.

**Anchor Positioning:** `position-anchor: --tooltip`, `position-area`, `bottom: anchor(top)`. `position-try-fallbacks: flip-block`.

**View Transitions:** `@view-transition { navigation: auto }`. SPA: `document.startViewTransition(() => domUpdate)`.

**Dialog/Popover animations:** `transition: overlay 0.2s allow-discrete, display 0.2s allow-discrete`. `@starting-style`.

**Progressive Enhancement:**
```css
@supports (animation-timeline: view()) { }
@supports selector(:has(a)) { }
```
```js
if (HTMLElement.prototype.hasOwnProperty('popover')) { }
if ('showModal' in HTMLDialogElement.prototype) { }
```

### Browser Support Scorecard (2025–2026)

| Feature | Status | Chrome | Firefox | Safari |
|---|---|---|---|---|
| Container Queries | Widely Available | 105+ | 110+ | 16+ |
| CSS Nesting | Newly Available | 120+ | 117+ | 17.2+ |
| `:has()` | Widely Available | 105+ | 121+ | 15.4+ |
| color-mix() | Widely Available | 111+ | 113+ | 16.2+ |
| contrast-color() | Newly Available | 147+ | 146+ | 26+ |
| Scroll-Driven Animations | Limited | 115+ | Flagged | 18+ |
| Anchor Positioning | Limited | 125+ | 147+ | 26+ |
| View Transitions | Newly Available | 111+ | 133+ | 18+ |
| Popover API | Newly Available | 114+ | 125+ | 17+ |
| Invoker Commands | Newly Available | 135+ | 144+ | 26.2+ |
| Temporal API | Not Baseline | 144+ | 139+ | No |

---

## 3. Supabase Reference

### Row Level Security (RLS)

**Cómo funciona:** RLS añade un WHERE implícito a cada query según la policy.

| Operación | Cláusula | Qué evalúa |
|---|---|---|
| SELECT | `USING (expr)` | Filas que el usuario puede ver |
| INSERT | `WITH CHECK (expr)` | Nuevas filas que puede crear |
| UPDATE | `USING (expr) WITH CHECK (expr)` | USING: filas modificables. WITH CHECK: resultado |
| DELETE | `USING (expr)` | Filas que puede borrar |

**Reglas críticas:**
1. UPDATE necesita SELECT policy — Postgres necesita ver la fila antes de modificarla
2. UPSERT (INSERT ON CONFLICT DO UPDATE) necesita INSERT + UPDATE + SELECT policies
3. `auth.uid()` puede ser NULL si no hay sesión — siempre especificar `TO authenticated`
4. Rol `anon` vs `authenticated` — datos privados siempre `TO authenticated`
5. **Service Role Key bypasea RLS** — usada en Edge Functions, SECURITY DEFINER triggers

**Performance:** Indexar columna de policy. Usar `(SELECT auth.uid())` (cacheado). Filtros explícitos en cliente.

### Supabase Client JS

**Configuración PWA:**
```js
window.supabase = supabase.createClient(URL, ANON_KEY, {
  auth: {
    persistSession: true, autoRefreshToken: true,
    detectSessionInUrl: false, storage: window.localStorage
  }
});
```

**ensureSession() para cold start:**
```js
ensureSession: async function() {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (session?.user) return session;
  // Fallback: leer clave nativa de localStorage
  const key = `sb-${PROJECT_REF}-auth-token`;
  const raw = localStorage.getItem(key);
  if (raw) {
    const stored = JSON.parse(raw);
    const token = stored?.access_token || stored?.body?.access_token;
    const refresh = stored?.refresh_token || stored?.body?.refresh_token;
    if (token && refresh) {
      const { data } = await window.supabase.auth.setSession({ access_token: token, refresh_token: refresh });
      if (data?.session) return data.session;
    }
  }
  return null;
}
```

### Edge Functions

**Secrets por defecto:** `SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_JWKS`.

**Invocación:** `POST https://PROJECT_REF.supabase.co/functions/v1/function-name`. Desde cliente: `supabase.functions.invoke('name', { body: {...} })`.

**verify_jwt:** Si es `true`, rechaza requests sin JWT. Para webhooks/triggers debe ser `false`.

**Patrón Edge Function:**
```ts
serve(async (req) => {
  try {
    const body = await req.json();
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Consulta directa con service_role (bypasea RLS)
    const res = await fetch(`${url}/rest/v1/push_subscriptions?user_id=eq.${id}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });
    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error('Error:', e);  // SIEMPRE loguear
    return new Response('ok', { status: 200 });
  }
});
```

### pg_net — Async HTTP desde PostgreSQL

Extensión para HTTP requests asíncronos desde triggers.

```sql
SELECT net.http_post(
  url := 'https://...',
  body := jsonb_build_object('key', 'value'),
  headers := '{"Content-Type": "application/json"}'::jsonb,
  timeout_milliseconds := 5000
);
```

**Trigger con pg_net:**
```sql
CREATE OR REPLACE FUNCTION handle_notify() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM net.http_post('https://...', jsonb_build_object('record', row_to_json(NEW)), '{}'::jsonb, '{"Content-Type": "application/json"}'::jsonb, 5000);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN NULL;
END; $$;
```

**Debugging:** `SELECT * FROM net._http_response WHERE status_code >= 400`. Ver `net.http_request_queue`.

**Limitaciones:** Respuestas guardadas solo 6h. ~200 req/s. Solo POST. Tablas UNLOGGED. No PATCH/PUT.

### Flujo de notificaciones del proyecto
```
INSERT en activity → trigger on_activity_insert → handle_activity_notify()
→ net.http_post() → HTTP POST a Edge Function send-push-notification
→ Edge Function lee SUPABASE_SERVICE_ROLE_KEY
→ Consulta spaces + push_subscriptions (bypasea RLS)
→ Crea JWT con FIREBASE_SERVICE_ACCOUNT → envía FCM
```

### Comandos de diagnóstico SQL
```sql
-- Ver triggers
SELECT * FROM information_schema.triggers WHERE event_object_table = 'activity';
-- Ver funciones
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_activity_notify';
-- Ver extensiones
SELECT extname, extnamespace::regnamespace FROM pg_extension;
-- Ver respuestas pg_net erróneas
SELECT * FROM net._http_response WHERE status_code >= 400 ORDER BY created DESC;
-- Ver policies
SELECT * FROM pg_policies ORDER BY tablename;
-- Ver grants
SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'push_subscriptions';
```

---

## 4. Supabase Security

### RLS Avanzado

**Auto-enable RLS via event trigger (recomendado para proyectos nuevos):**
```sql
CREATE OR REPLACE FUNCTION auto_enable_rls()
RETURNS event_trigger AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
  WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS')
  AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = obj.schema AND tablename = obj.objid::regclass::text)
  LOOP
    EXECUTE format('ALTER TABLE %s.%s ENABLE ROW LEVEL SECURITY', obj.schema, obj.objid::regclass);
  END LOOP;
END; $$ LANGUAGE plpgsql;

CREATE EVENT TRIGGER enable_rls_on_create ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS')
EXECUTE FUNCTION auto_enable_rls();
```

**Patrones de policy por operación:**

SELECT:
```sql
CREATE POLICY "users_read_own" ON tabla FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

INSERT:
```sql
CREATE POLICY "users_insert_own" ON tabla FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
```

UPDATE:
```sql
CREATE POLICY "users_update_own" ON tabla FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

DELETE:
```sql
CREATE POLICY "users_delete_own" ON tabla FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

**UPSERT necesita las 3:** INSERT + UPDATE + SELECT + `GRANT SELECT, INSERT, UPDATE ON tabla TO authenticated;`

**Regla de oro:**
> Si una tabla SOLO la escribe/lee la Edge Function (con service_role_key), no necesita RLS.
> Si una tabla la escribe/lee el cliente (con anon key), necesita RLS + policies + grants.
> Si una tabla la escriben AMBOS, la Edge Function bypasea RLS con service_role_key, pero el cliente necesita policies.

### Checklist antes de activar RLS
- [ ] Listar TODAS las queries del cliente hacia esa tabla
- [ ] Crear policy por cada operación (SELECT/INSERT/UPDATE/DELETE/UPSERT)
- [ ] Para UPSERT: INSERT + UPDATE + SELECT policies
- [ ] Especificar `TO authenticated`
- [ ] Hacer `GRANT SELECT, INSERT, UPDATE, DELETE ON tabla TO authenticated;`
- [ ] Probar con usuario real (consola del navegador)
- [ ] Si la Edge Function necesita acceso, verificar que usa `SUPABASE_SERVICE_ROLE_KEY`

### Content Security Policy (CSP) para PWA

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self' https://qktdrlhdzfefjwhxqjws.supabase.co https://*.googleapis.com https://fcmregistrations.googleapis.com https://fcm.googleapis.com;
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://esm.sh https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
  font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com;
  img-src 'self' data: blob:;
  manifest-src 'self';
  worker-src 'self';
">
```

**Nota:** `'unsafe-inline'` es necesario para estilos dinámicos. Para máxima seguridad, migrar a nonce o hash + eliminar inline styles.

### Subresource Integrity (SRI)

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.0/dist/umd/supabase.min.js"
        integrity="sha384-..."
        crossorigin="anonymous"></script>
```

**Para generar hashes SRI:** `openssl dgst -sha384 -binary archivo | openssl base64 -A`

### Auth Hardening

- **MFA:** Habilitar en Supabase Dashboard > Authentication > Settings > Multi-factor Authentication
- **Rate limiting:** Supabase aplica rate limiting por defecto (50 requests/hour para signup desde misma IP)
- **Password policies:** Configurar en Auth > Settings — mínimo 8 caracteres, mayúscula, número
- **Session timeouts:** Configurar duración de sesión (ej. 7 días, 30 días)

### Client-Side Security

- **localStorage:** Los tokens JWT se almacenan en `localStorage` y son accesibles por XSS. Mitigación: CSP strict + DOMPurify
- **XSS Prevention:** Usar `textContent` en vez de `innerHTML`. Para HTML sanitizado: DOMPurify
- **Trusted Types (experimental):** `Content-Security-Policy: require-trusted-types-for 'script'`
- **DOMPurify:**
  ```js
  import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.2.4/dist/purify.es.min.js';
  element.innerHTML = DOMPurify.sanitize(userInput);
  ```

### Production Checklist
1. Habilitar MFA en Supabase
2. Configurar CSP con headers HTTPS (no solo meta tag)
3. SRI en todos los scripts CDN
4. Rate limiting de auth
5. Password policy robusta
6. DOMPurify en inputs de usuario
7. Verificar que todas las tablas con datos de usuario tengan RLS activo
8. Edge Functions con `verify_jwt: true` (excepto webhooks)
9. Secrets de Edge Function rotados periódicamente
10. Logs de Supabase monitoreados

---

## 5. Firebase Reference

### Firebase Auth

**Inicialización:**
```js
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

**Métodos:**
```js
createUserWithEmailAndPassword(auth, email, password);
signInWithEmailAndPassword(auth, email, password);
signOut(auth);
onAuthStateChanged(auth, user => { if (user) { ... } });

// OAuth providers
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
const provider = new GoogleAuthProvider();
signInWithPopup(auth, provider);
```

**Comparación con Supabase:**
| Firebase Auth | Supabase Auth |
|---|---|
| `onAuthStateChanged` | `onAuthStateChange` |
| JWT en `user.accessToken` | JWT en `session.access_token` |
| `signOut()` | `.auth.signOut()` |
| OAuth con providers separados | OAuth integrado en `signInWithOAuth()` |
| Sin RLS (usa Firestore rules en su lugar) | RLS a nivel PostgreSQL |

### Cloud Firestore

**Esquema:** Colecciones → Documentos → Subcolecciones. No tablas SQL.

```js
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
const db = getFirestore(app);
```

**Operaciones:**
```js
// READ
const snapshot = await getDocs(collection(db, 'prayers'));
snapshot.forEach(doc => console.log(doc.id, doc.data()));

// WRITE
const docRef = await addDoc(collection(db, 'prayers'), { title: 'Oración', user_id: uid });

// UPDATE
await updateDoc(doc(db, 'prayers', docId), { title: 'Nuevo título' });

// DELETE
await deleteDoc(doc(db, 'prayers', docId));

// LISTEN (realtime)
const q = query(collection(db, 'prayers'), where('space_id', '==', spaceId));
onSnapshot(q, snapshot => {
  snapshot.docChanges().forEach(change => { /* type: added/modified/removed */ });
});

// BATCH WRITE
import { writeBatch } from 'firebase/firestore';
const batch = writeBatch(db);
batch.set(docRef, data);
batch.update(docRef2, { field: 'value' });
batch.delete(docRef3);
await batch.commit();
```

**Firestore Security Rules (equivalente a RLS de Supabase):**
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /prayers/{prayerId} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid == request.resource.data.user_id;
      allow update: if request.auth.uid == resource.data.user_id;
      allow delete: if request.auth.uid == resource.data.user_id;
    }
  }
}
```

**Comparación con Supabase RLS:**
| Firestore Rules | Supabase RLS |
|---|---|
| Reglas en `firestore.rules` | Policies SQL en PostgreSQL |
| `request.auth.uid` | `auth.uid()` |
| `request.resource.data` (datos nuevos) | NEW (data nueva) |
| `resource.data` (datos existentes) | OLD (data existente) |
| Sin concepto de JOIN | SQL joins con policies |
| No necesita GRANT explícito | Necesita `GRANT ... TO authenticated` |

### Firebase Cloud Messaging (FCM) — Web Push

**setup (usado en este proyecto con compat):**
```js
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Obtener token
const token = await messaging.getToken({ vapidKey: 'VAPID_KEY' });

// Escuchar mensajes en foreground
messaging.onMessage(payload => {
  console.log('Message received', payload);
});

// Background (en Service Worker)
import { onBackgroundMessage } from 'firebase/messaging/sw';
onBackgroundMessage(messaging, payload => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body, icon: '/icon-192.png'
  });
});
```

**saveToken() en este proyecto:**
```js
const { error } = await window.supabase
  .from('push_subscriptions')
  .upsert({ user_id: userId, fcm_token: token }, { onConflict: 'user_id' });
```

**FCM payload structure:**
```json
{
  "notification": { "title": "Nueva oración", "body": "Texto" },
  "data": { "url": "/prayers.html", "type": "prayer" }
}
```

### Firebase Hosting (comparación con GitHub Pages)

| Firebase Hosting | GitHub Pages |
|---|---|
| Rewrites SPA: `firebase.json` `"rewrites": [{"source": "**", "destination": "/index.html"}]` | No soporta rewrites |
| CDN global con SSL | CDN global con SSL |
| CSP via `firebase.json` `"headers"` | CSP via meta tag o `_headers` file |
| CLI: `firebase deploy` | CLI: `git push` |
| Límite 10GB/mes gratis | Límite 1GB/mes gratis |

### Cloud Functions (Firebase)

```js
import functions from 'firebase-functions';

exports.sendNotification = functions.firestore
  .document('prayers/{prayerId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    // Enviar notificación
  });
```

**Cold starts:** Functions se "duermen" si no se usan. El primer request puede tardar 2-10s. Mitigación: mantener instancia con min instances.

**CORS en HTTP functions:**
```js
exports.api = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  // ...
});
```

### Cloud Storage (Firebase)

Rules equivalentes a RLS:
```
service firebase.storage {
  match /b/{bucket}/o {
    match /{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

### Firebase vs Supabase: Cuándo usar cada uno

| Necesidad | Firebase | Supabase |
|---|---|---|
| Base de datos SQL | ❌ | ✅ PostgreSQL |
| Realtime nativo | ✅ Firestore | ✅ Realtime + Broadcast |
| Push notifications | ✅ FCM (nativo) | ⚠️ Edge Function + FCM |
| Auth + OAuth | ✅ | ✅ |
| File storage | ✅ | ✅ |
| Edge Functions | ⚠️ Cloud Functions (Node) | ✅ Deno Deploy |
| RLS a nivel DB | ❌ (solo en app) | ✅ PostgreSQL nativo |
| Costo | Pay-per-use (caro escalando) | Plan free generoso |
| Lock-in | Alto | Medio (PostgreSQL portable) |

---

## 6. Design System

### DESIGN.md (Google Labs)

**Repo:** https://github.com/google-labs-code/design.md — 14.4k stars

**¿Qué es?** Un formato de especificación YAML + Markdown para describir sistemas de diseño a agentes de IA. Sin esto, los agentes inventan colores, tipografías y espaciados.

### Estructura del archivo
```yaml
---
name: Mi Diseño
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#B8422E"
  neutral: "#F7F5F2"
typography:
  h1: { fontFamily: Public Sans, fontSize: 3rem }
  body-md: { fontFamily: Public Sans, fontSize: 1rem }
rounded: { sm: 4px, md: 8px }
spacing: { sm: 8px, md: 16px }
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
    padding: 12px
---
```

### Secciones canónicas (en orden)
1. Overview (Brand & Style)
2. Colors
3. Typography
4. Layout (Layout & Spacing)
5. Elevation & Depth
6. Shapes
7. Components
8. Do's and Don'ts

### Tipos de token
| Type | Format | Ejemplo |
|---|---|---|
| Color | `#` + hex sRGB | `"#1A1C1E"` |
| Dimension | number + unit | `48px`, `-0.02em` |
| Token Ref | `{path.to.token}` | `{colors.primary}` |
| Typography | object | `fontFamily`, `fontSize` |

### CLI — `@google/design.md`
```bash
npx @google/design.md lint DESIGN.md
npx @google/design.md diff DESIGN.md DESIGN-v2.md
npx @google/design.md export --format json-tailwind DESIGN.md
npx @google/design.md export --format css-tailwind DESIGN.md
npx @google/design.md export --format dtcg DESIGN.md
npx @google/design.md spec --rules
```
En Windows usar `designmd` (no `design.md` que confunde al CLI).

### Linting Rules
`broken-ref` (error), `missing-primary` (warn), `contrast-ratio` (warn — WCAG AA), `orphaned-tokens` (warn), `missing-typography` (warn), `section-order` (warn).

### Programmatic API
```ts
import { lint } from '@google/design.md/linter';
const report = lint(markdownString);
console.log(report.findings, report.summary, report.designSystem);
```

### Lo que aprendí
1. Los agentes de IA NO adivinan diseño — necesitan valores exactos (hex, px, fontFamily)
2. DESIGN.md = YAML + Markdown — tokens para máquina, prosa para humano (y agente)
3. Token references `{colors.primary}` permiten relaciones entre tokens
4. Component variants = entradas separadas con nombre relacionado (`button-primary-hover`)
5. WCAG AA checking automático en el linter
6. Útil para proyectos con IA — Cursor, Claude Code, Copilot se alinean con un DESIGN.md

---

## 7. Prompt Engineering

### Prompt Master (nidhinjs)

**Repo:** https://github.com/nidhinjs/prompt-master — 7.9k stars, v1.6.0

**¿Qué es?** Un sistema estructurado para escribir prompts precisos que elimina créditos desperdiciados.

### Pipeline interno (7 pasos)
1. Detecta herramienta destino → rutea al enfoque correcto
2. Extrae 9 dimensiones de intento
3. Máximo 3 preguntas clarificadoras
4. Rutea al framework de prompt correcto
5. Aplica técnicas seguras (role assignment, few-shot, XML, grounding, memory block)
6. Token efficiency audit — elimina cada palabra que no cambia el output
7. Entrega prompt + nota estratégica de 1 línea

### 9 Dimensiones de Intento
Task, Target tool, Output format, Constraints, Input, Context, Audience, Success criteria, Examples.

### Tool Profiles

**Chat LLMs:**
| Tool | Estrategia |
|---|---|
| Claude 4.x/5.x | Contexto + razón. XML tags. NO "think step by step" (adaptive thinking) |
| ChatGPT / GPT-5.x | Compacto. Contrato de output explícito |
| **o3 / o4-mini** | **Short clean ONLY. NO CoT, NO "think step by step"** |
| Gemini 2.x/3 | Long-context. "Cite only sources you are certain of" |
| DeepSeek-R1 | Como o3 — CoT degrada output |
| Qwen3-thinking | Como o3. NO CoT |

**Coding Agents:**
| Tool | Estrategia |
|---|---|
| Claude Code | Starting state + target state + stop conditions (MANDATORY) + file scope. Front-load everything |
| Cursor / Windsurf | File path + function name + current behavior + desired change + do-not-touch |
| GitHub Copilot | Function signature + docstring exacta. Sin ambigüedad |

**Image AI:**
| Tool | Estrategia |
|---|---|
| Midjourney | Comma-separated. Subject → style → mood → lighting. `--ar 16:9 --v 6 --style raw` |
| DALL-E 3 | Prose description. Foreground/midground/background |
| Stable Diffusion | `(word:weight)`. CFG 7-12. Negative prompt MANDATORY |

### 12 Prompt Templates
RTF, CO-STAR, RISEN, CRISPE, Chain of Thought, Few-Shot, File-Scope, ReAct + Stop Conditions, Visual Descriptor, Reference Image Editing, ComfyUI, Prompt Decompiler.

### 35 Credit-Killing Patterns (resumen)

**Task (7):** Vague verb, two tasks in one, no success criteria, over-permissive agent, emotional description, build the whole thing, implicit reference.

**Context (6):** Assumed prior knowledge, no project context, forgotten stack, hallucination invite, undefined audience, no mention of prior failures.

**Format (6):** Missing output format, implicit length, no role assignment, vague aesthetic, no negative prompts (image AI), prose prompt for Midjourney.

**Scope (6):** No scope boundary, no stack constraints, no stop condition, no file path for IDE AI, wrong template for tool, pasting entire codebase.

### Memory Block System

Cuando hay historial, anteponer un Memory Block en el primer 30% del prompt:
```
## Context (carry forward)
- Stack: ...
- Decisiones previas: ...
- Arquitectura: ...
```

**Colocar en el primer 30%** para que sobreviva al attention decay.

### Técnicas Seguras (solo 5)
1. **Role Assignment** — Tareas complejas
2. **Few-Shot Examples** — Cuando mostrar > describir (2-5 ejemplos)
3. **XML Structural Tags** — Claude: `<context>`, `<task>`, `<constraints>`
4. **Grounding Anchors** — "Use only information you are highly confident is accurate"
5. **Chain of Thought** — Solo en LLMs estándar. **NUNCA en o3/R1/Qwen3-thinking**

**Técnicas EXCLUIDAS:** Tree of Thought, Graph of Thought, Universal Self-Consistency, prompt chaining (alto riesgo de fabricación).

### Lo que aprendí
1. El mejor prompt no es el más largo — es donde cada palabra es estructural
2. 35 patrones que matan créditos = errores de scope, contexto o formato
3. Cada herramienta IA tiene su propia sintaxis (Midjourney ≠ o3 ≠ Claude Code)
4. Memory Block es el fix más importante para sesiones largas
5. Para agentes (Cursor, Claude Code, Devin), las stop conditions son MANDATORIAS
6. o3/R1/Qwen3-thinking + CoT activamente DEGRADA su output

---

## 8. Programming Best Practices

### Clean Code en JS/TS
- Nombres significativos: `getUserById()` no `getData()`
- Una función = una responsabilidad
- Evitar efectos secundarios (side effects) en funciones
- Variables/constantes con nombres descriptivos: `const MAX_RETRIES = 3`
- Comentarios: explicar el "por qué", no el "qué"
- Early returns en vez de anidación profunda
- Template literals sobre concatenación

### SOLID aplicado a JS/TS
| Principio | Aplicación |
|---|---|
| **S**ingle Responsibility | Un módulo/ función hace una cosa |
| **O**pen/Closed | Abierto a extensión, cerrado a modificación |
| **L**iskov | Subtipos deben ser sustituibles por su base |
| **I**nterface Segregation | Interfaces pequeñas y específicas |
| **D**ependency Inversion | Depender de abstracciones, no implementaciones |

### Error Handling
```js
// try/catch con Error.cause
try {
  await riskyOperation();
} catch (err) {
  throw new Error('Operation failed', { cause: err });
}

// Custom error classes
class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
```

### Async Patterns

**AbortController (cancelación de promesas):**
```js
const controller = new AbortController();
fetch(url, { signal: controller.signal });
setTimeout(() => controller.abort(), 5000);
```

**Promise.allSettled (no falla rápido):**
```js
const results = await Promise.allSettled([fetchA(), fetchB()]);
results.filter(r => r.status === 'fulfilled').map(r => r.value);
results.filter(r => r.status === 'rejected').map(r => r.reason);
```

**Promise con timeout:**
```js
function withTimeout(promise, ms) {
  const { promise: timeoutPromise, reject } = Promise.withResolvers();
  const timer = setTimeout(() => reject(new Error('Timeout')), ms);
  return promise.finally(() => clearTimeout(timer));
}
```

### Security
- Input validation: sanitizar y validar en servidor y cliente
- CSP: mitigar XSS
- DOMPurify para HTML generado por usuario
- Nunca exponer API keys secretas (solo anon/public keys en cliente)
- Usar `textContent` en vez de `innerHTML` para datos de usuario
- Validar URLs y `onclick` generados

### Performance

**Debounce:**
```js
function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
```

**Throttle:**
```js
function throttle(fn, ms) {
  let locked = false;
  return (...args) => { if (!locked) { locked = true; fn(...args); setTimeout(() => locked = false, ms); } };
}
```

**requestAnimationFrame debounce:**
```js
let rafId = null;
function batchUpdate(fn) {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => { fn(); rafId = null; });
}
```

**Lazy load:** IntersectionObserver para cargar contenido bajo el fold.

### Accessibility
- Roles ARIA: `role="button"`, `role="dialog"`, `role="alert"`
- Atributos: `aria-label`, `aria-describedby`, `aria-expanded`, `aria-controls`
- Focus management: `tabindex`, `autofocus`, `element.focus()`
- Color contrast mínimo 4.5:1 (WCAG AA)
- `prefers-reduced-motion` para animaciones
- Formularios: `<label>` asociado, `aria-invalid` en errores
- Skip to content link

### State Management
- Global state via window object o módulo singleton
- Patrón: `window.state = { user: null, space: null, partner: null }`
- Event-based: dispatch custom events para cambios de estado
- No usar Redux/Zustand para PWA vanilla

### Testing Pyramid
1. Unit tests (Jest, Vitest) — lógica individual
2. Integration tests — API calls, DB access
3. E2E tests (Playwright, Cypress) — flujos completos
4. Manual testing — PWA cold start, push notifications, mobile

### Git Workflow
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`
- Commits pequeños y enfocados
- Mensajes en imperativo: "Add login validation" no "Added login validation"
- No commitear secrets, node_modules, archivos build
- Branch naming: `feat/login`, `fix/auth`, `docs/readme`

### Project Structure
```
project/
├── index.html           # Entry point
├── js/
│   ├── supabase.js      # Cliente Supabase
│   ├── auth.js          # Autenticación
│   ├── pages/           # Páginas individuales
│   └── components/      # Componentes compartidos
├── css/                 # Estilos
├── img/                 # Imágenes
├── data/                # JSON/data
├── supabase/
│   └── functions/       # Edge Functions
├── sw.js                # Service Worker
└── manifest.json        # PWA manifest
```

### Seguridad web general
- HTTPS obligatorio
- CSP headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: no-referrer
- No eval() en producción
- Sanitizar cualquier entrada del usuario antes de renderizar

---

## 9. Real-World Lessons

### Traps documentados durante el proyecto

**1. RLS + Upsert trap**
- Crear INSERT + UPDATE + SELECT policies NO garantiza que upsert funcione
- El userId del payload DEBE coincidir con `auth.uid()`
- Necesita `GRANT INSERT, UPDATE, SELECT ON tabla TO authenticated;`
- **Solución:** Probar con usuario real antes de desplegar. O no activar RLS en tablas que solo la Edge Function toca.

**2. Edge Functions bypass RLS via service_role**
- `SUPABASE_SERVICE_ROLE_KEY` ignora RLS completamente
- Usar para consultas internas: `fetch(url, { headers: { apikey: serviceKey, Authorization: Bearer ${serviceKey}} })`
- No usar RLS en tablas que SOLO la Edge Function escribe/lee

**3. PowerShell encoding trap**
- `Set-Content` por defecto usa ANSI (Windows-1252) → corrompe UTF-8
- **Solución:** Siempre usar `git checkout <commit> -- <file>` para restaurar archivos. O `[System.IO.File]::WriteAllText($path, $content, [Text.Encoding]::UTF8)`

**4. PWA cold start session persistence**
- Supabase `getSession()` retorna null en PWA cold start porque la sesión necesita ser hidratada de localStorage
- **Solución:** CDN pinned `@2.49.0/dist/umd/supabase.min.js`, `storage: window.localStorage`, `detectSessionInUrl: false`, función `ensureSession()` que lee la clave nativa `sb-{projectRef}-auth-token` como fallback

**5. Realtime channel architecture**
- `prayer_marks` no tiene `space_id` → el canal Realtime se suscribe sin filtro
- `goals` no tiene `user_id` → solo `space_id`, `title`, `target_date`, `progress`, `completed`, `created_at`
- Realtime para fechas usa recarga completa (pocos items, recalcula `daysUntilNext()`)

**6. Mobile selection crash**
- `innerHTML` en móvil causa crash al seleccionar texto
- **Solución:** `DocumentFragment` + `createElement`, `touch-action: manipulation`, `_isRendering` flag, `requestAnimationFrame` debounce

**7. Cache busters**
- Cada cambio en JS/CSS requiere incrementar `?v=N` en TODOS los HTML que lo referencien
- Si no se incrementa, el Service Worker sirve versión cachead

**8. Service Worker scope**
- El SW debe tener scope `/rincon-de-fe-y-amor/` para no interceptar requests fuera del subdirectorio
- `start_url` del manifest debe ser `/rincon-de-fe-y-amor/dashboard.html`

**9. GitHub DNS failures**
- GitHub intermittente falla con resolución DNS
- **Solución:** Esperar y reintentar

**10. 16 HTML pages con patrón repetitivo**
- Cada página sigue exactamente el mismo patrón: `DOMContentLoaded` → `ensureSession()` → `loadPage(userId, space)`
- Variables globales: `window.currentUser`, `window.currentPartner`, `window.currentSpace`

---

## 10. Memory Block (Historial de proyectos y decisiones)

### Proyecto: Rincón de Fe y Amor
- **URL:** `https://wwolfieluism.github.io/rincon-de-fe-y-amor/`
- **Supabase project:** `qktdrlhdzfefjwhxqjws`
- **Stack:** PWA estática, Vanilla JS, Supabase, FCM, GitHub Pages
- **User:** rosal (Windows), WwolfieLuisM (GitHub/Supabase)
- **WhatsApp:** `waCode='53'`, `waNum='63624567'` → `5363624567`

### Decisiones de arquitectura
- localStorage (no sessionStorage) para persistencia PWA
- `storage: window.localStorage` + `detectSessionInUrl: false` en cliente Supabase
- CDN Supabase pinned a `@2.49.0/dist/umd/supabase.min.js` (no `@latest`)
- 2 canales Realtime para oraciones (prayers + prayer_marks)
- Progress de oraciones cuenta SOLO días mutuos
- Edge Function `send-push-notification` v6 con `verify_jwt: false`
- NO RLS en `push_subscriptions` — Edge Function usa service_role_key
- Service Worker `rincon-fe-v8`
- Tabler Icons para iconos
- Cache busters `?v=N` en todos los JS/CSS

### Problemas conocidos sin resolver
- `streak-page.js` restaurado desde `f6af4c8` usa lógica VIEJA de shields (0/1/5/10) — no coincide con `streak.js` actual (0/1/2/3)
- Brave PC bloquea GCM (push service nunca conecta)
- PNGs antiguos (`img/*-bg.png`) no eliminados
- PWA cold start persistence necesita más testing en dispositivos reales
- Corazón de login.html (Desktop) tiene path SVG feo — pendiente de rediseño

### Herramientas y versiones
| Herramienta | Versión |
|---|---|
| Supabase JS | 2.49.0 (pinned) |
| Tabler Icons | latest |
| Firebase | 10.12.0 (compat) |
| anime.js | 4.4.1 |
| Node.js | N/A (sin bundler) |
| Windows PowerShel | 5.1 |
| Git | system |

### Archivos de referencia
- `AGENTS.md` — Contexto permanente para IA del proyecto
- `FE-REFERENCE.md` — Frontend (anime.js, JS, HTML, CSS)
- `SUPABASE-REFERENCE.md` — Supabase RLS, Edge Functions, pg_net
- `DESIGN-REFERENCE.md` — Design tokens (Google Labs DESIGN.md)
- `PROMPT-MASTER-REFERENCE.md` — Prompt engineering (nidhinjs)
- `MASTER.md` — Este archivo (consolidación total)
- `README.md` — Público
- `C:\Users\rosal\Desktop\login.html` — Test de login con anime.js
- `C:\Users\rosal\Desktop\DESIGN-REFERENCE.md` — Copia desktop
- `C:\Users\rosal\Desktop\PROMPT-MASTER-REFERENCE.md` — Copia desktop
