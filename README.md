# NODUQ — panel

Entras con correo y contraseña, o con usuario y código. Luego ves pagos, empleados y cuenta.

Este sprint es **identidad**. Los pagos QR todavía no llegan al panel: la pantalla de inicio es un estado vacío real.

## Arranque

Necesitas el API de identidad en marcha (`noduq-backend` en `http://localhost:8080`). Sin el backend, el login de Supabase puede funcionar y el setup / empleados van a fallar.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El CORS del API ya permite ese origen.

Copia `.env.example` a `.env.local` si no está. `.env.local` no se sube a git.

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=https://gthbmxvefblwajeposrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
```

No pongas `service_role` en el frontend.

## Rutas

| Ruta | Quién |
| --- | --- |
| `/login` | Entrar con correo y contraseña |
| `/registro` | Crear cuenta de dueño |
| `/setup` | Nombre del local (solo si aún no hay negocio) |
| `/` | Pagos — espera el aviso del QR |
| `/empleados` | Cajeros: crear, código una vez, regenerar, desactivar, borrar |
| `/cuenta` | Perfil, nombre del local, salir, borrar cuenta |

## Auth

Supabase Auth (correo + contraseña). El panel manda `Authorization: Bearer <access_token>` al API Spring.

Si en el proyecto de Supabase está activa la confirmación de correo, después de registrarte no hay sesión hasta que abras el enlace del mail. El panel te lo dice.

## No incluir

No copies las APIs de pagos de la droguería ni la base vieja de payments. Este repo no hace ingest de QR.
