import { getAdminSummary } from '~/lib/ticket-service.js';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const prerender = false;

export async function GET() {
  try {
    const summary = await getAdminSummary();
    return jsonResponse({ success: true, summary });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Error desconocido' }, 500);
  }
}
