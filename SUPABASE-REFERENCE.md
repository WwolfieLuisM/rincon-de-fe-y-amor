# SUPABASE-REFERENCE.md — Documentación consultiva para IA

> **Léeme ANTES de tocar cualquier configuración de Supabase.**
> Basado en docs oficiales de supabase.com + lecciones aprendidas en este proyecto.

---

## 1. ROW LEVEL SECURITY (RLS) — Reglas de oro

### 1.1 Cómo funciona

RLS convierte cada consulta en: **la consulta original + un WHERE implícito de la policy**.

```sql
-- Policy: "auth.uid() = user_id"
-- Se traduce a:
SELECT * FROM tabla WHERE auth.uid() = tabla.user_id;
```

### 1.2 Tipos de policies

| Operación | Cláusula | Qué evalua |
|---|---|---|
| `SELECT` | `USING (expr)` | FILAS existentes que el usuario puede ver |
| `INSERT` | `WITH CHECK (expr)` | NUEVAS filas que el usuario puede crear |
| `UPDATE` | `USING (expr) WITH CHECK (expr)` | USING: filas existentes que puede modificar. WITH CHECK: cómo queda la fila después |
| `DELETE` | `USING (expr)` | FILAS existentes que puede borrar |

### 1.3 Regla CRÍTICA #1: UPDATE requiere SELECT policy

> Para hacer un `UPDATE`, la tabla necesita una `SELECT` policy.
> Sin `SELECT` policy, el UPDATE falla porque Postgres necesita ver la fila antes de modificarla.

Documentación oficial: *"To perform an UPDATE operation, a corresponding SELECT policy is required. Without a SELECT policy, the UPDATE operation will not work as expected."*

### 1.4 Regla CRÍTICA #2: UPSERT (INSERT ON CONFLICT DO UPDATE) necesita TANTO INSERT como UPDATE policies

El `upsert` de Supabase se traduce a `INSERT ... ON CONFLICT DO UPDATE`. Esto significa:
- Si es INSERT → necesita `INSERT` policy (`WITH CHECK`)
- Si hace UPDATE (por el conflicto) → necesita `UPDATE` policy (`USING + WITH CHECK`)

**Error cometido en este proyecto:** Se crearon INSERT + UPDATE + SELECT policies para `push_subscriptions` pero el `upsert()` falló igual. La causa exacta depende del caso:
  - Si el `userId` del payload NO coincide con `auth.uid()` (por ejemplo, por sesión expirada)
  - Si no hay `SELECT` policy para que el UPDATE pueda leer la fila existente
  - Si el rol `authenticated` no tiene `GRANT UPDATE` en la tabla

**Lección:** Siempre verificar con `GRANT` los permisos antes de activar RLS:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON tabla TO authenticated;
```

### 1.5 Regla CRÍTICA #3: auth.uid() puede ser NULL

Cuando el usuario NO está autenticado, `auth.uid()` devuelve `NULL`.
```sql
NULL = user_id → siempre falso
```
Siempre que la política requiera autenticación, especificar `TO authenticated`:
```sql
CREATE POLICY "solo autenticados" ON tabla
  FOR SELECT
  TO authenticated  -- ← ESTO es clave
  USING ((SELECT auth.uid()) = user_id);
```

### 1.6 Rol `anon` vs `authenticated`

| Rol | Cuándo se usa |
|---|---|
| `anon` | Usuario NO autenticado (sin JWT) |
| `authenticated` | Usuario autenticado con JWT válido |

Siempre usar `TO authenticated` para datos privados. Solo usar `TO anon` para datos públicos.

### 1.7 Service Role Key BYPASEA RLS

La `service_role_key` (secreta, nunca en el cliente) **ignora RLS por completo**. Se usa en:
- Edge Functions (entorno servidor)
- Triggers SECURITY DEFINER
- Admin tasks

```ts
// Edge Function: usa service_role_key → bypasea RLS
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const res = await fetch(`${url}/rest/v1/push_subscriptions?user_id=eq.${id}`, {
  headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
});
```

### 1.8 Performance

- Indexar la columna usada en la policy (`user_id`, `space_id`, etc.)
- Usar `(SELECT auth.uid())` en vez de `auth.uid()` directamente — Postgres cachea el resultado por statement
- Agregar filtros explícitos en las queries del cliente (`.eq('user_id', userId)`) aunque la policy ya lo haga
- Especificar `TO authenticated` para que la policy no se evalué para usuarios anónimos

---

## 2. SUPABASE CLIENT (JS)

### 2.1 Configuración correcta

```js
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,  // false para PWA
    storage: window.localStorage // explícito para PWA
  }
});
```

### 2.2 Upsert desde el cliente

```js
// req_userId DEBE ser el mismo que auth.uid()
await supabase
  .from('tabla')
  .upsert(
    { user_id: req_userId, ...otros_campos },
    { onConflict: 'user_id' }
  );
