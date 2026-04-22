---
name: vector-local-dev
description: >-
  Guides local development for the Vector monorepo (npm workspaces, Turbo, Firebase
  client + Admin, env files, PORT and NEXT_PUBLIC_API_URL alignment, CORS). Use when
  the user sets up .env, hits localhost/CORS/token errors, or asks how to run web+API
  together.
---

# Desarrollo local (Vector)

## Objetivo

Levantar **web** (Next.js) y **API** (Express) con variables coherentes y el **mismo proyecto Firebase** en cliente y servidor.

## Pasos rápidos

1. **Instalar** (raíz del repo): `npm install`
2. **API** — Copiar `apps/api/.env.example` → `apps/api/.env` y/o `apps/api/.env.local`. Rellenar credenciales de **Firebase Admin** del mismo proyecto que el navegador (para `verifyIdToken`).
3. **Web** — Copiar `apps/web/.env.example` → `apps/web/.env.local`. Configurar `NEXT_PUBLIC_FIREBASE_*` y `NEXT_PUBLIC_API_URL`.
4. **Arrancar**: desde la raíz, `npm run dev` (Turbo ejecuta ambos workspaces).

## Alineación de puertos y URL

- La API usa `PORT` del entorno; si no está definido, suele ser **3001** (ver README).
- `NEXT_PUBLIC_API_URL` en el front debe coincidir con donde escucha la API (p. ej. `http://localhost:3001`).

## Carga de env en la API

- `apps/api/src/load-env.ts` debe cargarse **antes** de cualquier módulo que lea `process.env`. Orden: `.env` luego `.env.local` (override).

## CORS

- Si el navegador bloquea por CORS, revisar `CORS_ORIGIN` en la API frente al origen del front (p. ej. `http://localhost:3000`).

## Errores de token

- Si el Bearer es rechazado, comprobar que web y API apuntan al **mismo** proyecto Firebase y que el token no está caducado.

## Más detalle

- Plantillas Telegram, recordatorios y variables opcionales: [`README.md`](../../../README.md).
