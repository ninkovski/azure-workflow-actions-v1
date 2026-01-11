# � Guía de Configuración de Secretos

> **👤 Para:** Lead Tech / DevOps / Administradores  
> **⏱️ Frecuencia:** Configurar UNA VEZ  
> **📍 Dónde:** Repositorio `azure-workflow-actions` únicamente

## 📋 Tabla de Contenidos

1. [Filosofía y Enfoque](#-filosofía-gobernanza-centralizada--managed-identity)
2. [Secretos Obligatorios](#-secretos-obligatorios-configurar-una-vez)
3. [Guía Paso a Paso](#-guía-paso-a-paso)
4. [Proyectos Consumidores](#-proyectos-consumidores-zero-configuration)
5. [Managed Identity para Apps](#-managed-identity-para-aplicaciones)
6. [Verificación y Testing](#-verificación)

---

## 🎯 Filosofía: Gobernanza Centralizada + Managed Identity

**Importante:** 
- **Secretos de Infraestructura** (Azure credentials, SMTP): Se configuran UNA VEZ en `azure-workflow-actions` por Lead Tech
- **Secretos de Aplicación** (DB, Redis, Storage, APIs): NO se manejan en GitHub - las apps usan **Managed Identity** en Azure

### Por qué este enfoque

✅ **Seguridad**: Los desarrolladores NO tienen acceso a credenciales de Azure ni de aplicación  
✅ **Managed Identity**: Apps acceden a recursos (CosmosDB, Storage, KeyVault) sin secretos hardcodeados  
✅ **Gobernanza**: Control centralizado de permisos en Azure  
✅ **Simplicidad**: Devs desarrollan sin secretos reales  
✅ **Zero Trust**: Sin credenciales en código o CI/CD  
✅ **Auditoría**: Fácil seguimiento en Azure AD  

## 🔐 Secretos Obligatorios (Configurar Una Vez)

### 📍 Ubicación

**Repositorio:** `azure-workflow-actions`  
**Ruta:** Settings → Secrets and variables → Actions → New repository secret

---

### 1️⃣ AZURE_CREDENTIALS (OBLIGATORIO para Deployment)

**Descripción:** Credenciales del Service Principal para hacer deploys a Azure

**Formato:** JSON

**Permisos que tiene:**
- ✅ Deploy a Azure App Service / Functions
- ✅ Crear y gestionar recursos en Azure

**Permisos que NO tiene:**
- ❌ NO acceso a bases de datos (CosmosDB, SQL, etc.)
- ❌ NO acceso a secretos de aplicación
- ❌ NO acceso a datos sensibles

**📝 Cómo obtenerlo:**

```bash
# ⚠️ REEMPLAZA: {subscription-id} y {resource-group}
az ad sp create-for-rbac --name "github-actions-deploy" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

**💾 Copiar el JSON completo** que devuelve el comando y guardarlo como `AZURE_CREDENTIALS`

---

### 2️⃣ Secretos de Email (OBLIGATORIOS para Notificaciones)

| Secret | Descripción | Ejemplo |
|--------|-------------|----------|
| `EMAIL_TO` | Email destinatario de notificaciones | `devops@tuempresa.com` |
| `SMTP_SERVER` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_USERNAME` | Usuario SMTP | `noreply@tuempresa.com` |
| `SMTP_PASSWORD` | Contraseña o App Password | `tu-password-aqui` |

### Opcionales

```
EMAIL_FROM        # Email remitente (default: noreply@azure-deployments.com)
SMTP_PORT         # Puerto SMTP (default: 587)
```

### Ejemplos de Configuración por Proveedor

#### Gmail
```
EMAIL_TO=devops@tucompania.com
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password-de-16-digitos
```

**Nota:** Para Gmail, debes generar una "Contraseña de aplicación" en tu cuenta de Google (Security → 2-Step Verification → App passwords).

#### Office 365 / Outlook
```
EMAIL_TO=devops@tucompania.com
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@outlook.com
SMTP_PASSWORD=tu-contraseña
```

#### SendGrid
```
EMAIL_TO=devops@tucompania.com
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=tu-sendgrid-api-key
```

## 🚀 Proyectos Consumidores (Zero Configuration)

### ✅ Lo que necesitan los desarrolladores: NADA

Los proyectos que usan estos workflows **NO configuran secretos**.

### 📝 Solo copian el ejemplo de workflow:

```yaml
# .github/workflows/deploy.yml en TU proyecto
jobs:
  deploy:
    uses: TU-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: mi-app          # ⚠️ Cambiar por tu app
      resource-group: mi-rg              # ⚠️ Cambiar por tu RG
      environment: prod
    # ✅ NO hay secrets - todo está centralizado
```

### 🎯 Ventaja Principal

**UNA configuración de secretos → ∞ proyectos pueden deployar**

### Beneficios para Desarrolladores

✅ No necesitan acceso a credenciales de Azure  
✅ No pueden accidentalmente exponer secretos  
✅ Setup instantáneo: solo copiar el workflow  
✅ Menor superficie de ataque de seguridad  

### Beneficios para Lead Tech / DevOps

✅ Control total de credenciales  
✅ Rotación de secretos sin tocar proyectos consumidores  
✅ Auditoría centralizada  
✅ Fácil revocar acceso (cambiar Service Principal)  
✅ Cumplimiento de políticas de seguridad  

## 📝 Guía Paso a Paso

### Paso 1: Crear Service Principal

#### Opción A: Por Resource Group (✅ Recomendado - Más Seguro)

**🔒 Ventaja:** Solo puede deployar a UN resource group específico

```bash
# ⚠️ REEMPLAZA los valores entre {}
az ad sp create-for-rbac --name "github-actions-deploy-{ambiente}" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

**💾 Guarda el JSON que devuelve**

---

#### Opción B: Por Subscripción (⚠️ Más Permisivo)

**⚠️ Advertencia:** Puede deployar a CUALQUIER resource group de la subscripción

```bash
# ⚠️ REEMPLAZA {subscription-id}
az ad sp create-for-rbac --name "github-actions-deploy" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --sdk-auth
```

---

#### Opción C: Múltiples Service Principals por Ambiente (🏆 Mejor Práctica)

**🎯 Enfoque:** Un Service Principal diferente por cada ambiente

```bash
# 1. Service Principal para DEV
az ad sp create-for-rbac --name "github-actions-dev" \
  --role contributor \
  --scopes /subscriptions/{sub-id}/resourceGroups/rg-dev \
  --sdk-auth

# 2. Service Principal para STAGING  
az ad sp create-for-rbac --name "github-actions-staging" \
  --role contributor \
  --scopes /subscriptions/{sub-id}/resourceGroups/rg-staging \
  --sdk-auth

# 3. Service Principal para PROD
az ad sp create-for-rbac --name "github-actions-prod" \
  --role contributor \
  --scopes /subscriptions/{sub-id}/resourceGroups/rg-prod \
  --sdk-auth
```

**⚙️ Configuración en GitHub:**
- Ve a Settings → Environments en `azure-workflow-actions`
- Crea environments: `dev`, `staging`, `prod`
- Asigna el `AZURE_CREDENTIALS` correspondiente a cada environment
- (Opcional) Añade Protection Rules para `prod` (requiere aprobación)

---

### Paso 2: Configurar Secretos en GitHub

**📍 Repositorio:** `azure-workflow-actions`

1. **Ve a Settings del repositorio**
2. **Secrets and variables → Actions**
3. **New repository secret**
4. **Agrega cada secret:**

```
Nombre: AZURE_CREDENTIALS
Valor: {pega el JSON completo del paso 1}

Nombre: EMAIL_TO
Valor: devops@tuempresa.com

Nombre: SMTP_SERVER
Valor: smtp.gmail.com

Nombre: SMTP_USERNAME  
Valor: noreply@tuempresa.com

Nombre: SMTP_PASSWORD
Valor: tu-app-password
```

**Opcionales:**
```
Nombre: EMAIL_FROM
Valor: noreply@azure-deployments.com

Nombre: SMTP_PORT
Valor: 587
```

---

### Paso 3: Configurar Managed Identity en Apps (Ver sección abajo)

---

## ✅ Verificación

Para probar que los secretos están configurados correctamente:

1. En `azure-workflow-actions`: Actions → Test Email Notification → Run workflow
2. Revisa que llegue el email a la dirección configurada en `EMAIL_TO`

---

## 🔑 Managed Identity para Aplicaciones

### ⚠️ Regla de Oro: Secretos de App NO van en GitHub

**❌ NO configurar en GitHub:**
- Connection strings de bases de datos
- API keys de servicios
- Passwords de Redis, Storage, etc.

**✅ Usar en su lugar:**
- **Managed Identity** para recursos Azure (CosmosDB, Storage, KeyVault)
- **Azure KeyVault** para secretos de terceros (APIs externas)

---

### 🎯 Enfoque: Managed Identity + DefaultAzureCredential

### 📐 Arquitectura de Seguridad (Sin Secretos)

```
┌──────────────────────────┐
│  Tu App (Function/API)   │
│  ✅ SIN connection strings │
│  ✅ SIN passwords         │
│  ✅ DefaultAzureCredential│
└────────────┬─────────────┘
             │
             │ Managed Identity
             │ (Azure AD maneja todo)
             ▼
    ┌────────────────────┐
    │    Azure AD        │
    │  (Autenticación)   │
    └────────┬───────────┘
             │
   ┌─────────┼──────────┐
   ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌─────────┐
│Cosmos  │ │KeyVault│ │ Storage │
│  DB    │ │        │ │ Account │
└────────┘ └────────┘ └─────────┘
 ✅ Sin    ✅ Sin     ✅ Sin
 credenciales credenciales credenciales
```

#### Paso 1: Habilitar Managed Identity en tu App/Function

```bash
# Para App Service
az webapp identity assign \
  --name mi-app \
  --resource-group mi-rg

# Para Azure Function
az functionapp identity assign \
  --name mi-function \
  --resource-group mi-rg
```

Esto crea una identidad en Azure AD automáticamente.

#### Paso 2: Dar Permisos a Recursos

```bash
# Dar acceso a Cosmos DB
az cosmosdb sql role assignment create \
  --account-name mi-cosmosdb \
  --resource-group mi-rg \
  --role-definition-name "Cosmos DB Built-in Data Contributor" \
  --principal-id <managed-identity-principal-id> \
  --scope "/"

# Dar acceso a Storage
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <managed-identity-principal-id> \
  --scope /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{storage}

# Dar acceso a KeyVault
az keyvault set-policy \
  --name mi-keyvault \
  --object-id <managed-identity-principal-id> \
  --secret-permissions get list
```

#### Paso 3: Código de Aplicación (Sin Secretos)

**Node.js / JavaScript:**
```javascript
const { DefaultAzureCredential } = require('@azure/identity');
const { CosmosClient } = require('@azure/cosmos');

// Sin connection string - usa Managed Identity
const credential = new DefaultAzureCredential();
const client = new CosmosClient({
  endpoint: 'https://mi-cosmosdb.documents.azure.com:443/',
  aadCredentials: credential
});
```

**Python:**
```python
from azure.identity import DefaultAzureCredential
from azure.cosmos import CosmosClient

# Sin connection string - usa Managed Identity
credential = DefaultAzureCredential()
client = CosmosClient(
    url='https://mi-cosmosdb.documents.azure.com:443/',
    credential=credential
)
```

**.NET:**
```csharp
using Azure.Identity;
using Azure.Storage.Blobs;

// Sin connection string - usa Managed Identity
var credential = new DefaultAzureCredential();
var blobClient = new BlobServiceClient(
    new Uri("https://mistorage.blob.core.windows.net"),
    credential
);
```

#### Paso 4: Desarrollo Local

Para desarrollo local, los devs usan su propia identidad de Azure AD:

```bash
# Login con Azure CLI
az login

# Tu código funcionará localmente sin cambios
# DefaultAzureCredential detecta automáticamente tu identidad
```

### Beneficios de este Enfoque

✅ **Sin secretos en código**: Ni en GitHub, ni en variables de entorno  
✅ **Sin rotación manual**: Azure AD maneja las credenciales  
✅ **Auditoría completa**: Logs en Azure AD de quién accedió a qué  
✅ **Principio de mínimo privilegio**: Permisos granulares por recurso  
✅ **Desarrollo local fácil**: Devs usan su propia identidad de Azure AD  
✅ **Zero Trust**: Autenticación y autorización en cada request  

### Secretos que SÍ van en KeyVault (Opcional)

Si necesitas secretos de terceros (APIs externas), guárdalos en KeyVault:

```bash
# Guardar API key en KeyVault
az keyvault secret set \
  --vault-name mi-keyvault \
  --name "OpenAI-API-Key" \
  --value "sk-..."

# Tu app accede con Managed Identity (sin secret de KeyVault)
```

**Código:**
```javascript
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://mi-keyvault.vault.azure.net/', credential);

// Obtener secreto sin credenciales
const secret = await client.getSecret('OpenAI-API-Key');
const apiKey = secret.value;
```

---

## 👨‍💻 Flujo de Trabajo para Desarrolladores

### ❌ Lo que NO hacen los devs
- ❌ NO crean secretos en GitHub
- ❌ NO tienen connection strings en código
- ❌ NO configuran AZURE_CREDENTIALS
- ❌ NO manejan credenciales de bases de datos

### ✅ Lo que SÍ hacen los devs

1. **Escriben código con DefaultAzureCredential**
```javascript
const credential = new DefaultAzureCredential();
const client = new CosmosClient({ endpoint: '...', aadCredentials: credential });
```

2. **Login local con su identidad**
```bash
az login
```

3. **Desarrollan normalmente** - el código funciona local y en Azure sin cambios

4. **Crean workflow simple**
```yaml
jobs:
  deploy:
    uses: ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: mi-app
      resource-group: mi-rg
      environment: dev
```

5. **Push** - el deployment sucede automáticamente con la identidad del Service Principal

---

## 🔒 Resumen de Responsabilidades

### Lead Tech / DevOps (Una vez)
- ✅ Configurar `AZURE_CREDENTIALS` en azure-workflow-actions
- ✅ Configurar secretos de email (SMTP)
- ✅ Habilitar Managed Identity en apps/functions
- ✅ Asignar permisos de Azure AD a recursos
- ✅ (Opcional) Crear KeyVault y guardar secretos de terceros

### Desarrolladores (Siempre)
- ✅ Usar `DefaultAzureCredential` en código
- ✅ Hacer `az login` para desarrollo local
- ✅ Crear workflow con inputs públicos
- ✅ Push → Deploy automático

### GitHub Actions (Automático)
- ✅ Deploy con Service Principal (desde azure-workflow-actions)
- ✅ Notificaciones por email
- ✅ Sin acceso a secretos de aplicación

---

**Ventajas de este enfoque:**
- ✅ Configura SMTP una sola vez
- ✅ No expones credenciales en múltiples repos
- ✅ Fácil mantenimiento centralizado
- ✅ Rotación de credenciales en un solo lugar
