// server.js — Subscribe + Blog Notification backend for the DataForge portfolio site.
//
// Responsibilities:
//   1. POST /api/subscribe          -> store { fullName, email, subscribedAt } in SQLite
//   2. GET  /api/subscribers        -> (admin) list all subscribers
//   3. POST /api/notify-new-post    -> (admin) email every subscriber about a new blog post
//   4. GET  /api/health             -> health check
//
// This is a standalone Node service, meant to be deployed separately from the static
// site (Render, Railway, Fly.io, a VPS, etc). GitHub Pages / static hosting cannot run
// this file directly — see README.md in this folder for deployment steps.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------
const db = new Database(path.join(__dirname, 'subscribers.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    subscribed_at TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT,
    sent_at TEXT NOT NULL,
    recipient_count INTEGER NOT NULL
  );
`);

// ---------------------------------------------------------------------------
// Mailer setup — configure via environment variables (see .env.example)
// ---------------------------------------------------------------------------
function buildTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized. Set x-admin-token header to match ADMIN_TOKEN.' });
  }
  next();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Public: subscribe to the newsletter
app.post('/api/subscribe', (req, res) => {
  const { fullName, email } = req.body || {};

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    return res.status(400).json({ error: 'A valid full name is required.' });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const subscribedAt = new Date().toISOString();

  try {
    const stmt = db.prepare(
      'INSERT INTO subscribers (full_name, email, subscribed_at) VALUES (?, ?, ?)'
    );
    const info = stmt.run(fullName.trim(), email.trim().toLowerCase(), subscribedAt);
    return res.status(201).json({
      id: info.lastInsertRowid,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      subscribedAt
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(200).json({ message: 'Already subscribed.', email: email.trim().toLowerCase() });
    }
    console.error(err);
    return res.status(500).json({ error: 'Could not save subscription.' });
  }
});

// Admin: list subscribers (full name, email, timestamp)
app.get('/api/subscribers', requireAdmin, (req, res) => {
  const rows = db.prepare(
    'SELECT id, full_name AS fullName, email, subscribed_at AS subscribedAt, active FROM subscribers ORDER BY subscribed_at DESC'
  ).all();
  res.json({ count: rows.length, subscribers: rows });
});

// Admin: notify all active subscribers about a new blog post
app.post('/api/notify-new-post', requireAdmin, async (req, res) => {
  const { title, url, excerpt } = req.body || {};
  if (!title || !url) {
    return res.status(400).json({ error: 'title and url are required.' });
  }

  const subscribers = db.prepare(
    'SELECT full_name AS fullName, email FROM subscribers WHERE active = 1'
  ).all();

  if (subscribers.length === 0) {
    return res.status(200).json({ message: 'No active subscribers to notify.', recipientCount: 0 });
  }

  const transporter = buildTransport();
  if (!transporter) {
    return res.status(500).json({
      error: 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in your environment (see .env.example).'
    });
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  let sent = 0;

  for (const sub of subscribers) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: sub.email,
        subject: `New on Engineering Dispatch: ${title}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
            <p>Hi ${sub.fullName.split(' ')[0]},</p>
            <p>A new article just published on Victor Kipruto Rop's Engineering Dispatch:</p>
            <h2 style="margin: 1rem 0 0.5rem;">${title}</h2>
            ${excerpt ? `<p style="color:#555;">${excerpt}</p>` : ''}
            <p><a href="${url}" style="color:#FF4D1C; font-weight:600;">Read the full article &rarr;</a></p>
            <hr style="margin: 2rem 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 0.8rem; color: #999;">You're receiving this because you subscribed to Engineering Dispatch.</p>
          </div>
        `
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${sub.email}:`, err.message);
    }
  }

  db.prepare(
    'INSERT INTO notifications (title, url, sent_at, recipient_count) VALUES (?, ?, ?, ?)'
  ).run(title, url, new Date().toISOString(), sent);

  res.json({ message: 'Notification sent.', recipientCount: sent, totalSubscribers: subscribers.length });
});

app.listen(PORT, () => {
  console.log(`Subscribe/notify backend running on port ${PORT}`);
});
