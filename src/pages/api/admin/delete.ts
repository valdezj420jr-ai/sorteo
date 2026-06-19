import { deleteParticipant } from '~/lib/ticket-service.js';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const data = await request.json();
    const id = typeof data?.id === 'string' ? data.id : null;
    if (!id) {
      return jsonResponse({ success: false, error: 'ID inválido para eliminación.' }, 400);
    }

    await deleteParticipant(id);
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Error desconocido' }, 500);
  }
}
