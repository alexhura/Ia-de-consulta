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
// Params: { to: 'a@b.com' | ['a@b.com','c@d.com'], subject, html, cc, fromName }
async function send({ to, subject, html, cc, fromName }) {
  if (!configured()) {
    console.warn('[EmailService] BREVO_API_KEY no configurada; correo no enviado:', subject);
    return { skipped: true, reason: 'no_brevo_key' };
  }
  const toList = Array.isArray(to) ? to : [to];
  const toValid = toList.filter(t => t && typeof t === 'string' && t.trim());
  if (toValid.length === 0) {
    console.warn('[EmailService] Sin destinatario; correo no enviado:', subject);
    return { skipped: true, reason: 'no_recipient' };
  }

  const payload = {
    sender: fromName ? { name: fromName, email: sender().email } : sender(),
    to: toValid.map(t => ({ email: t.trim() })),
    subject,
    htmlContent: html
  };
  if (cc) {
    const list = Array.isArray(cc) ? cc : [cc];
    const valid = list.filter(c => c && typeof c === 'string' && c.trim());
    if (valid.length) payload.cc = valid.map(c => ({ email: c.trim() }));
  }

  const res = await fetch(`${BREVO_API}/smtp/email`, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify(payload)
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

// Correo de aviso cuando se finaliza una tarea "Dominio". Similar al de One
// page/Full web pero pide compartir los enlaces de redes sociales
// (Facebook e Instagram) en lugar del perfil de Google.
function sendProjectFinishedFb({ to, client, business, url, shareLink }) {
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
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#000000;">
                Para completar, comparte los enlaces de tus perfiles de <strong style="color:#1d4ed8;">Facebook</strong> e <strong style="color:#1d4ed8;">Instagram</strong>.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 8px;">
                <tr>
                  <td align="center">
                    <a href="${esc(shareLink)}" style="display:inline-block;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:8px;">Compartir enlaces de Facebook e Instagram</a>
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

// Corpus genérico para notificar que la vinculación (Google o redes sociales)
// ya se completó con éxito. Se envía cuando la tarea creada al compartir los
// enlaces llega a "Finalizado sin errores".
function buildLinkedHtml(label, { to, client, business, url, shareLink }) {
  const subject = `¡${label} vinculado con éxito!`;
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
              <div style="color:#ffffff;font-size:24px;font-weight:bold;">Vinculación exitosa</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola,</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#000000;">
                Te confirmamos que tu <strong style="color:#1d4ed8;">${esc(label)}</strong>
                del negocio <strong style="color:#1d4ed8;">${esc(business || client)}</strong>
                del cliente <strong style="color:#1d4ed8;">${esc(client)}</strong> quedó <strong style="color:#1d4ed8;">vinculado con éxito</strong>.
              </p>
              ${site ? `<p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Sitio web:&nbsp;<a href="${esc(site)}" style="color:#2563eb;">${esc(site)}</a></p>` : ''}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 8px;">
                <tr>
                  <td align="center" style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:20px;">
                    <span style="font-size:34px;">✓</span>
                    <div style="font-size:16px;font-weight:bold;color:#065f46;margin-top:6px;">Vinculación exitosa</div>
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

// Aviso de que el perfil de Google quedó vinculado.
function sendProjectLinked({ to, client, business, url, shareLink }) {
  return buildLinkedHtml('perfil de Google', { to, client, business, url, shareLink });
}

// Aviso de que los enlaces de redes sociales (Facebook/Instagram) quedaron vinculados.
function sendProjectLinkedFb({ to, client, business, url, shareLink }) {
  return buildLinkedHtml('perfil de Facebook e Instagram', { to, client, business, url, shareLink });
}

// Direcciones fijas de Cc para el correo de entrega.
const DELIVERY_CC = [
  process.env.BREVO_HANDOVER_CC || 'adldigital00@gmail.com',
  process.env.BREVO_DEV_EMAIL || 'desarrollo.academiadelimpieza@gmail.com'
];

// Correo de entrega formal al cliente cuando la tarea "Entrega y Revision"
// llega a "Finalizado sin errores". Menciona que el sitio web ya está listo y
// que se hace la entrega formal con la URL. Redacción en inglés US, sin
// mencionar el área de desarrollo — la agencia es ADL. CC siempre a adldigital00.
function sendProjectDelivered({ to, client, business, url }) {
  const subject = `Your Website Is Ready for Delivery — ${business || client}`;
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
              <div style="color:#ffffff;font-size:24px;font-weight:bold;">Your Website Is Ready!</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hello,</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#000000;">
                We are excited to let you know that your website has been completed
                and is officially ready for delivery.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#000000;">
                Your new site is now live at:
              </p>
              ${site ? `<p style="margin:0 0 24px;font-size:16px;line-height:1.7;">&nbsp;&nbsp;<a href="${esc(site)}" style="color:#2563eb;">${esc(site)}</a></p>` : ''}
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#000000;">
                We will continue working together to make this website a powerful
                tool that connects you with your customers and grows alongside your
                business.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#000000;">
                If you need any adjustments, customizations, or have any questions
                about your new website, please do not hesitate to call us at
                <a href="tel:+17023285251" style="color:#2563eb;font-weight:bold;">(702) 328-5251</a>.
                We are always happy to help.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#000000;">
                We are proud to be part of ADL and to support the growth of your
                business through technology and design.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                <tr>
                  <td align="center">
                    <span style="font-size:16px;color:#000000;">Web development team</span><br>
                    <span style="font-size:14px;color:#6b7280;font-weight:600;letter-spacing:0.5px;">by ADL</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return send({ to, subject, html, cc: DELIVERY_CC });
}

export const emailService = { send, configured, sender, sendProjectFinished, sendProjectFinishedFb, sendProjectLinked, sendProjectLinkedFb, sendProjectDelivered };
