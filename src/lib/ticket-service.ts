import crypto from 'crypto';
import { dbRun, dbGet, dbAll, initDb } from './db.js';

export interface TicketRecord {
  id: string;
  recibo: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  usado: number;
  fecha_creacion: string;
}

function createRecordId() {
  return `reg-${crypto.randomBytes(6).toString('hex')}`;
}

export async function getTicket(ticket: string): Promise<TicketRecord | null> {
  await initDb();
  return dbGet('SELECT * FROM tickets WHERE recibo = ? OR id = ?', ticket, ticket);
}

export async function registerParticipant(ticket: string, nombre: string, email: string, telefono: string): Promise<void> {
  await initDb();

  const existingTicket = await dbGet('SELECT id FROM tickets WHERE recibo = ?', ticket);
  if (existingTicket) {
    throw new Error('Este código ya fue registrado');
  }

  const existingParticipant = await dbGet(
    'SELECT id FROM tickets WHERE email = ? OR telefono = ?',
    email,
    telefono
  );
  if (existingParticipant) {
    throw new Error('Esta persona ya registró su participación con otro código');
  }

  const id = createRecordId();
  await dbRun(
    'INSERT INTO tickets (id, recibo, nombre, email, telefono, usado) VALUES (?, ?, ?, ?, ?, 1)',
    id,
    ticket,
    nombre,
    email,
    telefono,
    1
  );
}

export async function getAdminSummary() {
  await initDb();
  return dbGet('SELECT COUNT(*) AS total, MAX(fecha_creacion) AS lastRegistered FROM tickets');
}

export async function getRegisteredParticipants(limit = 100): Promise<TicketRecord[]> {
  await initDb();
  return dbAll('SELECT * FROM tickets ORDER BY fecha_creacion DESC LIMIT ?', limit);
}

export async function deleteParticipant(id: string): Promise<void> {
  await initDb();
  await dbRun('DELETE FROM tickets WHERE id = ?', id);
}

export async function drawWinner(): Promise<TicketRecord | null> {
  await initDb();
  return dbGet('SELECT * FROM tickets ORDER BY RANDOM() LIMIT 1');
}
