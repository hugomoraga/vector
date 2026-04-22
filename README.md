# Vector

Monorepo de la aplicación **Vector**: frontend en Next.js, API en Express y paquetes compartidos. Autenticación con Firebase; datos en Firestore; recordatorios opcionales vía Telegram.

## Requisitos

- **Node.js** ≥ 22
- **npm** 10 (el repo fija `packageManager` en la raíz)

## Estructura

| Ruta | Descripción |
|------|-------------|
| `apps/web` | Next.js 14 (App Router), Tailwind, cliente Firebase |
| `apps/api` | API HTTP (Express), Firebase Admin, rutas REST |
| `packages/config` | Constantes y lectura de entorno compartida |
| `packages/types` | Tipos TypeScript compartidos |
| `packages/utils` | Utilidades compartidas |
| `infra/terraform` | GCP (Cloud Run, IAM, secretos, etc.) |
| `scripts` | Ayudas (`tf` → Terraform, builds Docker web) |

## Desarrollo local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

**API** — copia `apps/api/.env.example` a `apps/api/.env` y/o `apps/api/.env.local` y rellena al menos la cuenta de servicio de Firebase (mismo proyecto que el cliente web) para que `verifyIdToken` coincida con los tokens del navegador.

**Web** — copia `apps/web/.env.example` a `apps/web/.env.local` y configura las variables `NEXT_PUBLIC_FIREBASE_*` y `NEXT_PUBLIC_API_URL` (por defecto la API local se usa en `http://localhost:3001`).

La API carga `.env` y luego `.env.local` desde el directorio de trabajo de `apps/api` (ver `apps/api/src/load-env.ts`).

### 3. Arrancar en caliente

```bash
npm run dev
```

Turbo ejecuta los `dev` de web y API. Asegúrate de que el **puerto de la API** coincida con `NEXT_PUBLIC_API_URL` (la API usa `PORT` del entorno; si no está definido, **3001**).

### Otros comandos útiles

| Comando | Uso |
|---------|-----|
| `npm run build` | Build de todos los workspaces |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` en los paquetes que lo definan |
| `npm run validate` | `lint` + `typecheck` |
| `npm run docker:api` | Imagen Docker local de la API |
| `npm run docker:web` | Build de imagen web (script en `scripts/`) |

## API (resumen)

- **CORS**: controlado por `CORS_ORIGIN` (por defecto `http://localhost:3000` para el front en dev).
- **Rutas protegidas**: cabecera `Authorization: Bearer <Firebase ID token>`; middleware en `apps/api/src/middleware/auth.ts`.
- **Salud**: `GET /health`.

### Telegram (textos de `/start`)

Los mensajes que envía el webhook al vincular o al saludar sin token se pueden personalizar en **`apps/api/.env.local`** (o variables de entorno en Cloud Run):

| Variable | Uso |
|----------|-----|
| `TELEGRAM_MSG_WELCOME_PLAIN` | Respuesta a `/start` sin deep link. Puedes usar `{{chatId}}` donde quieras el id numérico del chat. |
| `TELEGRAM_MSG_WELCOME_LINKED` | Tras vincular la cuenta desde la app correctamente. |
| `TELEGRAM_MSG_LINK_INVALID` | Enlace de vinculación inválido, usado o caducado. |

Si las omites, se usan los textos por defecto definidos en [`apps/api/src/lib/telegramMessages.ts`](apps/api/src/lib/telegramMessages.ts). En `.env`, líneas largas pueden usar `\n` para saltos de línea.

### Jobs internos (`POST /generate-daily`, `POST /send-reminders`)

Estos endpoints recorren usuarios y no usan Firebase del cliente. Van protegidos con `INTERNAL_JOB_SECRET` (variable de entorno):

- Si el secreto **está definido**: hay que enviar el mismo valor en la cabecera **`X-Vector-Job-Secret`** o como **`Authorization: Bearer <valor>`** (comparación en tiempo constante).
- Si **no** está definido y `NODE_ENV` es **`production`**, la API responde **503** (evita despliegues abiertos por error).
- En **desarrollo** (`NODE_ENV` distinto de `production`), sin secreto los endpoints siguen aceptando peticiones para facilitar pruebas locales.

En GCP, define `internal_job_secret` en `envs/<env>.secrets.tfvars`; Terraform crea el secreto `internal-job-secret` en Secret Manager y lo inyecta en Cloud Run como `INTERNAL_JOB_SECRET`.

**Ejemplo — Cloud Scheduler (HTTP) llamando a la API desplegada:**

Sustituye `https://vector-api-xxxxx.run.app` por la URL real de la API y usa el mismo valor que en Secret Manager / `.env`.

```bash
curl -sS -X POST "https://<api-host>/generate-daily" \
  -H "X-Vector-Job-Secret: <INTERNAL_JOB_SECRET>"
```

En la consola de Scheduler, en el objetivo HTTP puedes añadir la cabecera `X-Vector-Job-Secret` con el valor del secreto (idealmente referenciado desde Secret Manager si la UI lo permite, o rotado con cuidado).

## Infraestructura (Terraform)

Configuración en `infra/terraform`. Variables públicas por entorno en `infra/terraform/envs/<env>.tfvars`; secretos en `envs/<env>.secrets.tfvars` (gitignored; plantillas `*.secrets.tfvars.example`). Entre los secretos opcionales está `internal_job_secret` (jobs `/generate-daily` y `/send-reminders`); en producción conviene definirlo siempre.

Desde la raíz del repo:

```bash
./scripts/tf <env> init
./scripts/tf <env> plan
./scripts/tf <env> apply
./scripts/tf <env> sync-images   # actualiza api_image/web_image desde Cloud Run
```

`<env>` suele ser `nonprod` o `prod`. Los servicios Cloud Run se llaman `vector-api` y `vector-web`. Requiere `gcloud` autenticado cuando uses `sync-images` o cuando el wrapper sincronice imágenes en plan/apply.

Para **textos del bot Telegram** en la API desplegada, define en `infra/terraform/envs/<env>.tfvars` (variables públicas, no van en `secrets.tfvars`): `telegram_msg_welcome_plain`, `telegram_msg_welcome_linked`, `telegram_msg_link_invalid`. Terraform las pasa como variables de entorno al contenedor `vector-api`. Cadenas vacías se omiten y la API usa los valores por defecto de [`apps/api/src/lib/telegramMessages.ts`](apps/api/src/lib/telegramMessages.ts). Textos multilínea en `.tfvars` puedes escribirlos con [heredoc de Terraform](https://developer.hashicorp.com/terraform/language/expressions/strings#heredoc-strings) (`<<-EOT` … `EOT`).

## Licencia

Privado (`private: true` en `package.json`). Ajusta esta sección si publicas el código con una licencia concreta.
