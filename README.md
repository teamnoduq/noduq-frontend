# NODUQ — panel

Entras con correo y contraseña, o con usuario y código. Luego ves pagos, empleados y cuenta.

Sin plan activo el dueño no entra al mostrador: si se sale antes de pagar, vuelve a `/plan`.

## Arranque

Necesitas el API en marcha (`noduq-backend` en `http://localhost:8080`).

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Copia `.env.example` a `.env.local` si no está.

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=https://gthbmxvefblwajeposrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
NEXT_PUBLIC_REVENUECAT_API_KEY=test_…
```

La clave de RevenueCat es la del **Test Store**, no una pasarela. El cobro real (Play / Stripe) va después. No pongas `service_role` en el frontend.

## Rutas

| Ruta | Quién |
| --- | --- |
| `/login` | Entrar. Olvidé mi contraseña → `/olvide` |
| `/registro` | Crear cuenta de dueño |
| `/recuperar` | Nueva clave (enlace del correo) |
| `/setup` | Nombre del local |
| `/plan` | Activar el plan. Obligatorio. No se puede saltar |
| `/` | Pagos — tabla y filtros (nombre, origen, fechas) |
| `/empleados` | Cajeros y cuántos días de avisos ven |
| `/cuenta` | Perfil, Gmail, salir, borrar cuenta |

## Auth

Supabase Auth. El panel manda `Authorization: Bearer <access_token>` al API.

Si en Supabase está activa la confirmación de correo, después de registrarte no hay sesión hasta que abras el enlace del mail.
