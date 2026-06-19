import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = path.join(__dirname, '../../sorteo.db');

export const db = new sqlite3.Database(databasePath);
export const dbRun = promisify(db.run.bind(db));
export const dbGet = promisify(db.get.bind(db));
export const dbAll = promisify(db.all.bind(db));

export async function initDb() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      recibo TEXT,
      usado INTEGER DEFAULT 0,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const columns = await dbAll(`PRAGMA table_info(tickets)`);
  const names = columns.map((column: any) => column.name);

  if (!names.includes('recibo')) {
    await dbRun('ALTER TABLE tickets ADD COLUMN recibo TEXT');
  }
  if (!names.includes('nombre')) {
    await dbRun('ALTER TABLE tickets ADD COLUMN nombre TEXT');
  }
  if (!names.includes('email')) {
    await dbRun('ALTER TABLE tickets ADD COLUMN email TEXT');
  }
  if (!names.includes('telefono')) {
    await dbRun('ALTER TABLE tickets ADD COLUMN telefono TEXT');
  }
  if (!names.includes('usado')) {
    await dbRun('ALTER TABLE tickets ADD COLUMN usado INTEGER DEFAULT 0');
  }
  if (!names.includes('fecha_creacion')) {
    await dbRun('ALTER TABLE tickets ADD COLUMN fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP');
  }

  await dbRun('CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_recibo ON tickets(recibo)');
}
