# JP Nexa Express.js OAuth backend

This backend adds Google and GitHub OAuth sign-in to the supplied Vite/React frontend. It uses Passport.js and an HTTP-only server session cookie. It does not issue JWTs or store provider access tokens in browser storage.

## Requirements

- Node.js 20 or later recommended
- Google OAuth client credentials and/or a GitHub OAuth App
- The frontend running at `http://localhost:5173` for local development

## 1. Install and configure

```bash
cp .env.example .env
npm install
```

Generate a strong session secret, then put it in `.env`. For example:

```bash
openssl rand -hex 32
```

Do not commit `.env`.

## 2. Create provider credentials

### Google

1. Open https://console.cloud.google.com/
2. Create/select a project and configure the OAuth consent screen.
3. Create an OAuth client ID of type **Web application**.
4. Add this authorized redirect URI for local development:
   `http://localhost:4000/auth/google/callback`
5. Put the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### GitHub

1. Open https://github.com/settings/developers and create an OAuth App.
2. Set **Authorization callback URL** to:
   `http://localhost:4000/auth/github/callback`
3. Put the client ID and secret into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

The callback URLs must match exactly. You can configure only one provider initially; the other provider is disabled until its credentials are supplied.

## 3. Start backend

```bash
npm run dev
```

Test `http://localhost:4000/health`, which should return `{"status":"ok"}`.

## 4. Connect the frontend

Copy `frontend-patch/SocialAuthButtons.jsx` over `src/components/SocialAuthButtons.jsx`.

Copy `frontend-patch/OAuthCallback.jsx` to `src/pages/OAuthCallback.jsx`, then add these imports/routes in `src/App.jsx`:

```jsx
import OAuthCallback from "./pages/OAuthCallback.jsx";

// Inside <Routes>:
<Route path="/oauth/callback" element={<OAuthCallback />} />
```

Create `frontend/.env` (or the root frontend `.env` where `package.json` lives) with:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Restart Vite after changing `.env`.

For cross-origin fetches, the callback uses `credentials: 'include'`; the Express CORS configuration allows the exact frontend origin and credentials.

## 5. Endpoints

- `GET /health`
- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /auth/github`
- `GET /auth/github/callback`
- `GET /api/auth/me` — returns the signed-in user from the session
- `POST /api/auth/logout` — ends the session

## Production notes

- Use HTTPS for both frontend and backend.
- Set `NODE_ENV=production`, `FRONTEND_URL` to the exact deployed frontend origin, and callback URLs to the public HTTPS backend URL.
- If frontend and API are on different sites, the session cookie uses `SameSite=None; Secure`; browsers require HTTPS for this.
- The default Express MemoryStore is for local development only. Use a persistent session store (for example Redis or a database-backed store) before production deployment.
- Restrict CORS to the exact frontend origin. Do not use `*` with credentialed requests.
- Add rate limiting, monitoring, and a persistent user table if you need account linking, roles, audit history, or user management.
- Google/GitHub login proves identity through the provider; it does not automatically create an application database account.
