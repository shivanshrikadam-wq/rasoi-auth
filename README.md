# RASOI authentication app

Express serves the existing RASOI HTML/CSS frontend and authentication API from one origin. PostgreSQL stores accounts and sessions. Passwords are bcrypt hashes; the client never receives password hashes or database credentials.

## Local setup
Install Node.js 20+ and PostgreSQL, create a `rasoi` database, copy `.env.example` to `.env`, and set `DATABASE_URL` plus a random `SESSION_SECRET` of at least 32 characters. Run `npm ci` and `npm start`, then open http://localhost:3000. Startup initializes `users` from `src/database/schema.sql`; the PostgreSQL session table is also created automatically. Set `DATABASE_SSL=true` when the host requires TLS.

## API and database
`POST /api/auth/register` accepts `fullName`, `email`, `password`, and `confirmPassword`. `POST /api/auth/login` accepts `email`, `password`, and `rememberMe`. `GET /api/auth/me`, `POST /api/auth/logout`, and `GET /health` are provided. `/api/dashboard` and `/dashboard.html` require an authenticated session.

Inspect rows with `psql "$DATABASE_URL"` then `SELECT id, full_name, email, created_at FROM users ORDER BY created_at DESC;`. Never expose `password_hash`. Remember Me extends the server-side session cookie to seven days; unchecked sessions use a browser-session cookie. Password recovery is not configured and the UI says so. No email provider is configured.

## Render
Push the project to GitHub and create a Render Blueprint from the repository. Review and create the service and private database in `render.yaml`; Render generates `SESSION_SECRET` and provides the private database URL. Check `/health`, register and log in, then inspect database rows through Render Shell or a trusted PostgreSQL client. An authorized Render account holder must provision resources and perform live verification; this workspace has no Render credentials.
