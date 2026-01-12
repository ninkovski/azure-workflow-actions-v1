# Azure Workflow Actions

🚀 **Biblioteca reutilizable de GitHub Actions para despliegues en Azure**

Esta librería proporciona actions y workflows configurables para automatizar el despliegue de Azure Functions y APIs Spring Boot a Azure, con soporte para múltiples ambientes, notificaciones automáticas y creación de releases.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Quick Start](#quick-start)
- [Uso](#uso)
- [Configuración](#configuración)
- [Ejemplos](#ejemplos)
- [Contributing](#contributing)

## ✨ Características

### 🎯 Actions Disponibles

1. **deploy-azure-function** - Despliega Azure Functions (Node.js)
2. **deploy-spring-api** - Despliega APIs Spring Boot
3. **create-release** - Crea releases automáticamente
4. **notify-deployment** - Envía notificaciones por Email
5. **setup-azure-credentials** - Configura credenciales Azure
6. **run-tests** - Ejecuta tests antes del despliegue

### 🔄 Workflows Reutilizables

1. **deploy-function.yml** - Workflow completo para Azure Functions
2. **deploy-spring-api.yml** - Workflow completo para Spring APIs
3. **promote-to-release.yml** - Crea releases después de deploys exitosos

### 🌍 Soporte Multi-Ambiente

- **Development** - Deploy automático + Release prerelease
- **Staging** - Deploy con aprobación + Release prerelease
- **Production** - Deploy con aprobación + Release oficial

### 📢 Notificaciones

- Email (SMTP)

Secretos configurados **una vez** en el repositorio `azure-workflow-actions`, sin necesidad de configurarlos en proyectos consumidores.

### 🔐 Seguridad con Managed Identity

Las aplicaciones usan **Azure Managed Identity** para acceder a recursos (CosmosDB, Storage, KeyVault) **sin secretos en código**:

- ✅ Sin connection strings hardcodeados
- ✅ Sin API keys en variables de entorno
- ✅ Los desarrolladores usan `DefaultAzureCredential`
- ✅ Azure AD maneja autenticación automáticamente

Ver [SECRETS-SETUP.md](SECRETS-SETUP.md) para guía completa de Managed Identity.

## 📁 Estructura del Proyecto

```
azure-workflow-actions/
├── .github/
│   ├── actions/
│   │   ├── deploy-azure-function/
│   │   │   └── action.yml
│   │   ├── deploy-spring-api/
│   │   │   └── action.yml
│   │   ├── create-release/
│   │   │   └── action.yml
│   │   ├── notify-deployment/
│   │   │   └── action.yml
│   │   ├── setup-azure-credentials/
│   │   │   └── action.yml
│   │   └── run-tests/
│   │       └── action.yml
│   └── workflows/
│       ├── deploy-function.yml
│       ├── deploy-spring-api.yml
│       └── promote-to-release.yml
├── config/
│   ├── environments.json
│   └── notification-templates.json
├── examples/
│   ├── function-app-workflow.yml
│   └── spring-api-workflow.yml
├── README.md
├── USAGE.md
└── EXAMPLES.md
```

## 🚀 Quick Start

### 1. Configurar Secrets en GitHub

Añade estos secrets en tu repositorio:

**Requeridos:**
- `AZURE_CREDENTIALS` - Credenciales de Azure (JSON)
Para notificaciones (configurar en azure-workflow-actions repo):**
- `EMAIL_TO` - Email destinatario
- `EMAIL_FROM` - Email remitente (opcional)
- `SMTP_SERVER` - Servidor SMTP (ej: smtp.gmail.com)
- `SMTP_PORT` - Puerto SMTP (opcional, default 587
- `SMTP_SERVER` - Servidor SMTP (ej: smtp.gmail.com)
- `SMTP_USERNAME` - Usuario SMTP
- `SMTP_PASSWORD` - Contraseña SMTP

### 2. Consumir desde tu Proyecto (Desarrolladores)

Los desarrolladores **NO necesitan configurar secretos**. Solo crean el workflow:

#### Para Azure Functions:

```yaml
name: Deploy Function to Azure

on:
  push:
    branches: [develop, staging, main]

jobs:
  deploy:
    uses: TU-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: my-function-app
      resource-group: my-resource-group
      environment: ${{ github.ref == 'refs/heads/main' && 'prod' || github.ref == 'refs/heads/staging' && 'staging' || 'dev' }}
      create-release-on-success: ${{ github.ref == 'refs/heads/develop' }}
    secrets:
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
```

#### Para Spring Boot API:

```yaml
name: Deploy Spring API to Azure

on:
  push:
    branches: [develop, staging, main]

jobs:
  deploy:
    uses: TU-ORG/azure-workflow-actions/.github/workflows/deploy-spring-api.yml@main
    with:
      app-name: my-spring-api
      resource-group: my-resource-group
      package-path: './target/*.jar'
      environment: ${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
      java-version: '17'
      build-tool: 'maven'
    # Sin secrets - todo centralizado en azure-workflow-actions
```
```

## 📖 Uso

### Usar Actions Individuales

Puedes usar las actions individuales en tus propios workflows:

```yaml
- name: Deploy Function
  uses: TU-ORG/azure-workflow-actions/.github/actions/deploy-azure-function@main
  with:
    azure-credentials: ${{ secrets.AZURE_CREDENTIALS }}
    function-app-name: my-function
    resource-group: my-rg
    environment: dev
```

### Usar Workflows Reutilizables

Para usar los workflows completos:

```yaml
jobs:
  deploy:
    uses: TU-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      # ... inputs
    secrets:
      # ... secrets
```

## ⚙️ Configuración

### Credenciales Azure

Crea un Service Principal en Azure:

```bash
az ad sp create-for-rbac --name "github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

Guarda el output JSON como secret `AZURE_CREDENTIALS`.

### Webhook de Teams

1. En Teams, ve a tu canal → Connectors → Incoming Webhook
2. Copia la URL del webhook
⚠️ **Eliminado** - Ya no se usa Teams, solo notificaciones por Email.

1. Configura un servidor SMTP (Gmail, SendGrid, Office 365, etc.)
2. Guarda los secrets:
   - `EMAIL_TO`: email del destinatario
   - `SMTP_SERVER`: servidor SMTP (ej: smtp.gmail.com)
   - `SMTP_USERNAME`: tu usuario SMTP
   - `SMTP_PASSWORD`: tu contraseña o app password

#### Ejemplo con Gmail:
```bash
# 1. Habilita "App Passwords" en tu cuenta de Google
# 2. Genera una contraseña de aplicación
# 3. Configura los secrets:
EMAIL_TO=tu-email@gmail.com
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
```

## 📋 Inputs Principales

### deploy-function.yml

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `function-app-name` | ✅ | - | Nombre de la Azure Function |
| `resource-group` | ✅ | - | Resource Group de Azure |
| `environment` | ✅ | - | Ambiente (dev/staging/prod) |
| `create-release-on-success` | ❌ | `false` | Crear release si deploy exitoso |
| `enable-notifications` | ❌ | `true` | Habilitar notificaciones |
| `node-version` | ❌ | `18.x` | Versión de Node.js |

### deploy-spring-api.yml

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `app-name` | ✅ | - | Nombre del App Service |
| `resource-group` | ✅ | - | Resource Group de Azure |
| `package-path` | ✅ | - | Path al JAR/WAR |
| `environment` | ✅ | - | Ambiente (dev/staging/prod) |
| `java-version` | ❌ | `17` | Versión de Java |
| `build-tool` | ❌ | `maven` | Herramienta de build (maven/gradle) |

## 📚 Ejemplos Completos

Ver [EXAMPLES.md](EXAMPLES.md) para ejemplos detallados de:

- Deploy con múltiples ambientes
- Aprobaciones manuales
- Rollback automático
- Integración con slots de deployment
- Estrategias blue-green

## 🤝 Contributing

¡Contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📝 License

MIT License - ver [LICENSE](LICENSE) para más detalles

## � Gestión Automática de `package-lock.json`

### Cómo Funciona

Las actions de Node.js (`deploy-azure-function` y `run-tests`) detectan automáticamente si existe `package-lock.json`:

```
┌─ Primera Ejecución (Dev) ─────────────────────┐
│                                               │
│ 1. No existe package-lock.json                │
│ 2. npm install --production (genera lock)     │
│ 3. ✅ Commit automático de package-lock.json  │
│ 4. Git push                                   │
│                                               │
└───────────────────────────────────────────────┘
                      ↓
┌─ Ejecuciones Siguientes (Staging/Prod) ──────┐
│                                               │
│ 1. ✓ Existe package-lock.json (en git)       │
│ 2. npm ci --production (rápido, seguro)      │
│ 3. Usa versiones exactas del lock            │
│                                               │
└───────────────────────────────────────────────┘
```

### Flujo Típico

1. **En Development**: 
   - Desarrollador hace push sin `package-lock.json`
   - GitHub Actions lo genera automáticamente
   - Lo commitea al repositorio
   - Los tests usan ese lock file

2. **En Staging/Production**:
   - `package-lock.json` ya existe
   - Se usa `npm ci` (más rápido y confiable)
   - Instala exactamente lo que estaba en dev

### Ventajas

✅ **Consistencia**: Mismo `node_modules` en todos los ambientes  
✅ **Seguridad**: `npm ci` falla si hay inconsistencias  
✅ **Velocidad**: No necesita resolver dependencias en cada deploy  
✅ **Automatización**: No requiere configuración manual  
✅ **Git-friendly**: El lock file queda versionado automáticamente  

## 🔗 Links Útiles

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)

---

**Hecho con ❤️ para la comunidad DevOps**
