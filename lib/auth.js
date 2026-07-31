// lib/auth.js — Real authentication for the Ops Center.
//
// Single-admin design: this is a personal portfolio's ops panel, not a
// multi-tenant SaaS, so there is exactly one admin account (you). The
// login is still genuinely secure: bcrypt-hashed password, rate-limited
// login attempts, short-lived signed JWT sessions.

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // legacy/service token, still honored
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const SESSION_TTL = '8h';

if (!JWT_SECRET) {
  console.warn('[auth] WARNING: JWT_SECRET is not set. Ops Center login will not work until you set it in .env.');
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

async function login(req, res) {
  const { username, password } = req.body || {};

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !JWT_SECRET) {
    return res.status(500).json({
      error: 'Ops Center auth is not configured yet. Set ADMIN_USERNAME, ADMIN_PASSWORD_HASH, and JWT_SECRET in .env (run `npm run hash-password` to generate a hash).'
    });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, { expiresIn: SESSION_TTL });
  res.json({ token, expiresIn: SESSION_TTL, user: { username, role: 'admin' } });
}

// Accepts either a valid JWT session (from /api/auth/login) or the legacy
// static ADMIN_TOKEN (for scripts/curl use, e.g. notify-new-post from CI).
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  const legacyToken = req.headers['x-admin-token'];

  if (legacyToken && ADMIN_TOKEN && legacyToken === ADMIN_TOKEN) {
    req.auth = { username: 'service-token', role: 'admin' };
    return next();
  }

  if (bearer && JWT_SECRET) {
    try {
      const payload = jwt.verify(bearer, JWT_SECRET);
      req.auth = { username: payload.sub, role: payload.role };
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    }
  }

  return res.status(401).json({ error: 'Authentication required.' });
}

module.exports = { login, requireAuth, loginLimiter };
