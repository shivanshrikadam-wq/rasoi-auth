const express = require('express');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const { pool } = require('../db');
const router = express.Router();
const limit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts. Please try again later.' } });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
router.post('/register', limit, async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body || {};
  if (![fullName, email, password, confirmPassword].every(v => typeof v === 'string')) return res.status(400).json({ error: 'Complete all fields.' });
  const name = fullName.trim(), normalizedEmail = email.trim().toLowerCase();
  if (name.length < 2 || name.length > 100 || normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) return res.status(400).json({ error: 'Enter a valid name and email address.' });
  if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match.' });
  if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return res.status(400).json({ error: 'Use 8–72 characters with at least one letter and one number.' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query('INSERT INTO users(full_name,email,password_hash) VALUES($1,$2,$3) RETURNING id,full_name,email', [name, normalizedEmail, hash]);
    return res.status(201).json({ message: 'Account created successfully. Please log in.', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'An account with that email already exists.' });
    console.error('Registration failed:', err.message);
    return res.status(500).json({ error: 'We could not create your account. Please try again.' });
  }
});
router.post('/login', limit, async (req, res) => {
  const { email, password, rememberMe } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 72) return res.status(400).json({ error: 'Enter your email and password.' });
  try {
    const result = await pool.query('SELECT id,full_name,email,password_hash FROM users WHERE email=$1', [email.trim().toLowerCase()]);
    const user = result.rows[0];
    if (!user || !await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Email or password is incorrect.' });
    await new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
    req.session.user = { id: user.id, fullName: user.full_name, email: user.email };
    if (rememberMe === true) req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    return res.json({ message: 'Welcome back.' });
  } catch (err) {
    console.error('Login failed:', err.message);
    return res.status(500).json({ error: 'We could not sign you in. Please try again.' });
  }
});
router.get('/me', (req, res) => req.session.user ? res.json({ user: req.session.user }) : res.status(401).json({ error: 'Please log in.' }));
router.post('/logout', (req, res) => req.session.destroy(err => {
  if (err) return res.status(500).json({ error: 'Could not sign out. Please try again.' });
  res.clearCookie('rasoi.sid', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.json({ message: 'Signed out.' });
}));
module.exports = router;
