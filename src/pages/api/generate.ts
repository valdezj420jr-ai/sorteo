import crypto from 'crypto';
import QRCode from 'qrcode';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const prerender = false;

function createParticipationCode() {
  return `COD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function POST({ request, url }) {
  const body = await request.json();
  const label = String(body.label || '').trim();
  const code = createParticipationCode();
  const link = `${url.origin}/participar?ticket=${encodeURIComponent(code)}`;
  const qr = await QRCode.toDataURL(link, { width: 280 });

  return jsonResponse({ label: label || 'Código de participación', code, link, qr });
}
