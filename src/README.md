# Notify Deployment Action

A JavaScript GitHub Action to send deployment notifications to Microsoft Teams and Email.

## Inputs
- `notification-type`: `teams`, `email`, or `all`. Default `teams`.
- `webhook-url`: Teams Incoming Webhook URL.
- `email-to`: Recipient email address.
- `email-from`: Sender email address. Default `noreply@azure-deployments.com`.
- `smtp-server`: SMTP server hostname.
- `smtp-port`: SMTP port, default `587`.
- `smtp-username`: SMTP username.
- `smtp-password`: SMTP password.
- `environment`: Target environment (e.g., `dev`, `prod`).
- `status`: `success` or `failure`.
- `deployment-url`: Optional URL of the deployed app.
- `app-name`: Name of the deployed application.
- `additional-info`: Optional extra information.

## Usage (local action)
```yaml
- name: Notify Deployment
  uses: ./.github/actions/notify-deployment
  with:
    notification-type: teams
    webhook-url: ${{ secrets.TEAMS_WEBHOOK_URL }}
    environment: prod
    status: success
    app-name: my-app
    deployment-url: https://my-app.example.com
```

## Setup
Install project dependencies from the workspace root:

```bash
npm install
```

All GitHub Actions in `.github/actions/` can directly reference this shared module via `../../src/index.js`.

## Notes
- Teams notifications use the MessageCard (Office 365 Connector) schema.
- Email notifications require a reachable SMTP server and credentials if needed.
- All logic is centralized in `src/` for easy reuse and maintenance across multiple workflows and actions.
