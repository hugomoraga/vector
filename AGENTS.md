# Guía para agentes (Cursor / IA)

Monorepo **Vector**: Next.js 14 (`apps/web`), Express + Firebase Admin (`apps/api`), paquetes `packages/*`, infra GCP en `infra/terraform`. Node ≥ 22, npm workspaces + Turbo.

## Reglas de proyecto

Las reglas persistentes para el asistente están en [`.cursor/rules/`](.cursor/rules/) (archivos `.mdc`): contexto global, convenciones por `apps/web`, `apps/api`, `packages` y Terraform.

## Skills de proyecto

Flujos detallados en [`.cursor/skills/`](.cursor/skills/):

- `vector-local-dev` — entorno local, Firebase, puertos y CORS.
- `vector-infra-gcp` — Terraform, tfvars, secretos y Cloud Run.

## Uso del agente (tokens)

- Referencia **archivos o símbolos concretos** en el chat (o `@ruta`) en lugar de adjuntar carpetas enteras salvo que haga falta.
- Pega solo el **fragmento relevante** de logs o stack traces, no volcados largos.
- Para flujos largos (env, Terraform), usa las **skills** en [`.cursor/skills/`](.cursor/skills/) y el [README.md](README.md); las reglas con `globs` ya acotan contexto por área.

## Documentación humana

Ver [README.md](README.md) para instalación, variables de entorno, API, Telegram y comandos (`npm run dev`, `npm run validate`).

Ruido de indexación: [`.cursorignore`](.cursorignore) (build, `node_modules`, estado Terraform, env local).
