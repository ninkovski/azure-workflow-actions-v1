# 🚀 Guía: Cómo Consumir Azure Workflow Actions

Esta guía explica cómo usar `azure-workflow-actions` como librería de workflows reutilizables desde **otro proyecto**.

## 📋 Arquitectura de Secretos (Gobernanza Centralizada)

**Importante:** TODOS los secretos de infraestructura se configuran **una sola vez** en el repositorio `azure-workflow-actions` por el Lead Tech o DevOps. Los desarrolladores **NO necesitan acceso a ningún secreto**.

### Tipos de Secretos

#### 1. Secretos de Infraestructura (En azure-workflow-actions)
- `AZURE_CREDENTIALS` - Service Principal para deployment
- `EMAIL_TO`, `SMTP_*` - Notificaciones

**Configurados por:** Lead Tech / DevOps  
**Acceso:** Solo en azure-workflow-actions  

#### 2. Secretos de Aplicación (NO en GitHub)
- Connection strings de DB, Redis, Storage
- API Keys de servicios externos
- Certificados

**Método:** Managed Identity + Azure KeyVault  
**Los desarrolladores:** Usan `DefaultAzureCredential` en código  
**En runtime:** Azure proporciona acceso automático via identidad  

### Ventajas de esta Arquitectura

✅ **Seguridad**: Desarrolladores NO tienen acceso a credenciales  
✅ **Managed Identity**: Apps acceden a recursos sin secretos hardcodeados  
✅ **Gobernanza**: Control centralizado en Azure AD  
✅ **Simplicidad**: Devs escriben código sin manejar secretos  
✅ **Zero Trust**: Sin credenciales en código ni CI/CD  
✅ **Mantenimiento**: Rotación centralizada de credenciales  

Ver [SECRETS-SETUP.md](SECRETS-SETUP.md) para detalles completos sobre Managed Identity.

## 📋 Escenarios de Uso

### Opción 1: Consumir Workflows Completos (Recomendado)

Ideal cuando quieres un pipeline completo de deploy listo para usar.

#### Ejemplo: Proyecto con Azure Function

