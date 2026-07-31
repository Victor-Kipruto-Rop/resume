# Engineering Dispatch — Subscribe & Notify Backend

This is the backend that makes the "Subscribe" box on `blog.html` actually work: it stores
subscribers (full name, email, timestamp) in a SQLite database and can email every subscriber
when you publish a new blog post.

**Important:** your portfolio site itself (the HTML/CSS/JS in the repo root) is a static site.
Static hosting (GitHub Pages, Netlify static, etc.) cannot run this server — it only serves
files. This backend needs to run somewhere that executes Node.js continuously. The steps below
get you there for free.

## 1. Deploy the backend (Render — free tier)

1. Push this `server/` folder to GitHub (it can live in the same repo).
2. Go to [render.com](https://render.com) → New → Web Service → connect your GitHub repo.
3. Set:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Add environment variables (Render dashboard → Environment) from `.env.example`:
   - `ADMIN_TOKEN` — make up a long random string, keep it secret
   - `ALLOWED_ORIGIN` — your live site URL, e.g. `https://victor-kipruto-rop.github.io`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — see below
5. Deploy. Render gives you a URL like `https://dataforge-subscribe.onrender.com`.

Railway and Fly.io work the same way if you prefer those instead.

## 2. Set up email sending (SMTP)

The simplest free option is a Gmail account with an **App Password** (not your normal password):

1. Enable 2-Step Verification on the Google account: https://myaccount.google.com/security
2. Create an App Password: https://myaccount.google.com/apppasswords
3. Use:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=youraddress@gmail.com
   SMTP_PASS=<the 16-character app password>
   SMTP_FROM=youraddress@gmail.com
   ```
Any other SMTP provider (Zoho, SendGrid SMTP, Mailgun SMTP, etc.) works the same way — just
swap the host/port/user/pass.

## 3. Point the frontend at your deployed backend

In `app.js`, `API_BASE_URL` currently defaults to empty (subscriptions get queued locally in
the browser's `localStorage` under `pendingSubscribers` so nothing is lost while you deploy).
Once your backend is live, set it — easiest is to add this one line right before the
`<script src="app.js">` tag on `blog.html` (and any other page with a subscribe form):

```html
<script>window.API_BASE_URL = "https://your-backend-url.onrender.com";</script>
<script src="app.js"></script>
```

## 4. Using it day to day

**When someone subscribes** on the site, their full name, email, and a UTC timestamp land in
`subscribers.db` (SQLite) automatically — no action needed from you.

**When you publish a new blog post**, notify everyone with one request:

```bash
curl -X POST https://your-backend-url.onrender.com/api/notify-new-post \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Why Every Data Engineer Should Learn Event-Driven Architecture",
    "url": "https://your-site.com/article.html?id=1",
    "excerpt": "Explore how decoupling services via Kafka transforms fragile batch routines into resilient streaming."
  }'
```

Every active subscriber gets an email with the title, excerpt, and a link to read the full
article.

**To see who's subscribed:**

```bash
curl https://your-backend-url.onrender.com/api/subscribers \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

## API reference

| Method | Path                    | Auth        | Body                                  | Purpose                              |
|--------|-------------------------|-------------|----------------------------------------|---------------------------------------|
| GET    | `/api/health`           | none        | —                                      | Health check                          |
| POST   | `/api/subscribe`        | none        | `{ fullName, email }`                  | Add a subscriber                      |
| GET    | `/api/subscribers`      | admin token | —                                      | List all subscribers                  |
| POST   | `/api/notify-new-post`  | admin token | `{ title, url, excerpt? }`             | Email all subscribers about a post    |

Admin routes require an `x-admin-token` header matching your `ADMIN_TOKEN` env variable.

## 5. Ops Center (real GitHub, blog, subscriber & system dashboard)

`ops.html` in the repo root is a login-gated dashboard showing genuinely real data — no
mock numbers anywhere. It talks to this same backend, so once the backend is deployed:

1. **Set up your login** (one admin account — this is a personal portfolio, not a SaaS):
   ```bash
   cd server
   npm run hash-password -- "your-real-password"
   ```
   Copy the printed hash into `ADMIN_PASSWORD_HASH` in your deployed environment, along
   with `ADMIN_USERNAME` and a `JWT_SECRET` (generate one with
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

2. **(Recommended) Add a GitHub token** so the GitHub Intelligence tab doesn't hit the
   60-requests/hour unauthenticated limit — create a fine-grained PAT with only public
   read access at https://github.com/settings/tokens, then set `GITHUB_TOKEN` in your
   environment. This raises the limit to 5,000/hour.

3. **Open `ops.html`** (locally, or wherever you host the static site), enter your
   username, password, and your deployed backend URL (e.g.
   `https://your-backend.onrender.com`), and sign in.

What you'll see, all backed by real sources:
- **GitHub Intelligence** — live repos, stars, forks, languages, most recently pushed, straight from `api.github.com`
- **Subscribers** — the actual rows in `subscribers.db`, plus a form that calls `/api/notify-new-post` for real
- **Blog Ops** — category/tag counts computed directly from the live `articles-data.js`
- **System Health** — real Node process + host metrics for wherever this backend is running
- **Not Yet Connected** — an honest list of what would need real infrastructure (GA4 property, a deployed Kafka/Airflow cluster, a multi-node database) before those panels could show anything but fabricated numbers — so they don't try to.



```bash
cd server
cp .env.example .env      # fill in real values
npm install
npm start                 # runs on http://localhost:4000
```
