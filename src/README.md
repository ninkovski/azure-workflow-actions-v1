# Notify Deployment Action

A JavaScript GitHub Action to send email notifications about deployment status.

## Inputs
- `environment`: Target environment (dev, staging, prod) - Required
- `status`: Deployment status (success, failure) - Required
- `deployment-url`: Optional URL of the deployed app
- `repository-name`: Optional repository name (auto-detected from context if not provided)
- `additional-info`: Optional extra information

**App Name:** Auto-generated as `repository-name-environment`

## Usage (local action)
```yaml
- name: Notify Deployment
  uses: ./.github/actions/notify-deployment
  env:
    EMAIL_TO: ${{ secrets.EMAIL_TO }}
    SMTP_SERVER: ${{ secrets.SMTP_SERVER }}
    SMTP_USERNAME: ${{ secrets.SMTP_USERNAME }}
    SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}
  with:
    environment: prod
    status: success
    deployment-url: https://my-app.azurewebsites.net
```

## Configuration

The SMTP secrets must be configured **once** in the `azure-workflow-actions` repository (Settings → Secrets → Actions):

- `EMAIL_TO` - Recipient email address
- `EMAIL_FROM` - Sender email address (optional, defaults to noreply@azure-deployments.com)
- `SMTP_SERVER` - SMTP server hostname (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (optional, defaults to 587)
- `SMTP_USERNAME` - SMTP authentication username
- `SMTP_PASSWORD` - SMTP authentication password

Consumer projects don't need to configure any email secrets.

## Setup
Install project dependencies from the workspace root:

```bash
npm install
```

All GitHub Actions in `.github/actions/` can directly reference this shared module via `../../src/index.js`.

## Notes
- Email notifications require valid SMTP credentials configured in this repository.
- Supports common SMTP providers: Gmail, Office 365, SendGrid, etc.
- All logic is centralized in `src/` for easy reuse and maintenance across multiple workflows and actions.
