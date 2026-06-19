import crypto from 'crypto';
import { supabase } from './supabase.js';

export interface TicketRecord {
  id: string;
  recibo: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  usado: boolean;
  fecha_creacion: string;
}

function createRecordId() {
  return `reg-${crypto.randomBytes(6).toString('hex')}`;
}

function mapTicketRecord(record: any): TicketRecord {
  return {
    id: record.id,
    recibo: record.recibo,
    nombre: record.nombre,
    email: record.email,
    telefono: record.telefono,
    usado: Boolean(record.usado),
    fecha_creacion: record.created_at,
  };
}

export async function getTicket(ticket: string): Promise<TicketRecord | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, recibo, nombre, email, telefono, usado, created_at')
    .or(`recibo.eq.${ticket},id.eq.${ticket}`)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return data ? mapTicketRecord(data) : null;
}

export async function registerParticipant(ticket: string, nombre: string, email: string, telefono: string): Promise<void> {
  const { data: existingTicket, error: ticketError } = await supabase
    .from('tickets')
    .select('id')
    .eq('recibo', ticket)
    .single();

  if (ticketError && ticketError.code !== 'PGRST116') {
    throw new Error(ticketError.message);
  }
  if (existingTicket) {
    throw new Error('Este código ya fue registrado');
  }

  const { data: existingParticipant, error: participantError } = await supabase
    .from('tickets')
    .select('id')
    .or(`email.eq.${email},telefono.eq.${telefono}`)
    .single();

  if (participantError && participantError.code !== 'PGRST116') {
    throw new Error(participantError.message);
  }
  if (existingParticipant) {
    throw new Error('Ya existe un registro con este correo o teléfono');
  }

  const id = createRecordId();
  const { error } = await supabase.from('tickets').insert([
    {
      id,
      recibo: ticket,
      nombre,
      email,
      telefono,
      usado: true,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAdminSummary() {
  const { count, error: countError } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    throw new Error(countError.message);
  }

  const { data: lastRow, error: lastError } = await supabase
    .from('tickets')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lastError && lastError.code !== 'PGRST116') {
    throw new Error(lastError.message);
  }

  return {
    total: count ?? 0,
    lastRegistered: lastRow?.created_at || null,
  };
}

export async function getRegisteredParticipants(limit = 100): Promise<TicketRecord[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, recibo, nombre, email, telefono, usado, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapTicketRecord);
}

export async function deleteParticipant(id: string): Promise<void> {
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function drawWinner(): Promise<TicketRecord | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, recibo, nombre, email, telefono, usado, created_at');

  if (error) {
    throw new Error(error.message);
  }

  const entries = data || [];
  if (!entries.length) {
    return null;
  }

  const winner = entries[Math.floor(Math.random() * entries.length)];
  return mapTicketRecord(winner);
}
