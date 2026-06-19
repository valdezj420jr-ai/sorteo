import { getTicket } from '~/lib/ticket-service.js';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const ticket = String(url.searchParams.get('ticket') || '').trim();

  if (!ticket) {
    return jsonResponse({ error: 'Falta el ticket' }, 400);
  }

  try {
    const record = await getTicket(ticket);
    if (!record) {
      return jsonResponse({ error: 'Ticket inválido' }, 404);
    }
    return jsonResponse({ success: true, ticket: record });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Error desconocido' }, 500);
  }
}
