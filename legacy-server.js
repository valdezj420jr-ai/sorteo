const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const QRCode = require("qrcode");
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database(path.join(__dirname, "sorteo.db"));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      recibo TEXT,
      nombre TEXT,
      email TEXT,
      telefono TEXT,
      usado INTEGER DEFAULT 0,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.all(`PRAGMA table_info(tickets)`, (err, rows) => {
    if (err) return console.error(err);
    const columns = rows.map((row) => row.name);
    if (!columns.includes("nombre")) {
      db.run(`ALTER TABLE tickets ADD COLUMN nombre TEXT`);
    }
    if (!columns.includes("email")) {
      db.run(`ALTER TABLE tickets ADD COLUMN email TEXT`);
    }
    if (!columns.includes("telefono")) {
      db.run(`ALTER TABLE tickets ADD COLUMN telefono TEXT`);
    }
  });
});

function generarTicket(recibo) {
  const aleatorio = crypto.randomBytes(8).toString("hex");
  return `${recibo}-${aleatorio}`;
}

app.post("/generar", (req, res) => {
  const recibo = String(req.body.recibo || "").trim();
  if (!recibo) return res.status(400).json({ error: "Falta el número de recibo" });

  db.get(`SELECT id FROM tickets WHERE recibo = ?`, [recibo], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(409).json({ error: "El recibo ya existe en el sistema" });

    const id = generarTicket(recibo);
    db.run(
      `INSERT INTO tickets (id, recibo, usado) VALUES (?, ?, 0)`,
      [id, recibo],
      function (insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        const url = `${req.protocol}://${req.get("host")}/participar.html?ticket=${encodeURIComponent(id)}`;
        QRCode.toDataURL(url, { width: 300 }, (qrErr, dataUrl) => {
          if (qrErr) return res.status(500).json({ error: qrErr.message });
          res.json({ ticket: id, url, qr: dataUrl });
        });
      }
    );
  });
});

app.post("/registrar", (req, res) => {
  const ticket = String(req.body.ticket || "").trim();
  const nombre = String(req.body.nombre || "").trim();
  const email = String(req.body.correo || "").trim();
  const telefono = String(req.body.telefono || "").trim();

  if (!ticket || !nombre || !email || !telefono) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  db.get(`SELECT usado, recibo FROM tickets WHERE id = ?`, [ticket], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Ticket inválido" });
    if (row.usado) return res.status(409).json({ error: "Este ticket ya fue usado" });

    db.run(
      `UPDATE tickets SET usado = 1, nombre = ?, email = ?, telefono = ? WHERE id = ?`,
      [nombre, email, telefono, ticket],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        res.json({ success: true, mensaje: "Participación registrada correctamente" });
      }
    );
  });
});

app.post("/validar", (req, res) => {
  const ticket = req.body.ticket;
  if (!ticket) return res.status(400).json({ error: "Falta el ticket" });

  db.get(`SELECT usado FROM tickets WHERE id = ?`, [ticket], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Ticket inválido" });
    if (row.usado) return res.json({ success: false, mensaje: "Ticket ya usado" });

    db.run(`UPDATE tickets SET usado = 1 WHERE id = ?`, [ticket], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      res.json({ success: true, mensaje: "Participación registrada" });
    });
  });
});

app.get("/ticket/:id", (req, res) => {
  const id = req.params.id;
  db.get(
    `SELECT id, recibo, nombre, email, telefono, usado, fecha_creacion FROM tickets WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Ticket no encontrado" });
      res.json(row);
    }
  );
});

app.get("/admin/summary", (req, res) => {
  db.get(
    `SELECT COUNT(*) AS total, SUM(usado) AS used, SUM(CASE WHEN usado = 0 THEN 1 ELSE 0 END) AS pending FROM tickets`,
    [],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ total: row.total || 0, used: row.used || 0, pending: row.pending || 0 });
    }
  );
});

app.get("/admin/tickets", (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  db.all(
    `SELECT id, recibo, nombre, email, telefono, usado, fecha_creacion FROM tickets ORDER BY fecha_creacion DESC LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.listen(port, () => {
  console.log(`Servidor en http://localhost:${port}`);
});