```

**⚠️ Con RLS activo, el upsert necesita:**
1. `GRANT INSERT, UPDATE, SELECT ON tabla TO authenticated;`
2. Una `INSERT` policy con `WITH CHECK (auth.uid() = user_id)`
3. Una `UPDATE` policy con `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
4. Una `SELECT` policy con `USING (auth.uid() = user_id)` (necesaria para el UPDATE)

### 2.3 ensureSession() para PWA cold start

```js
ensureSession: async function() {
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session?.user) return session;
  } catch(e) {}

  // Fallback: leer la clave nativa de localStorage
  try {
    const key = `sb-${PROJECT_REF}-auth-token`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const stored = JSON.parse(raw);
      const token = stored?.access_token || stored?.body?.access_token;
      const refresh = stored?.refresh_token || stored?.body?.refresh_token;
      if (token && refresh) {
        const { data, error } = await window.supabase.auth.setSession({
          access_token: token, refresh_token: refresh
        });
        if (!error && data?.session) return data.session;
      }
    }
  } catch(e) {}
  return null;
}
```

---

## 3. EDGE FUNCTIONS

### 3.1 Secrets por defecto (Disponibles sin configurar)

- `SUPABASE_URL` — URL del proyecto
- `SUPABASE_DB_URL` — URL de la base de datos
- `SUPABASE_ANON_KEY` — Anon key (respeta RLS)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (bypasea RLS)
- `SUPABASE_PUBLISHABLE_KEYS` — JSON dict con publishable keys
- `SUPABASE_SECRET_KEYS` — JSON dict con secret keys
- `SUPABASE_JWKS` — JWKS para verificar JWTs

### 3.2 Cómo se invocan

Una Edge Function se invoca mediante HTTP POST:
```
POST https://PROJECT_REF.supabase.co/functions/v1/function-name
```

Se puede invocar desde:
1. **Cliente JS:** `supabase.functions.invoke('function-name', { body: {...} })`
2. **Webhook DB:** Configurado en Dashboard → Database → Webhooks
3. **Trigger SQL:** Con `pg_net` (ver sección 4)
4. **curl:** `curl --request POST ...`

### 3.3 verify_jwt

Si `verify_jwt: true`, la función rechaza requests sin JWT válido.
**Para webhooks o triggers que no envían JWT, debe ser `false`.**

### 3.4 Buenas prácticas

```ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  try {
    const body = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // ... lógica
    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error('Error:', e); // ← SIEMPRE loguear errores
    return new Response('ok', { status: 200 });
  }
});
```

---

## 4. pg_net — Async HTTP desde PostgreSQL

### 4.1 Qué es

Extensión que permite a PostgreSQL hacer HTTP requests asíncronos. Ideal para triggers que necesitan llamar APIs sin bloquear.

### 4.2 net.http_post

```sql
SELECT net.http_post(
  url := 'https://project-ref.supabase.co/functions/v1/function-name',
  body := jsonb_build_object('key', 'value'),
  headers := '{"Content-Type": "application/json"}'::jsonb,
  timeout_milliseconds := 5000
);
```

### 4.3 Usar en un trigger

```sql
CREATE OR REPLACE FUNCTION handle_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM net.http_post(
    'https://project-ref.supabase.co/functions/v1/push-notification'::text,
    jsonb_build_object('type', 'INSERT', 'table', 'activity', 'record', row_to_json(NEW)),
    '{}'::jsonb,
    '{"Content-Type": "application/json"}'::jsonb,
    5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  NULL;  -- El trigger nunca debe fallar
END;
$$;

CREATE TRIGGER on_activity_insert
  AFTER INSERT ON activity
  FOR EACH ROW
  EXECUTE FUNCTION handle_notify();
```

### 4.4 Debugging

```sql
-- Ver respuestas pendientes/fallidas
SELECT * FROM net._http_response
WHERE status_code >= 400 OR error_msg IS NOT NULL
ORDER BY created DESC;

-- Ver cola de requests
SELECT * FROM net.http_request_queue;
```

### 4.5 Limitaciones

- Las respuestas se guardan solo 6 horas
- Máximo ~200 requests/segundo
- Solo POST con JSON body
- Las tablas son `UNLOGGED` (no sobreviven a crash)
- No soporta PATCH/PUT

---

## 5. ERRORES COMETIDOS EN ESTE PROYECTO (No repetir)

### ❌ Error 1: Activar RLS en `push_subscriptions` sin testear el upsert

**Qué pasó:** Activé RLS en `push_subscriptions` con INSERT + UPDATE + SELECT policies. El `upsert()` del cliente (usando anon key) falló porque la combinación de policies no permitía el ON CONFLICT DO UPDATE. Las notificaciones dejaron de funcionar porque el token FCM nunca se guardaba.

