# Ejemplos de Uso

## 📑 Índice

1. [Ejemplo Básico - Azure Function](#ejemplo-1-azure-function-básica)
2. [Ejemplo con Múltiples Ambientes](#ejemplo-2-múltiples-ambientes)
3. [Ejemplo con Aprobación Manual](#ejemplo-3-aprobación-manual-para-producción)
4. [Ejemplo con Slots](#ejemplo-4-deployment-con-slots)
5. [Ejemplo Spring Boot API](#ejemplo-5-spring-boot-api)
6. [Ejemplo con Gradle](#ejemplo-6-spring-boot-con-gradle)
7. [Ejemplo Blue-Green Deployment](#ejemplo-7-blue-green-deployment)
8. [Ejemplo con Rollback](#ejemplo-8-rollback-automático)

---

## Ejemplo 1: Azure Function Básica

Deploy simple de una Azure Function a ambiente de desarrollo.

```yaml
name: Deploy Function - Simple

on:
  push:
    branches: [develop]

jobs:
  deploy:
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-dev'
      resource-group: 'my-rg-dev'
      environment: 'dev'
      package-path: './function-process-payment'
      node-version: '18.x'
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

---

## Ejemplo 2: Múltiples Ambientes

Deploy a diferentes ambientes según la rama.

```yaml
name: Deploy Function - Multi Environment

on:
  push:
    branches: [develop, staging, main]
  pull_request:
    branches: [main]

jobs:
  # Development - auto deploy on push to develop
  deploy-dev:
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-dev'
      resource-group: 'my-rg-dev'
      environment: 'dev'
      create-release-on-success: true  # Crea release después de deploy exitoso
      enable-notifications: true
      notification-type: 'teams'
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS_DEV }}
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}

  # Staging - auto deploy on push to staging
  deploy-staging:
    if: github.ref == 'refs/heads/staging' && github.event_name == 'push'
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-staging'
      resource-group: 'my-rg-staging'
      environment: 'staging'
      create-release-on-success: true
      enable-notifications: true
      notification-type: 'all'  # Teams y Slack
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS_STAGING }}
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}

  # Production - auto deploy on push to main
  deploy-prod:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-prod'
      resource-group: 'my-rg-prod'
      environment: 'prod'
      create-release-on-success: true
      enable-notifications: true
      notification-type: 'all'
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS_PROD }}
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
```

---

## Ejemplo 3: Aprobación Manual para Producción

Requiere aprobación antes de desplegar a producción.

```yaml
name: Deploy with Approval

on:
  push:
    branches: [main]

jobs:
  # Test first
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18.x'
      - run: npm ci
      - run: npm test

  # Deploy to staging automatically
  deploy-staging:
    needs: test
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-staging'
      resource-group: 'my-rg-staging'
      environment: 'staging'
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}

  # Wait for approval before production
  approve-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: prod-approval  # Este environment debe tener reviewers configurados
    steps:
      - name: Wait for approval
        run: echo "Waiting for manual approval..."

  # Deploy to production after approval
  deploy-production:
    needs: approve-production
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-prod'
      resource-group: 'my-rg-prod'
      environment: 'prod'
      create-release-on-success: true
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS_PROD }}
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
```

---

## Ejemplo 4: Deployment con Slots

Deploy a un slot primero, luego swap a producción.

```yaml
name: Deploy with Slots

on:
  push:
    branches: [main]

jobs:
  # Deploy to staging slot
  deploy-to-slot:
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-prod'
      resource-group: 'my-rg-prod'
      environment: 'prod'
      slot-name: 'staging'  # Deploy to staging slot
      enable-notifications: true
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}

  # Swap staging slot to production
  swap-to-production:
    needs: deploy-to-slot
    runs-on: ubuntu-latest
    environment: prod-approval  # Require approval for swap
    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Swap slots
        run: |
          az functionapp deployment slot swap \
            --name my-function-prod \
            --resource-group my-rg-prod \
            --slot staging \
            --target-slot production

      - name: Notify swap success
        uses: YOUR-ORG/azure-workflow-actions/.github/actions/notify-deployment@main
        with:
          notification-type: 'teams'
          webhook-url: ${{ secrets.TEAMS_WEBHOOK_URL }}
          environment: 'prod'
          status: 'success'
          app-name: 'my-function-prod'
          additional-info: 'Slot swap completed successfully'
```

---

## Ejemplo 5: Spring Boot API

Deploy de una API Spring Boot con Maven.

```yaml
name: Deploy Spring API

on:
  push:
    branches: [develop, main]

jobs:
  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-spring-api.yml@main
    with:
      app-name: 'my-api-dev'
      resource-group: 'my-rg-dev'
      package-path: './target/my-api-*.jar'
      environment: 'dev'
      java-version: '17'
      build-tool: 'maven'
      run-tests: true
      create-release-on-success: true
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-spring-api.yml@main
    with:
      app-name: 'my-api-prod'
      resource-group: 'my-rg-prod'
      package-path: './target/my-api-*.jar'
      environment: 'prod'
      java-version: '17'
      build-tool: 'maven'
      run-tests: true
      create-release-on-success: true
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS_PROD }}
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
```

---

## Ejemplo 6: Spring Boot con Gradle

Deploy de una API Spring Boot usando Gradle.

```yaml
name: Deploy Spring API (Gradle)

on:
  push:
    branches: [main]

