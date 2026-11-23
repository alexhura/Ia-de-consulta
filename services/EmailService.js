// Desarrollado por: Ing. Alejandro Huerta — https://alejandrohr.com
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

// Logo oficial servido desde los assets estáticos del Worker.
// Se usa en todos los correos (encabezado) para reforzar la marca ADL.
const LOGO_URL = `${config.appUrl}/assets/images/adl-icon.png`;

// Encabezado del correo: logo ADL a la izquierda y el título a la derecha,
// ambos DENTRO de la misma franja naranja (degradado sutil, acabado
// profesional). Se usa una tabla de dos columnas para que se apilen bien en
// pantallas angostas.
function emailHeader(heading) {
  return `
          <tr>
            <td style="background-color:#f97316;background-image:linear-gradient(135deg,#ff9b26 0%,#ff7f00 55%,#f05100 100%);padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
                <tr>
                  <td align="left" valign="middle" style="padding-right:16px;">
                    <img src="${LOGO_URL}" width="72" height="67" alt="ADL" style="display:block;border:0;">
                  </td>
                  <td align="right" valign="middle">
                    <div style="color:#ffffff;font-size:22px;font-weight:bold;line-height:1.2;">${heading}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

// Quita un "ticket"/"request" inicial del título cuando este ya lo trae, para
// evitar que la palabra se repita en el asunto y en el cuerpo del correo
// (p. ej. el título de la tarea ya es "Ticket #12 ...").
function cleanLabel(title) {
  return String(title || '').trim().replace(/^(ticket|request)\s*[:#-]?\s*/i, '');
}

// Correo de aviso cuando se finaliza una tarea "Dominio" (Google Notification).
// HTML con fondo blanco, acentos naranjas y texto negro, con botón para
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
          ${emailHeader('¡Proyecto finalizado!')}
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
                    <a href="${esc(shareLink)}" style="display:inline-block;background-color:#ff7f00;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:8px;">Compartir enlace del perfil de Google</a>
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

// Correo de aviso cuando se finaliza una tarea "Dominio" (Redes sociales).
// Pide compartir los enlaces de redes sociales (Facebook e Instagram)
// en lugar del perfil de Google.
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
          ${emailHeader('¡Proyecto finalizado!')}
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
                    <a href="${esc(shareLink)}" style="display:inline-block;background-color:#ff7f00;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:8px;">Compartir enlaces de Facebook e Instagram</a>
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

// Direcciones fijas de Cc para entrega y vinculación exitosa (desarrollo y adl).
const DELIVERY_CC = [
  process.env.BREVO_HANDOVER_CC || 'adldigital00@gmail.com',
  process.env.BREVO_DEV_EMAIL || 'desarrollo.academiadelimpieza@gmail.com'
];

// Corpus genérico para notificar que la vinculación (Google o redes sociales)
// ya se completó con éxito. Se envía cuando la tarea creada al compartir los
// enlaces llega a "Finalizado sin errores". Incluye copia fija a desarrollo y adl.
function buildLinkedHtml(label, { to, client, business, url, shareLink, cc = DELIVERY_CC }) {
  const subject = `¡${label} vinculado con éxito!`;
  const site = url && /^https?:\/\//i.test(url) ? url : (url ? `https://${url}` : '');
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:14px;border-collapse:separate;border-spacing:0;overflow:hidden;">
          ${emailHeader('Vinculación exitosa')}
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
  return send({ to, subject, html, cc });
}

// Aviso de que el perfil de Google quedó vinculado (con copia a desarrollo y adl).
function sendProjectLinked({ to, client, business, url, shareLink, cc }) {
  return buildLinkedHtml('perfil de Google', { to, client, business, url, shareLink, cc });
}

// Aviso de que los enlaces de redes sociales (Facebook/Instagram) quedaron vinculados (con copia a desarrollo y adl).
function sendProjectLinkedFb({ to, client, business, url, shareLink, cc }) {
  return buildLinkedHtml('perfil de Facebook e Instagram', { to, client, business, url, shareLink, cc });
}