En tu proyecto (ej: `mi-function-app`), crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  deploy:
    uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: mi-function-app
      resource-group: mi-resource-group
      environment: ${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
      node-version: '18.x'
      run-tests: true
      enable-notifications: true
    # NO hay secrets - todo está en azure-workflow-actions
```

#### Ejemplo: Proyecto con Spring Boot API

En tu proyecto (ej: `mi-spring-api`), crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy Spring API

on:
  push:
    branches: [main, staging, develop]

jobs:
  deploy:
    uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-spring-api.yml@main
    with:
      app-name: mi-spring-api
      resource-group: mi-resource-group
      environment: ${{ github.ref == 'refs/heads/main' && 'prod' || github.ref == 'refs/heads/staging' && 'staging' || 'dev' }}
      package-path: './target/*.jar'
      java-version: '17'
      build-tool: 'maven'
      enable-notifications: true
    secrets:
    # NO hay secrets - todo está en azure-workflow-actions

---

### Opción 2: Consumir Actions Individuales

Ideal cuando quieres armar tu propio workflow personalizado.

#### Ejemplo: Workflow Custom con Notificaciones

```yaml
name: Custom Deploy Pipeline

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'

      # Tus pasos personalizados de build
      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      # Configurar credenciales Azure (action reutilizable)
      - name: Setup Azure
        uses: TU-USUARIO/azure-workflow-actions/.github/actions/setup-azure-credentials@main
        with:
          azure-credentials: ${{ secrets.AZURE_CREDENTIALS }}

      # Deploy a Azure (tu lógica custom o action reutilizable)
      - name: Deploy to Azure Function
        uses: TU-USUARIO/azure-workflow-actions/.github/actions/deploy-azure-function@main
        with:
          function-app-name: mi-function
          resource-group: mi-rg
          environment: prod

      # Notificar resultado (action reutilizable)
      - name: Notify Success
        if: success()
        uses: TU-USUARIO/azure-workflow-actions/.github/actions/notify-deployment@main
        with:
          environment: prod
          status: success
          deployment-url: https://mi-function.azurewebsites.net
          additional-info: 'Deployment completed successfully'

      - name: Notify Failure
        if: failure()
        uses: TU-USUARIO/azure-workflow-actions/.github/actions/notify-deployment@main
        with:
          environment: prod
          status: failure
```

---

## 🔑 Configuración de Secrets
 (Solo Lead Tech / DevOps)

### En azure-workflow-actions (Configurar Una Vez)

**Lead Tech o DevOps configura estos secrets:**

```bash
# En GitHub: Settings > Secrets and variables > Actions > New repository secret

# Azure
AZURE_CREDENTIALS   # JSON del Service Principal de Azure

# Notificaciones Email
EMAIL_TO            # Email destinatario de notificaciones
SMTP_SERVER         # Servidor SMTP (ej: smtp.gmail.com)
SMTP_USERNAME       # Usuario SMTP
SMTP_PASSWORD       # Contraseña o App Password
EMAIL_FROM          # (Opcional) Email remitente
SMTP_PORT           # (Opcional) Puerto SMTP (default: 587)
```

Ver [SECRETS-SETUP.md](SECRETS-SETUP.md) para instrucciones detalladas por proveedor (Gmail, Office 365, SendGrid).

### En tu Proyecto Consumidor

**Los desarrolladores NO configuran secretos.**

Solo crean el archivo `.github/workflows/deploy.yml` con inputs públicos (nombre de app, resource group, environment).
---

## 📍 Referencia de Versión

Puedes referenciar el workflow/action de diferentes formas:

```yaml
# Usar la última versión de main
uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@main

# Usar un tag específico (recomendado para producción)
uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@v1.0.0

# Usar un commit específico
uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@abc1234
```

---

## 🏗️ Estructura de un Proyecto Consumidor

Ejemplo de estructura para un proyecto que consume la librería:

```
mi-function-app/                    # Tu proyecto
├── .github/
│   └── workflows/
│       └── deploy.yml              # Consume azure-workflow-actions
├── src/
│   └── index.js                    # Tu código
├── package.json
└── host.json
```

**deploy.yml** simplemente referencia el workflow reutilizable:

```yaml
jobs:
  deploy:
    uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: mi-function-app
      resource-group: mi-rg
      environment: ${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

---# Sin secrets - todo centralizado
## 📧 Notificaciones Automáticas

Las notificaciones por email se envían automáticamente cuando `enable-notifications: true` (valor por defecto).

**App Name:** Se genera automáticamente como `{nombre-repo}-{environment}`
- Ejemplo: `mi-function-app-prod`, `mi-api-dev`

**Contenido del Email:**
- Status del deployment (Success/Failed)
- Environment
- Application name (auto-generado)
- Usuario que hizo el deploy
- Commit SHA
- URL del deployment (si se proporciona)
- Link al workflow run

---

## ✅ Ventajas de este Approach

1. **Centralización**: Un solo lugar para mantener la lógica de deploy
2. **Reutilización**: Múltiples proyectos usan el mismo workflow
3. **Consistencia**: Todos los proyectos siguen el mismo proceso
4. **Mantenimiento**: Actualiza una vez, aplica a todos los proyectos
5. **Versionado**: Controla qué versión usa cada proyecto
6. **Seguridad**: Secretos de email configurados una sola vez
7. **Simplicidad**: Proyectos consumidores solo necesitan AZURE_CREDENTIALS

---
Azure y email configurados una sola vez por Lead Tech
7. **Simplicidad**: Los desarrolladores NO necesitan acceso a secretos
8. **Gobernanza**: Control centralizado de credenciales y permisos

### 1. En el repositorio azure-workflow-actions

Configura los secretos de email (Settings → Secrets → Actions):
```
EMAIL_TO=tu-email@company.com
SMTP_SERVER=smtp.gmail.(Settings → Secrets → Actions):
```
AZURE_CREDENTIALS=<service-principal-json>P_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
```

Prueba el workflow:
```bash
# En GitHub: Actions > Test Email Notification > Run workflow
# Selecciona environment y status
# Verifica que llegue el email
```

### 2. En tu proyecto consumidor

```bash
# Crear .github/workflows/deploy.yml con el ejemplo anterior
git add .github/workflows/deploy.yml
git commit -m "Add Azure deploy workflow"
git push
```

El email se enviará automáticamente sin configurar secretos adicionales.

---

## 📚 Ejemplos por Tecnología

### Node.js / Azure Functions
```yaml
jobs:
  deploy:
    uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: mi-function
      resource-group: mi-rg
      environment: prod
    # Sin secrets
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

### Spring Boot / App Service
```yaml
jobs:
  deploy:
    uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-spring-api.yml@main
    with:
      app-name: mi-api
      resource-group: mi-rg
      environment: prod
      package-path: './target/*.jar'
      java-version: '17'
    # Sin secrets
```

### .NET / Azure Functions
```yaml
jobs:
  deploy:
    uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: mi-dotnet-function
      resource-group: mi-rg
      environment: prod
      # Ajustar runtime según necesidad
    # Sin secrets
```

---

## 🆘 Troubleshooting

### Error: "workflow was not found"
- Verifica que el path al workflow sea correcto
- Asegúrate que el repositorio azure-workflow-actions sea público o tengas acceso

### Error: "required secret not provided"
- Revisa que `AZURE_CREDENTIALS` esté configurado en el repo consumidor
- Este error NO debería ocurrir ya que los secretos están en azure-workflow-actions
- Verifica que los secretos estén configurados correctamente en el repo azure-workflow-actions
- Asegúrate de usar la versión correcta del workflow (@main, @v1.0.0, etc.)
### Las notificaciones no llegan
- Verifica que los secretos estén configurados en el repo **azure-workflow-actions** (no en el consumidor)
- Revisa los logs del workflow para ver errores de SMTP
- Prueba con el workflow "Test Email Notification"

### Email muestra nombre de app incorrecto
- Por defecto se usa `{nombre-repo}-{environment}`
- Puedes sobreescribir con el input `repository-name` si es necesario

---

## 📖 Documentación Adicional

- [SECRETS-SETUP.md](SECRETS-SETUP.md) - Configuración detallada de secretos por proveedor
- [README.md](README.md) - Descripción general del proyecto
- [USAGE.md](USAGE.md) - Guía de uso detallada
- [EXAMPLES.md](EXAMPLES.md) - Ejemplos avanzados

---

**¿Necesitas ayuda?** Abre un issue en el repositorio azure-workflow-actions.

---

### Opción 2: Consumir Actions Individuales

Ideal cuando quieres armar tu propio workflow personalizado.

#### Ejemplo: Workflow Custom con Notificaciones

```yaml
name: Custom Deploy Pipeline

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'

      # Tus pasos personalizados de build
      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      # Configurar credenciales Azure (action reutilizable)
      - name: Setup Azure
        uses: TU-USUARIO/azure-workflow-actions/.github/actions/setup-azure-credentials@main
        with:
          azure-credentials: ${{ secrets.AZURE_CREDENTIALS }}

      # Deploy a Azure (tu lógica custom o action reutilizable)
      - name: Deploy to Azure Function
        uses: TU-USUARIO/azure-workflow-actions/.github/actions/deploy-azure-function@main
        with:
          function-app-name: mi-function
          resource-group: mi-rg
          environment: prod

      # Notificar resultado (action reutilizable)
      - name: Notify Success
        if: success()
        uses: TU-USUARIO/azure-workflow-actions/.github/actions/notify-deployment@main
        with:
          notification-type: 'all'
          webhook-url: ${{ secrets.TEAMS_WEBHOOK_URL }}
          email-to: ${{ secrets.EMAIL_TO }}
          smtp-server: ${{ secrets.SMTP_SERVER }}
          smtp-username: ${{ secrets.SMTP_USERNAME }}
          smtp-password: ${{ secrets.SMTP_PASSWORD }}
          environment: prod
          status: success
          app-name: mi-function
          deployment-url: https://mi-function.azurewebsites.net

      - name: Notify Failure
        if: failure()
        uses: TU-USUARIO/azure-workflow-actions/.github/actions/notify-deployment@main
        with:
          notification-type: 'teams'
          webhook-url: ${{ secrets.TEAMS_WEBHOOK_URL }}
          environment: prod
          status: failure
          app-name: mi-function
```

---

## 🔑 Configuración de Secrets

En el repositorio que consume estos workflows, configura estos secrets:

### Secrets Requeridos

```bash
# En GitHub: Settings > Secrets and variables > Actions > New repository secret

AZURE_CREDENTIALS       # JSON de Service Principal
```

### Secrets Opcionales (Notificaciones)

```bash
TEAMS_WEBHOOK_URL      # URL del webhook de Teams
EMAIL_TO               # Email destinatario
SMTP_SERVER            # Servidor SMTP
SMTP_USERNAME          # Usuario SMTP
SMTP_PASSWORD          # Contraseña SMTP
```

---

## 📍 Referencia de Versión

Puedes referenciar el workflow/action de diferentes formas:

```yaml
# Usar la última versión de main
uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@main

# Usar un tag específico (recomendado para producción)
uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@v1.0.0

# Usar un commit específico
uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@abc1234
```

---

## 🏗️ Estructura de un Proyecto Consumidor

Ejemplo de estructura para un proyecto que consume la librería:

```
mi-function-app/                    # Tu proyecto
├── .github/
│   └── workflows/
│       └── deploy.yml              # Consume azure-workflow-actions
├── src/
│   └── index.js                    # Tu código
├── package.json
└── host.json
```

**deploy.yml** simplemente referencia el workflow reutilizable:

```yaml
jobs:
  deploy:
    uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: mi-function-app
      # ... más inputs
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

---

## ✅ Ventajas de este Approach

1. **Centralización**: Un solo lugar para mantener la lógica de deploy
2. **Reutilización**: Múltiples proyectos usan el mismo workflow
3. **Consistencia**: Todos los proyectos siguen el mismo proceso
4. **Mantenimiento**: Actualiza una vez, aplica a todos los proyectos
5. **Versionado**: Controla qué versión usa cada proyecto

---

## 🧪 Prueba Rápida

### 1. En el repositorio azure-workflow-actions

```bash
# Push para disparar test local
git add .
git commit -m "Add test workflow"
git push

# En GitHub: Actions > Test Notification Action > Run workflow
```

### 2. En tu proyecto consumidor

```bash
# Crear .github/workflows/deploy.yml con el ejemplo anterior
git add .github/workflows/deploy.yml
git commit -m "Add Azure deploy workflow"
git push
```

---

## 📚 Ejemplos por Tecnología

### Node.js / Azure Functions
Ver ejemplo completo en: [examples/function-app-workflow.yml](../examples/function-app-workflow.yml)

### Spring Boot / App Service
Ver ejemplo completo en: [examples/spring-api-workflow.yml](../examples/spring-api-workflow.yml)

### .NET / Azure Functions
```yaml
jobs:
  deploy:
    uses: TU-USUARIO/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: mi-dotnet-function
      resource-group: mi-rg
      environment: prod
      # Para .NET, ajustar en el workflow o crear uno específico
```

---

## 🆘 Troubleshooting

### Error: "workflow was not found"
- Verifica que el path al workflow sea correcto
- Asegúrate que el repositorio azure-workflow-actions sea público o tengas acceso

### Error: "required secret not provided"
- Revisa que todos los secrets requeridos estén configurados en el repo consumidor

### Las notificaciones no llegan
- Verifica el webhook de Teams
- Revisa los logs del workflow para ver errores de SMTP

---

**¿Necesitas ayuda?** Abre un issue en el repositorio azure-workflow-actions.
