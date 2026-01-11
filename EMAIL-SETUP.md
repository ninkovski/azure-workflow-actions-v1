# Guía de Configuración de Email

Esta guía te muestra cómo configurar notificaciones por email con diferentes proveedores SMTP.

## 📧 Gmail

### Paso 1: Habilitar App Passwords

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en 2 pasos (debe estar habilitada)
3. Busca "Contraseñas de aplicaciones"
4. Genera una nueva contraseña para "Mail"

### Paso 2: Configurar Secrets en GitHub

```bash
EMAIL_TO=tu-email@gmail.com
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # App password de 16 caracteres
```

### Ejemplo de Workflow:

```yaml
jobs:
  deploy:
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function'
      environment: 'prod'
      enable-notifications: true
      notification-type: 'email'  # Solo email
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
      EMAIL_TO: ${{ secrets.EMAIL_TO }}
      SMTP_SERVER: ${{ secrets.SMTP_SERVER }}
      SMTP_USERNAME: ${{ secrets.SMTP_USERNAME }}
      SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}
```

---

## 📨 Outlook / Office 365

### Configuración SMTP:

```bash
EMAIL_TO=destinatario@example.com
SMTP_SERVER=smtp.office365.com
SMTP_USERNAME=tu-email@outlook.com
SMTP_PASSWORD=tu-contraseña
```

**Nota:** Si tienes 2FA habilitado, necesitas una app password.

---

## 📮 SendGrid

### Paso 1: Obtener API Key

1. Crea una cuenta en https://sendgrid.com/
2. Ve a Settings → API Keys
3. Crea un nuevo API Key con permisos de "Mail Send"

### Paso 2: Configurar Secrets:

```bash
EMAIL_TO=destinatario@example.com
SMTP_SERVER=smtp.sendgrid.net
SMTP_USERNAME=apikey  # Literal "apikey"
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Tu API Key
```

---

## 📬 Amazon SES

### Configuración SMTP:

```bash
EMAIL_TO=destinatario@example.com
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com  # Tu región
SMTP_USERNAME=xxxxxxxxxxxxxxxxxxxxx  # SMTP username
SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxxx  # SMTP password
```

**Notas:**
- Debes verificar tu email en SES
- Por defecto estás en Sandbox, solo puedes enviar a emails verificados

---

## 🔧 Servidor SMTP Personalizado

Si tienes tu propio servidor SMTP:

```bash
EMAIL_TO=destinatario@tudominio.com
SMTP_SERVER=mail.tudominio.com
SMTP_USERNAME=usuario@tudominio.com
SMTP_PASSWORD=tu-contraseña
```

---

## 📢 Notificaciones Combinadas (Teams + Email)

Para recibir notificaciones tanto en Teams como por Email:

```yaml
jobs:
  deploy:
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function'
      environment: 'prod'
      enable-notifications: true
      notification-type: 'all'  # Teams + Email
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
      # Teams
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
      # Email
      EMAIL_TO: ${{ secrets.EMAIL_TO }}
      SMTP_SERVER: ${{ secrets.SMTP_SERVER }}
      SMTP_USERNAME: ${{ secrets.SMTP_USERNAME }}
      SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}
```

---

## 🎨 Formato del Email

Los emails se envían en formato HTML con:

✅ **Tema:** Estado del deployment (Success/Failure)  
✅ **Contenido:**
- Nombre de la aplicación
- Ambiente (dev/staging/prod)
- Estado del deployment
- Usuario que desplegó
- Commit SHA
- URL de la aplicación (si está disponible)
- Link al workflow en GitHub

**Ejemplo de email:**

```
Subject: ✅ Deployment Successful: my-function-prod

┌──────────────────────────────────────┐
│ ✅ Deployment Successful             │
├──────────────────────────────────────┤
│ Application: my-function-prod        │
│ Environment: prod                    │
│ Status:      Success                 │
│ Deployed by: tu-usuario              │
│ Commit:      a1b2c3d                 │
│ URL:         https://my-func.az...   │
└──────────────────────────────────────┘

View Workflow Run: https://github.com/...
```

---

## ⚠️ Troubleshooting

### Error: "Authentication failed"

**Problema:** Las credenciales SMTP son incorrectas.

**Solución:**
1. Verifica que el usuario y contraseña sean correctos
2. Si usas Gmail, asegúrate de usar una App Password
3. Verifica que el 2FA esté habilitado

### Error: "Connection refused"

**Problema:** El servidor SMTP no es accesible.

**Solución:**
1. Verifica el nombre del servidor SMTP
2. Verifica el puerto (587 es el estándar para STARTTLS)
3. Verifica que tu firewall permita conexiones salientes

### Email no llega

**Problema:** El email se envía pero no llega.

**Solución:**
1. Revisa la carpeta de Spam
2. Verifica que el email destinatario sea correcto
3. Si usas SES, verifica que el email esté verificado

### Error: "SSL/TLS error"

**Problema:** Problemas con la conexión segura.

**Solución:**
- El puerto 587 usa STARTTLS (recomendado)
- El puerto 465 usa SSL directo
- Verifica que estés usando el puerto correcto

---

## 🔒 Seguridad

### ✅ Mejores Prácticas:

1. **NUNCA** commitees credenciales SMTP en el código
2. Usa siempre GitHub Secrets para almacenar credenciales
3. Usa App Passwords cuando sea posible (Gmail, Outlook)
4. Rota las contraseñas regularmente
5. Usa proveedores SMTP confiables (SendGrid, SES)
6. Habilita 2FA en tu cuenta de email

### ⚠️ Evita:

- Usar tu contraseña principal de email
- Compartir las credenciales SMTP
- Usar servidores SMTP sin cifrado
- Dejar contraseñas en logs o outputs

---

Para más ayuda, consulta [USAGE.md](USAGE.md) o abre un issue.