// Cc fijo para el correo de resolución de tickets.
const TICKET_CC = [
  process.env.BREVO_HANDOVER_CC || 'adldigital00@gmail.com',
  process.env.BREVO_DEV_EMAIL || 'desarrollo.academiadelimpieza@gmail.com',
  process.env.BREVO_HELP_EMAIL || 'help.academiadelimpieza@gmail.com'
];

// Convierte texto plano (o con posibles <br>) a HTML con párrafos y saltos de línea sin mostrar etiquetas en texto.
function textToHtml(text) {
  return String(text || '').trim()
    .replace(/<br\s*[\/]?>/gi, '\n')
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#000000;">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// Genera el subject para tareas de entrega ("Your Website Is Now Live! — Cliente — Negocio")
function formatLiveSubject(client, business) {
  const c = String(client || '').trim();
  const b = String(business || '').trim();
  const parts = [];
  if (c) parts.push(c);
  if (b && b.toLowerCase() !== c.toLowerCase()) {
    parts.push(b);
  } else if (b && !c) {
    parts.push(b);
  }
  const scope = parts.join(' — ');
  return scope ? `Your Website Is Now Live! — ${scope}` : 'Your Website Is Now Live!';
}

// Detecta si el título de una tarea corresponde a entrega de sitio ("One page", "Full web", etc.)
function isWebsiteDeliveryTitle(title) {
  const norm = String(title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return norm.includes('onepage') || norm.includes('fullweb') || /one\s*page/i.test(title) || /full\s*web/i.test(title);
}

// Correo de resolución al cliente: solo resume la tarea/ticket y cómo se
// resolvió. Dirigido siempre al cliente (a sus múltiples emails), con copia a
// ADL y al equipo de ayuda. El resumen (summary) lo genera el asistente.
// Si la tarea es de tipo "One page", "Full web", etc., el subject se adapta a
// "Your Website Is Now Live! — Cliente — Negocio".
function sendTicketResolved({ to, client, business, ticketTitle, summary, isTicket = true }) {
  const clean = cleanLabel(ticketTitle);
  let subject;
  let heading;
  let label;

  if (isWebsiteDeliveryTitle(ticketTitle)) {
    subject = formatLiveSubject(client, business);
    heading = 'Your Website Is Now Live!';
    label = 'Website';
  } else {
    const parts = [clean || ticketTitle || (isTicket ? 'Ticket' : 'Request')];
    if (client) parts.push(client);
    if (business && business !== client) parts.push(business);
    const details = parts.filter(Boolean).join(' — ');

    subject = isTicket
      ? `Your Support Ticket Has Been Resolved — ${details}`
      : `Your Request Has Been Resolved — ${details}`;
    heading = isTicket ? 'Your Support Ticket Has Been Resolved' : 'Your Request Has Been Resolved';
    label = isTicket ? 'Ticket' : 'Request';
  }
  const cc = TICKET_CC;
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:14px;border-collapse:separate;border-spacing:0;overflow:hidden;">
          ${emailHeader(heading)}
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${label}: ${esc(clean || ticketTitle || '—')}</p>
              ${(client || business) ? `<p style="margin:0 0 20px;font-size:14px;color:#374151;">${client ? `<strong>Client:</strong> ${esc(client)}` : ''}${client && business ? ' &nbsp;|&nbsp; ' : ''}${business ? `<strong>Business:</strong> ${esc(business)}` : ''}</p>` : ''}
              ${summary ? textToHtml(summary) : '<p style="margin:0 0 16px;font-size:16px;color:#000000;">Your request has been resolved.</p>'}
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
  return send({ to, subject, html, cc });
}

// Correo de entrega formal al cliente cuando la tarea ("Entrega y Revision", "One page", "Full web", etc.)
// llega a "Finalizado sin errores". Menciona que el sitio web ya está listo y
// que se hace la entrega formal con la URL. Redacción en inglés US, sin
// mencionar el área de desarrollo — la agencia es ADL. CC siempre a adldigital00 y desarrollo.
function sendProjectDelivered({ to, client, business, url }) {
  const subject = formatLiveSubject(client, business);
  const site = url && /^https?:\/\//i.test(url) ? url : (url ? `https://${url}` : '');
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:14px;border-collapse:separate;border-spacing:0;overflow:hidden;">
          ${emailHeader('Your Website Is Now Live!')}
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hello,</p>
              <p style="margin:0 0 24px;font-size:18px;line-height:1.7;color:#000000;">
                <strong style="color:#b45309;">${esc(business || client)}</strong> is now Live!
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#000000;">
                We are excited to let you know that your website has been completed
                and is officially live.
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

// Correo de alerta de seguridad cuando se detecta un intento de inicio de sesión
// con credenciales válidas mientras ya existe una sesión activa en otro dispositivo.
function sendLoginAttemptAlert({ to, user, cc, timestamp = new Date() }) {
  const name = user.fullName || user.username || 'Usuario';
  const subject = `Alerta de seguridad: Intento de inicio de sesión detectado (${name})`;

  const timeFormatted = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'America/Mexico_City'
  }).format(timestamp instanceof Date ? timestamp : new Date(timestamp));

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:14px;border-collapse:separate;border-spacing:0;overflow:hidden;">
          ${emailHeader('Alerta de seguridad')}
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;font-weight:bold;color:#000000;">
                Hola ${esc(name)},
              </p>
              <div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:6px;margin:0 0 24px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#991b1b;font-weight:bold;">
                  Se ha detectado e impedido un intento de inicio de sesión en tu cuenta.
                </p>
              </div>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#000000;">
                Alguien ingresó correctamente tu usuario y contraseña desde otro navegador o dispositivo mientras ya tenías una sesión activa. Con base en las políticas de seguridad de la plataforma, <strong>el nuevo acceso fue bloqueado automáticamente</strong> para proteger tu sesión abierta.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0 24px;">
                <tr>
                  <td style="padding:6px 12px;font-size:14px;color:#4b5563;width:140px;"><strong>Usuario:</strong></td>
                  <td style="padding:6px 12px;font-size:14px;color:#000000;font-weight:bold;">${esc(user.username)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px;font-size:14px;color:#4b5563;"><strong>Nombre:</strong></td>
                  <td style="padding:6px 12px;font-size:14px;color:#000000;">${esc(user.fullName || '—')}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px;font-size:14px;color:#4b5563;"><strong>Rol:</strong></td>
                  <td style="padding:6px 12px;font-size:14px;color:#000000;">${esc(user.role || '—')}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px;font-size:14px;color:#4b5563;"><strong>Fecha y hora:</strong></td>
                  <td style="padding:6px 12px;font-size:14px;color:#000000;">${esc(timeFormatted)} (CDMX)</td>
                </tr>
              </table>
              <div style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:0 0 24px;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#92400e;">
                  ¿No fuiste tú?
                </p>
                <p style="margin:0;font-size:13px;line-height:1.5;color:#b45309;">
                  Si no reconoces este intento, te recomendamos cambiar tu contraseña de inmediato desde el panel de usuario o comunicarte con el administrador del sistema para revisar la seguridad de tu cuenta.
                </p>
              </div>
              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;">
                Este es un mensaje automático de seguridad generado por el sistema de IA Consulta.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return send({ to, subject, html, cc });
}

export const emailService = {
  send,
  configured,
  sender,
  sendProjectFinished,
  sendProjectFinishedFb,
  sendProjectLinked,
  sendProjectLinkedFb,
  sendProjectDelivered,
  sendTicketResolved,
  sendLoginAttemptAlert
};
