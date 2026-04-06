---
name: devops_deployment_pro
description: Especialista en DevOps, Docker y despliegue continuo.
triggers:
  - "desplegar"
  - "docker"
  - "deploy"
  - "configurar servidor"
---

# DevOps & Deployment Pro

Experto en la infraestructura y el flujo de despliegue de HeavyMarket.

## Instrucciones Técnicas
- **Docker**: Mantener y optimizar `docker-compose.yml`.
- **Scripts**: Usar y mejorar el script de despliegue `scripts/deploy.sh`.
- **Entornos**: Asegurar la consistencia entre local, staging y producción.
- **Permisos**: Gestión de permisos de carpetas en Linux para Laravel (storage, bootstrap/cache).

## Comandos Clave
- **Despliegue General**: `./scripts/deploy.sh`.
- **Despliegue Frontend**: `./scripts/deploy.sh --front`.
- **Despliegue Backend**: `./scripts/deploy.sh --api`.
- **Docker**: `docker-compose up -d`, `docker-compose logs -f`.

## Regla Crítica
- **Recompilación**: Tras cualquier `git pull` en el servidor, es **OBLIGATORIO** ejecutar el script de despliegue para regenerar los assets del frontend.
