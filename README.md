# THE BEYBÛN HOTEL — Website

Hotel website with admin payments, contact requests, and PostgreSQL (Railway-ready).

## Why PostgreSQL?

Browser storage only works on one device. PostgreSQL on Railway keeps payment requests and card submissions shared across phone, laptop, and admin login.

## Railway setup

1. In your Railway project, click **New** → **Database** → **PostgreSQL**.
2. Open your **web service** → **Variables** and confirm `DATABASE_URL` is present (Railway usually injects it automatically when Postgres is in the same project). If not, add a variable reference from the Postgres service.
3. Add these variables on the web service:

```
ADMIN_USERNAME=Mustafa.Beybun
ADMIN_PASSWORD=Admin123
JWT_SECRET=put-a-long-random-secret-here
```

4. Set the start command to `npm start` (or leave default — `package.json` already has `"start": "node server.js"`).
5. Redeploy. Open `/api/health` — you should see `{ "ok": true, "db": true }`.

Admin page: `/beybun-admin.html` (or click **Taksim · Istanbul** in the footer).

## Local run (optional)

```bash
npm install
# create .env from .env.example with a local DATABASE_URL
npm start
```

## Pages

- `index.html` — Home
- `rooms.html` / room detail pages
- `payment.html` — Guest payment by request number
- `beybun-admin.html` — Staff portal (hidden)
- `contact.html` — Booking requests (saved to DB + WhatsApp)

## Languages

EN, TR, AR, IT, ES, FA (saved in the browser).
