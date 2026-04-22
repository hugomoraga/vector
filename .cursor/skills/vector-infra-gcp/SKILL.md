---
name: vector-infra-gcp
description: >-
  Explains Vector GCP Terraform layout (envs, tfvars, secrets, Cloud Run images) and
  the tf.sh helper. Use when editing infra/terraform, deploying to Cloud Run, managing
  IAM/secrets, or when the user mentions terraform, GCP, or nonprod/prod backends.
---

# Infra GCP / Terraform (Vector)

## Ubicación

- Código principal: `infra/terraform/` (`*.tf`, módulos de Cloud Run, IAM, scheduler, etc.).
- **Firestore rules** (si aplica al despliegue): `infra/firestore/rules.rules` y tests asociados en el repo.

## Variables por entorno

- **Públicas / no secretas**: `infra/terraform/envs/<env>.tfvars` — revisar qué puede versionarse sin riesgo.
- **Secretos**: `infra/terraform/envs/<env>.secrets.tfvars` — archivo **gitignored**. Crear a partir de `*.secrets.tfvars.example`; **nunca** commitear valores reales ni pegar secretos en el chat.

## Backends

- Estado remoto por entorno: `infra/terraform/envs/*.backend.hcl` (nonprod / prod según convención del repo).

## Script `tf.sh`

- Ruta: `infra/terraform/tf.sh`.
- Uso típico: `./tf.sh <env> plan`, `./tf.sh <env> apply`, `./tf.sh <env> init`.
- Incluye flujo de **sincronización de imágenes** Cloud Run hacia tfvars en ciertos comandos; ver comentarios en el script (`sync-images`, `VECTOR_TF_NO_SYNC_IMAGES`, `--no-sync-images`).

## Buenas prácticas

- Tras cambios en recursos, validar con `terraform fmt` y `terraform plan` en el entorno correcto.
- Mantener coherencia entre nombres de servicios Cloud Run, URLs expuestas al front y secretos referenciados en la API.

## Referencia extendida

- Descripción de servicios y despliegue a alto nivel: [`README.md`](../../../README.md).
