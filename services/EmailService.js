import { config } from '../config/index.js';

const BREVO_API = 'https://api.brevo.com/v3';

// Servicio de correo transaccional vía Brevo (API REST).
// Configuración (vars de entorno del Worker):
//   BREVO_API_KEY   -> API key v3 de Brevo
//   BREVO_SENDER    -> email remitente (opcional, falla a noreply@dominio)
//   BREVO_SENDER_NAME -> nombre del remitente (opcional)
function sender() {
  return {
    name: process.env.BREVO_SENDER_NAME || 'IA Consulta',
    email: process.env.BREVO_SENDER || 'no-reply@ia-consulta.alejandro-c79.workers.dev'
  };
}

function configured() {
  return !!(process.env.BREVO_API_KEY);
}

// Envía un correo HTML transaccional.
// Params: { to: 'a@b.com', subject, html }
async function send({ to, subject, html }) {
  if (!configured()) {
    console.warn('[EmailService] BREVO_API_KEY no configurada; correo no enviado:', subject);
    return { skipped: true, reason: 'no_brevo_key' };
  }
  if (!to || !to.trim()) {
    console.warn('[EmailService] Sin destinatario; correo no enviado:', subject);
    return { skipped: true, reason: 'no_recipient' };
  }

  const res = await fetch(`${BREVO_API}/smtp/email`, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      sender: sender(),
      to: [{ email: to.trim() }],
      subject,
      htmlContent: html
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Brevo error ${res.status}: ${text.slice(0, 300)}`);
  }
  return { skipped: false };
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Correo de aviso cuando se finaliza un proyecto "One page" / "Full web".
// HTML con fondo blanco, acentos azules y texto negro, con botón para
// compartir el enlace del perfil de Google.
function sendProjectFinished({ to, client, business, url, shareLink }) {
  const subject = `¡Proyecto ${business || client} finalizado!`;
  const site = url && /^https?:\/\//i.test(url) ? url : (url ? `https://${url}` : '');
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:14px;border-collapse:separate;border-spacing:0;overflow:hidden;">
          <tr>
            <td style="background-color:#1d4ed8;padding:28px 32px;">
              <div style="color:#ffffff;font-size:24px;font-weight:bold;">¡Proyecto finalizado!</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola,</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#000000;">
                El proyecto del negocio <strong style="color:#1d4ed8;">${esc(business || client)}</strong>
                del cliente <strong style="color:#1d4ed8;">${esc(client)}</strong> se ha finalizado correctamente.
              </p>
              ${site ? `<p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Sitio web:&nbsp;<a href="${esc(site)}" style="color:#2563eb;">${esc(site)}</a></p>` : ''}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 8px;">
                <tr>
                  <td align="center">
                    <a href="${esc(shareLink)}" style="display:inline-block;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:8px;">Compartir enlace del perfil de Google</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Gracias por confiar en nosotros.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return send({ to, subject, html });
}

export const emailService = { send, configured, sender, sendProjectFinished };
