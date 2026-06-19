import { registerParticipant } from '~/lib/ticket-service.js';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const prerender = false;

export async function POST({ request }) {
  const body = await request.json();
  const ticket = String(body.ticket || '').trim();
  const nombre = String(body.nombre || '').trim();
  const email = String(body.email || '').trim();
  const telefono = String(body.telefono || '').trim();

  if (!ticket || !nombre || !email || !telefono) {
    return jsonResponse({ error: 'Faltan datos obligatorios' }, 400);
  }

  try {
    await registerParticipant(ticket, nombre, email, telefono);
    return jsonResponse({ success: true, message: 'Participación registrada correctamente' });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Error desconocido' }, 400);
  }
}
