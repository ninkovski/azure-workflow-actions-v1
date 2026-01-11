const core = require('@actions/core');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

function resolveStatus(status) {
  const ok = String(status || '').toLowerCase() === 'success';
  return ok
    ? { color: '28a745', emoji: '✅', text: 'Success' }
    : { color: 'dc3545', emoji: '❌', text: 'Failed' };
}

async function sendTeams({ webhookUrl, statusInfo, environment, appName, deploymentUrl, additionalInfo, githubContext }) {
  if (!webhookUrl) {
    core.info('No webhook URL provided for Teams notification');
    return;
  }

  // MessageCard payload (legacy Office 365 Connector schema)
  const facts = [
    { name: 'Status:', value: statusInfo.text },
    { name: 'Environment:', value: environment },
    { name: 'Application:', value: appName },
    { name: 'Deployed by:', value: githubContext.actor },
    { name: 'Commit:', value: githubContext.sha }
  ];
  if (deploymentUrl) {
    facts.push({ name: 'URL:', value: deploymentUrl });
  }

  const payload = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: `Deployment ${statusInfo.text}`,
    themeColor: statusInfo.color,
    title: `${statusInfo.emoji} Deployment ${statusInfo.text}: ${appName}`,
    sections: [
      {
        activityTitle: `Deployment to ${environment}`,
        facts,
        text: additionalInfo || ''
      }
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'View Workflow',
        targets: [
          {
            os: 'default',
            uri: `${githubContext.server_url}/${githubContext.repository}/actions/runs/${githubContext.run_id}`
          }
        ]
      }
    ]
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Teams webhook failed: ${res.status} ${res.statusText} ${body}`);
  }

  core.info('✅ Teams notification sent');
}

async function sendEmail({
  emailTo,
  emailFrom,
  smtpServer,
  smtpPort,
  smtpUsername,
  smtpPassword,
  statusInfo,
  environment,
  appName,
  deploymentUrl,
  additionalInfo,
  githubContext
}) {
  if (!emailTo || !smtpServer) {
    core.info('Email configuration incomplete. Need email-to and smtp-server.');
    return;
  }

  const subject = `${statusInfo.emoji} Deployment ${statusInfo.text}: ${appName}`;

  const rows = [
    { label: 'Application:', value: appName },
    { label: 'Environment:', value: environment },
    { label: 'Status:', value: statusInfo.text },
    { label: 'Deployed by:', value: githubContext.actor },
    { label: 'Commit:', value: githubContext.sha }
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

  const secure = Number(smtpPort) === 465; // common SMTPS port
  const transporter = nodemailer.createTransport({
    host: smtpServer,
    port: Number(smtpPort || 587),
    secure,
    auth: smtpUsername && smtpPassword ? { user: smtpUsername, pass: smtpPassword } : undefined
  });

  await transporter.sendMail({
    from: emailFrom,
    to: emailTo,
    subject,
    html
  });

  core.info('✅ Email sent successfully');
}

async function run() {
  try {
    const notificationType = core.getInput('notification-type') || 'teams';
    const webhookUrl = core.getInput('webhook-url');
    const emailTo = core.getInput('email-to');
    const emailFrom = core.getInput('email-from') || 'noreply@azure-deployments.com';
    const smtpServer = core.getInput('smtp-server');
    const smtpPort = core.getInput('smtp-port') || '587';
    const smtpUsername = core.getInput('smtp-username');
    const smtpPassword = core.getInput('smtp-password');
    const environment = core.getInput('environment', { required: true });
    const status = core.getInput('status', { required: true });
    const deploymentUrl = core.getInput('deployment-url');
    const appName = core.getInput('app-name', { required: true });
    const additionalInfo = core.getInput('additional-info');

    const statusInfo = resolveStatus(status);

    const githubContext = {
      actor: process.env['GITHUB_ACTOR'] || '',
      sha: process.env['GITHUB_SHA'] || '',
      repository: process.env['GITHUB_REPOSITORY'] || '',
      run_id: process.env['GITHUB_RUN_ID'] || '',
      server_url: process.env['GITHUB_SERVER_URL'] || 'https://github.com'
    };

    const wantsTeams = notificationType === 'teams' || notificationType === 'all';
    const wantsEmail = notificationType === 'email' || notificationType === 'all';

    if (wantsTeams) {
      await sendTeams({
        webhookUrl,
        statusInfo,
        environment,
        appName,
        deploymentUrl,
        additionalInfo,
        githubContext
      });
    }

    if (wantsEmail) {
      await sendEmail({
        emailTo,
        emailFrom,
        smtpServer,
        smtpPort,
        smtpUsername,
        smtpPassword,
        statusInfo,
        environment,
        appName,
        deploymentUrl,
        additionalInfo,
        githubContext
      });
    }

    // Step summary
    core.summary
      .addHeading('Notification Sent :bell:')
      .addList([
        `Type: ${notificationType}`,
        `Status: ${statusInfo.text}`,
        `Environment: ${environment}`
      ])
      .write();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
