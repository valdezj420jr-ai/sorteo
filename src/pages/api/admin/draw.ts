import { drawWinner } from '~/lib/ticket-service.js';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const prerender = false;

export async function POST() {
  try {
    const winner = await drawWinner();
    if (!winner) {
      return jsonResponse({ success: false, error: 'No hay participantes registrados para el sorteo.' }, 400);
    }

    return jsonResponse({ success: true, winner });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Error desconocido' }, 500);
  }
}
