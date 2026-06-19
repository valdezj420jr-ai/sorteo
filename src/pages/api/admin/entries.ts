import { getRegisteredParticipants } from '~/lib/ticket-service.js';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const prerender = false;

export async function GET() {
  try {
    const entries = await getRegisteredParticipants();
    return jsonResponse({ success: true, entries });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Error desconocido' }, 500);
  }
}
