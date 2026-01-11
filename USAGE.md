# Guía de Uso Detallada

## 📋 Índice

- [Configuración Inicial](#configuración-inicial)
- [Actions Individuales](#actions-individuales)
- [Workflows Reutilizables](#workflows-reutilizables)
- [Configuración por Ambiente](#configuración-por-ambiente)
- [Notificaciones](#notificaciones)
- [Troubleshooting](#troubleshooting)

## 🔧 Configuración Inicial

### 1. Configurar Azure Service Principal

```bash
# Crear Service Principal
az ad sp create-for-rbac \
  --name "github-actions-sp" \
  --role contributor \
  --scopes /subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP} \
  --sdk-auth

# Output (guardar como secret AZURE_CREDENTIALS):
{
  "clientId": "xxx",
  "clientSecret": "xxx",
  "subscriptionId": "xxx",
  "tenantId": "xxx"
}
```

### 2. Configurar Secrets en GitHub

#### Secrets Requeridos:
- `AZURE_CREDENTIALS`: JSON del Service Principal

#### Secrets Opcionales:
- `NOTIFICATION_WEBHOOK_URL`: Webhook para Teams/Slack
- `AZURE_SUBSCRIPTION_ID`: Si no está en credentials

### 3. Configurar Environments en GitHub

Crea estos environments en tu repo:
- `dev` (sin protección)
- `staging` (con reviewers)
- `prod` (con reviewers + branch protection)

## 🎯 Actions Individuales

### deploy-azure-function

Despliega Azure Functions con configuración avanzada.

**Uso básico:**
```yaml
- uses: TU-ORG/azure-workflow-actions/.github/actions/deploy-azure-function@main
  with:
    azure-credentials: ${{ secrets.AZURE_CREDENTIALS }}
    function-app-name: 'my-function'
    resource-group: 'my-rg'
    environment: 'dev'
```

**Inputs:**
- `azure-credentials` (required): Credenciales Azure en JSON
- `function-app-name` (required): Nombre de la Function App
- `resource-group` (required): Resource Group
- `environment` (required): dev/staging/prod
- `package-path` (optional): Path al código, default `.`
- `node-version` (optional): Versión de Node.js, default `18.x`
- `run-tests` (optional): Ejecutar tests, default `true`
- `slot-name` (optional): Deployment slot
- `enable-oryx-build` (optional): Usar Oryx build, default `true`

**Outputs:**
- `deployment-url`: URL de la function desplegada
- `deployment-status`: Estado del deployment

### deploy-spring-api

Despliega APIs Spring Boot a Azure App Service.

**Uso básico:**
```yaml
- uses: TU-ORG/azure-workflow-actions/.github/actions/deploy-spring-api@main
  with:
    azure-credentials: ${{ secrets.AZURE_CREDENTIALS }}
    app-name: 'my-api'
    resource-group: 'my-rg'
    package-path: './target/*.jar'
    environment: 'dev'
```

**Inputs:**
- `azure-credentials` (required): Credenciales Azure
- `app-name` (required): Nombre del App Service
- `resource-group` (required): Resource Group
- `package-path` (required): Path al JAR/WAR
- `environment` (required): Ambiente
- `java-version` (optional): Versión Java, default `17`
- `build-tool` (optional): maven/gradle, default `maven`
- `run-tests` (optional): Ejecutar tests, default `true`
- `slot-name` (optional): Deployment slot

**Outputs:**
- `deployment-url`: URL del API desplegada
- `deployment-status`: Estado del deployment

### create-release

Crea releases de GitHub automáticamente.

**Uso básico:**
```yaml
- uses: TU-ORG/azure-workflow-actions/.github/actions/create-release@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    environment: 'dev'
    deployment-url: ${{ steps.deploy.outputs.deployment-url }}
```

**Inputs:**
- `github-token` (required): Token de GitHub
- `environment` (required): Ambiente desplegado
- `tag-name` (optional): Tag personalizado
- `release-name` (optional): Nombre del release
- `deployment-url` (optional): URL del deployment
- `prerelease` (optional): Marcar como prerelease
- `generate-notes` (optional): Auto-generar notas

### notify-deployment

Envía notificaciones sobre el deployment.

**Uso básico:**
```yaml
- uses: TU-ORG/azure-workflow-actions/.github/actions/notify-deployment@main
  with:
    notification-type: 'teams'
    webhook-url: ${{ secrets.TEAMS_WEBHOOK_URL }}
    environment: 'dev'
    status: 'success'
    app-name: 'my-app'
```

**Inputs:**
- `notification-type` (required): teams/slack/all
- `webhook-url` (required): URL del webhook
- `environment` (required): Ambiente
- `status` (required): success/failure
- `app-name` (required): Nombre de la app
- `deployment-url` (optional): URL del deployment
- `additional-info` (optional): Info adicional

### run-tests

Ejecuta tests para Node.js o Java.

**Uso básico:**
```yaml
- uses: TU-ORG/azure-workflow-actions/.github/actions/run-tests@main
  with:
    project-type: 'nodejs'
    node-version: '18.x'
```

**Inputs:**
- `project-type` (required): nodejs/java-maven/java-gradle
- `working-directory` (optional): Directorio de trabajo
- `node-version` (optional): Versión de Node.js
- `java-version` (optional): Versión de Java
- `coverage-report` (optional): Generar reporte de cobertura
- `fail-on-error` (optional): Fallar si hay errores

## 🔄 Workflows Reutilizables

### deploy-function.yml

Workflow completo para Azure Functions.

**Ejemplo:**
```yaml
name: Deploy Function

on:
  push:
    branches: [develop, staging, main]

jobs:
  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    uses: TU-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-dev'
      resource-group: 'my-rg-dev'
      environment: 'dev'
      create-release-on-success: true
      enable-notifications: true
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    uses: TU-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-prod'
      resource-group: 'my-rg-prod'
      environment: 'prod'
      create-release-on-success: true
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS_PROD }}
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
```

### deploy-spring-api.yml

Workflow completo para Spring Boot APIs.

**Ejemplo:**
```yaml
name: Deploy Spring API

on:
  push:
    branches: [develop, main]

jobs:
  deploy:
    uses: TU-ORG/azure-workflow-actions/.github/workflows/deploy-spring-api.yml@main
    with:
      app-name: ${{ github.ref == 'refs/heads/main' && 'my-api-prod' || 'my-api-dev' }}
      resource-group: ${{ github.ref == 'refs/heads/main' && 'my-rg-prod' || 'my-rg-dev' }}
      package-path: './target/my-api.jar'
      environment: ${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
      java-version: '17'
      build-tool: 'maven'
      run-tests: true
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

## 🌍 Configuración por Ambiente

### Development (dev)

```yaml
environment: dev
create-release-on-success: true  # Crea prerelease
run-tests: true
enable-notifications: true
```

### Staging

```yaml
environment: staging
create-release-on-success: true  # Crea prerelease
run-tests: true
enable-notifications: true
slot-name: 'staging'  # Usa slot de staging
```

### Production (prod)

```yaml
environment: prod
create-release-on-success: true  # Crea release oficial
run-tests: true
enable-notifications: true
# No slot, despliega directo a producción
```

## 📢 Notificaciones

### Microsoft Teams

1. En Teams, agrega un Incoming Webhook:
   - Canal → Connectors → Incoming Webhook
   - Copia la URL

2. Guarda como secret `TEAMS_WEBHOOK_URL`

3. Usa en workflow:
```yaml
notification-type: 'teams'
webhook-url: ${{ secrets.TEAMS_WEBHOOK_URL }}
```

### Slack

1. Crea una Slack App:
   - https://api.slack.com/apps
   - Activa Incoming Webhooks
   - Copia la URL

2. Guarda como secret `SLACK_WEBHOOK_URL`

3. Usa en workflow:
```yaml
notification-type: 'slack'
webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Múltiples Canales

```yaml
notification-type: 'all'  # Teams y Slack
webhook-url: ${{ secrets.NOTIFICATION_WEBHOOK_URL }}
```

## 🔍 Troubleshooting

### Error: "Resource not found"

**Problema:** La Function App o App Service no existe.

**Solución:**
```bash
# Verificar que existe
az functionapp show --name my-function --resource-group my-rg

# Crear si no existe
az functionapp create --name my-function \
  --resource-group my-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4
```

### Error: "Authentication failed"

**Problema:** Las credenciales de Azure son incorrectas.

**Solución:**
1. Verifica que el Service Principal existe:
```bash
az ad sp list --display-name "github-actions-sp"
```

2. Regenera las credenciales:
```bash
az ad sp credential reset --id {APP_ID} --sdk-auth
```

3. Actualiza el secret `AZURE_CREDENTIALS`

### Tests Fallan

**Problema:** Los tests no pasan y el deployment se cancela.

**Solución:**
- Ejecuta tests localmente primero
- O deshabilita tests temporalmente:
```yaml
run-tests: false
```

### Notificaciones no Llegan

**Problema:** No se reciben notificaciones.

**Solución:**
1. Verifica que el webhook URL es correcto
2. Prueba el webhook manualmente:
```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"text": "Test"}' \
  $WEBHOOK_URL
```

### Release no se Crea

**Problema:** El release no se crea después del deploy.

**Solución:**
- Verifica que `create-release-on-success: true`
- Verifica que el deployment fue exitoso
- Verifica permisos del `GITHUB_TOKEN`

---

Para más ayuda, abre un issue en el repositorio.
