const core = require('@actions/core');
const nodemailer = require('nodemailer');

function resolveStatus(status) {
  const ok = String(status || '').toLowerCase() === 'success';
  return ok
    ? { color: '28a745', emoji: '✅', text: 'Success' }
    : { color: 'dc3545', emoji: '❌', text: 'Failed' };
}

async function sendEmail({
  statusInfo,
  environment,
  appName,
  deploymentUrl,
  additionalInfo,
  githubContext
}) {
  // Leer secretos configurados en el repositorio azure-workflow-actions
  const emailTo = process.env['EMAIL_TO'];
  const emailFrom = process.env['EMAIL_FROM'] || 'noreply@azure-deployments.com';
  const smtpServer = process.env['SMTP_SERVER'];
  const smtpPort = process.env['SMTP_PORT'] || '587';
  const smtpUsername = process.env['SMTP_USERNAME'];
  const smtpPassword = process.env['SMTP_PASSWORD'];

  if (!emailTo || !smtpServer) {
    core.warning('Email configuration incomplete. Need EMAIL_TO and SMTP_SERVER secrets configured in azure-workflow-actions repository.');
    return;
  }

  const subject = `${statusInfo.emoji} Deployment ${statusInfo.text}: ${appName} [${environment}]`;

  const rows = [
    { label: 'Application:', value: appName },
    { label: 'Environment:', value: environment },
    { label: 'Status:', value: statusInfo.text },
    { label: 'Deployed by:', value: githubContext.actor },
    { label: 'Commit:', value: githubContext.sha.substring(0, 7) }
  ];
  if (deploymentUrl) {
    rows.push({ label: 'URL:', value: `<a href="${deploymentUrl}">${deploymentUrl}</a>` });
  }

  const tableRows = rows
    .map((r, idx) => {
      const alt = idx % 2 === 1 ? " style='background-color: #f5f5f5;'" : '';
      return `<tr${alt}><td style='padding: 8px; font-weight: bold;'>${r.label}</td><td style='padding: 8px;'>${r.value}</td></tr>`;
    })
    .join('');

  const addl = additionalInfo ? `<p><strong>Additional Info:</strong><br/>${additionalInfo}</p>` : '';

  const html = `
  <html>
  <body style='font-family: Arial, sans-serif;'>
    <h2 style='color: #${statusInfo.color};'>${statusInfo.emoji} Deployment ${statusInfo.text}</h2>
    <hr/>
    <table style='width: 100%; border-collapse: collapse;'>
      ${tableRows}
    </table>
    ${addl}
    <hr/>
    <p style='font-size: 12px; color: #666;'>
      <a href='${githubContext.server_url}/${githubContext.repository}/actions/runs/${githubContext.run_id}'>View Workflow Run</a>
    </p>
  </body>
  </html>`;

  const secure = Number(smtpPort) === 465;
  const transporter = nodemailer.createTransport({
    host: smtpServer,
    port: Number(smtpPort),
    secure,
    auth: smtpUsername && smtpPassword ? { user: smtpUsername, pass: smtpPassword } : undefined
  });

  await transporter.sendMail({
    from: emailFrom,
    to: emailTo,
    subject,
    html
  });

  core.info(`✅ Email notification sent to ${emailTo}`);
}

async function run() {
  try {
    const environment = core.getInput('environment', { required: true });
    const status = core.getInput('status', { required: true });
    const deploymentUrl = core.getInput('deployment-url');
    const repositoryName = core.getInput('repository-name');
    const additionalInfo = core.getInput('additional-info');

    const statusInfo = resolveStatus(status);

    const githubContext = {
      actor: process.env['GITHUB_ACTOR'] || '',
      sha: process.env['GITHUB_SHA'] || '',
      repository: process.env['GITHUB_REPOSITORY'] || '',
      run_id: process.env['GITHUB_RUN_ID'] || '',
      server_url: process.env['GITHUB_SERVER_URL'] || 'https://github.com'
    };

    // Generar app-name automáticamente: nombre-repo-ambiente
    const repoName = repositoryName || githubContext.repository.split('/')[1] || 'app';
    const appName = `${repoName}-${environment}`;

    await sendEmail({
      statusInfo,
      environment,
      appName,
      deploymentUrl,
      additionalInfo,
      githubContext
    });

    // Step summary
    core.summary
      .addHeading('Email Notification Sent :email:')
      .addList([
        `Application: ${appName}`,
        `Status: ${statusInfo.text}`,
        `Environment: ${environment}`
      ])
      .write();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
