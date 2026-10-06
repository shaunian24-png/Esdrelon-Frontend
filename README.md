# Product Management — React (Vite) frontend

Talks only to the LavaLust API (never to the database).

```bash
npm install
cp .env.example .env     # set VITE_API_URL
npm run dev              # http://localhost:5173
npm run build            # output in dist/  (Render Static Site: publish dir = dist)
```

Features: Login / Register, product list (search + pagination), Add, Edit, Delete, Logout.
Tokens are kept in `localStorage`; an expired access token is refreshed silently once, and the user is
sent back to the login page if the refresh token is no longer valid.
