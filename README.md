# Product Management — React (Vite) frontend

Talks only to the LavaLust API (never to the database).

## Deploy to Render

The included `render.yaml` configures this project as a Render Static Site. In Render, create a **Blueprint** from this repository and apply the Blueprint. For a manually created Static Site, use:

- **Build command:** `npm ci && npm run build`
- **Publish directory:** `dist`
- **Environment variable:** `VITE_API_URL` = the deployed backend API's base URL, with no trailing slash (for example, `https://product-management-api-shaun.onrender.com`)

`VITE_API_URL` is embedded into the frontend at build time. Set it before the first deploy and trigger a new deploy whenever it changes. The backend's `CORS_ORIGIN` must include the exact frontend origin shown by Render (for example, `https://esdrelon-frontend.onrender.com`, without a trailing slash). If either URL changes, update the corresponding environment variable and redeploy the affected service.

The rewrite in `render.yaml` sends client-side routes back to `index.html`, so refreshing or opening a frontend route directly works. The production build uses `dist`; do not commit the generated directory or `node_modules`.

The frontend only needs the public API URL. Do not put database credentials, JWT secrets, or other backend secrets in frontend environment variables: all `VITE_*` values are shipped to the browser.

## Local development

```bash
npm install
cp .env.example .env     # Windows PowerShell: Copy-Item .env.example .env
npm run dev              # http://localhost:5173
npm run build            # production output in dist/
```

Features: Login / Register, product list (search + pagination), Add, Edit, Delete, Logout.
Tokens are kept in `localStorage`; an expired access token is refreshed silently once, and the user is
sent back to the login page if the refresh token is no longer valid.