jobs:
  deploy:
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-spring-api.yml@main
    with:
      app-name: 'my-gradle-api'
      resource-group: 'my-rg'
      package-path: './build/libs/my-api-*.jar'
      environment: 'prod'
      java-version: '17'
      build-tool: 'gradle'  # Usa Gradle en lugar de Maven
      run-tests: true
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

---

## Ejemplo 7: Blue-Green Deployment

Estrategia blue-green usando slots.

```yaml
name: Blue-Green Deployment

on:
  push:
    branches: [main]

jobs:
  # Deploy to green (staging) slot
  deploy-green:
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-prod'
      resource-group: 'my-rg-prod'
      environment: 'prod'
      slot-name: 'green'
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}

  # Run smoke tests on green slot
  smoke-tests:
    needs: deploy-green
    runs-on: ubuntu-latest
    steps:
      - name: Run smoke tests
        run: |
          # Test green slot
          curl https://my-function-prod-green.azurewebsites.net/api/health
          # Add more tests...

  # Swap if tests pass
  swap-slots:
    needs: smoke-tests
    runs-on: ubuntu-latest
    steps:
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Swap green to production
        run: |
          az functionapp deployment slot swap \
            --name my-function-prod \
            --resource-group my-rg-prod \
            --slot green \
            --target-slot production

  # Create release after successful swap
  create-release:
    needs: swap-slots
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/promote-to-release.yml@main
    with:
      source-environment: 'prod'
      prerelease: false
```

---

## Ejemplo 8: Rollback Automático

Rollback automático si fallan health checks.

```yaml
name: Deploy with Auto Rollback

on:
  push:
    branches: [main]

jobs:
  # Deploy to staging slot
  deploy:
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: 'my-function-prod'
      resource-group: 'my-rg-prod'
      environment: 'prod'
      slot-name: 'staging'
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}

  # Health check
  health-check:
    needs: deploy
    runs-on: ubuntu-latest
    outputs:
      health-status: ${{ steps.check.outputs.status }}
    steps:
      - name: Wait for warm-up
        run: sleep 30

      - name: Check health
        id: check
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            https://my-function-prod-staging.azurewebsites.net/api/health)
          
          if [ $STATUS -eq 200 ]; then
            echo "status=healthy" >> $GITHUB_OUTPUT
          else
            echo "status=unhealthy" >> $GITHUB_OUTPUT
            exit 1
          fi

  # Swap if healthy
  swap-slots:
    needs: health-check
    if: needs.health-check.outputs.health-status == 'healthy'
    runs-on: ubuntu-latest
    steps:
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Swap to production
        run: |
          az functionapp deployment slot swap \
            --name my-function-prod \
            --resource-group my-rg-prod \
            --slot staging

  # Rollback if unhealthy
  rollback:
    needs: health-check
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Delete bad deployment
        run: |
          echo "Health check failed - rolling back"
          az functionapp deployment slot delete \
            --name my-function-prod \
            --resource-group my-rg-prod \
            --slot staging

      - name: Notify failure
        uses: YOUR-ORG/azure-workflow-actions/.github/actions/notify-deployment@main
        with:
          notification-type: 'teams'
          webhook-url: ${{ secrets.TEAMS_WEBHOOK_URL }}
          environment: 'prod'
          status: 'failure'
          app-name: 'my-function-prod'
          additional-info: '❌ Deployment rolled back due to failed health checks'
```

---

## 🎯 Ejemplo Completo: Function con Todo

Combina todos los features:

```yaml
name: Complete Function Deployment

on:
  push:
    branches: [develop, staging, main]
  workflow_dispatch:  # Manual trigger

jobs:
  # Determine environment
  setup:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.set-env.outputs.environment }}
      function-name: ${{ steps.set-env.outputs.function-name }}
      resource-group: ${{ steps.set-env.outputs.resource-group }}
    steps:
      - id: set-env
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "environment=prod" >> $GITHUB_OUTPUT
            echo "function-name=my-function-prod" >> $GITHUB_OUTPUT
            echo "resource-group=my-rg-prod" >> $GITHUB_OUTPUT
          elif [ "${{ github.ref }}" == "refs/heads/staging" ]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "function-name=my-function-staging" >> $GITHUB_OUTPUT
            echo "resource-group=my-rg-staging" >> $GITHUB_OUTPUT
          else
            echo "environment=dev" >> $GITHUB_OUTPUT
            echo "function-name=my-function-dev" >> $GITHUB_OUTPUT
            echo "resource-group=my-rg-dev" >> $GITHUB_OUTPUT
          fi

  # Deploy
  deploy:
    needs: setup
    uses: YOUR-ORG/azure-workflow-actions/.github/workflows/deploy-function.yml@main
    with:
      function-app-name: ${{ needs.setup.outputs.function-name }}
      resource-group: ${{ needs.setup.outputs.resource-group }}
      environment: ${{ needs.setup.outputs.environment }}
      run-tests: true
      enable-notifications: true
      notification-type: 'teams'
      create-release-on-success: ${{ needs.setup.outputs.environment == 'dev' }}
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
      NOTIFICATION_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
```

---

## 📚 Más Recursos

- Ver [USAGE.md](USAGE.md) para documentación completa
- Ver [README.md](README.md) para quick start
- Abre un issue para más ejemplos

---

**¡Happy Deploying! 🚀**