**Solución correcta:** NO activar RLS en tablas que el cliente necesita modificar y que la Edge Function ya protege con service_role_key. O, si se activa RLS, usar `GRANT` explícito + probar con datos reales antes.

**Lección aprendida:** Antes de activar RLS en una tabla:
1. Verificar TODAS las queries que el cliente hace (SELECT, INSERT, UPDATE, DELETE, UPSERT)
2. Crear policies para CADA operación necesaria
3. Hacer `GRANT` explícito de permisos
4. Probar con un usuario real antes de desplegar

### ❌ Error 2: No verificar el rol anon/authenticated

Al crear policies sin `TO authenticated`, las políticas también se evaluaban para usuarios anónimos. Siempre especificar `TO authenticated` en políticas que requieren login.

### ❌ Error 3: Asumir que `SUPABASE_SERVICE_ROLE_KEY` en Edge Function es automático

La Edge Function SÍ tiene acceso a `SUPABASE_SERVICE_ROLE_KEY` por defecto, pero:
- Si el trigger usa `net.http_post()` y el trigger es `SECURITY DEFINER` como el dueño de la tabla, la llamada a la Edge Function lleva el contexto del trigger, no el del usuario
- La Edge Function recibe el request y usa su propia clave para consultar datos

### ❌ Error 4: No revisar logs de `net._http_response` cuando las notificaciones fallan

Si el trigger `handle_activity_notify()` falla al llamar a `net.http_post()`, el error se traga con `EXCEPTION WHEN OTHERS THEN NULL`. Siempre revisar `net._http_response` para ver si hay errores HTTP.

---

## 6. FLUJO COMPLETO DE NOTIFICACIONES EN ESTE PROYECTO

```
Usuario hace algo (ora, crea meta, etc.)
  → INSERT en activity
    → Trigger on_activity_insert (AFTER INSERT)
      → handle_activity_notify() [SECURITY DEFINER]
        → net.http_post() [pg_net]
          → HTTP POST a Edge Function send-push-notification
            → Edge Function lee SUPABASE_SERVICE_ROLE_KEY
            → Consulta spaces (bypasea RLS)
            → Consulta push_subscriptions (bypasea RLS)
            → Crea JWT con FIREBASE_SERVICE_ACCOUNT
            → Envía FCM notification
              → Llega al dispositivo via Service Worker
```

**Puntos de falla (debug en orden):**
1. ¿El INSERT en `activity` ocurre? → Log del cliente
2. ¿El trigger se ejecuta? → `SELECT * FROM net._http_response`
3. ¿La Edge Function recibe el request? → Logs de Edge Function en Dashboard
4. ¿La Edge Function encuentra el token? → `console.error` en la función
5. ¿FCM acepta el envío? → Código de respuesta de FCM

---

## 7. COMANDOS ÚTILES DE DIAGNÓSTICO

```sql
-- Ver triggers en una tabla
SELECT trigger_name, event_manipulation, event_object_table,
       action_statement, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'activity';

-- Ver el código de una función
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_activity_notify';

-- Ver si un trigger está habilitado
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_activity_insert';
-- tgenabled = 'O' → habilitado

-- Ver extensiones instaladas
SELECT extname, extnamespace::regnamespace FROM pg_extension;

-- Ver respuestas HTTP de pg_net (errores)
SELECT * FROM net._http_response
WHERE status_code >= 400 OR error_msg IS NOT NULL
ORDER BY created DESC;

-- Ver policies creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
ORDER BY tablename;

-- Ver grants de una tabla
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'push_subscriptions';
```

---

## 8. CHECKLIST ANTES DE ACTIVAR RLS

- [ ] Listar TODAS las queries del cliente hacia esa tabla (grep)
- [ ] Para cada query: SELECT/INSERT/UPDATE/DELETE/UPSERT
- [ ] Crear una policy por cada operación necesaria
- [ ] Para UPSERT: crear INSERT + UPDATE + SELECT policies
- [ ] Especificar `TO authenticated` (nunca dejarlo sin `TO`)
- [ ] Hacer `GRANT SELECT, INSERT, UPDATE, DELETE ON tabla TO authenticated;`
- [ ] Probar con usuario real (no solo con service_role)
- [ ] Monitorear errores en cliente (consola del navegador)
- [ ] Si la Edge Function necesita acceso, verificar que usa `SUPABASE_SERVICE_ROLE_KEY`

---

## 9. REGLA DE ORO FINAL

> **Si una tabla SOLO la escribe/lee la Edge Function (con service_role_key), no necesita RLS.**
> **Si una tabla la escribe/lee el cliente (con anon key), necesita RLS + policies + grants.**
> **Si una tabla la escriben AMBOS (cliente + Edge Function), la Edge Function bypasea RLS con service_role_key, pero el cliente necesita policies.**
