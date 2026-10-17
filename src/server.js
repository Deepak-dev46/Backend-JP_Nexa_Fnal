import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import contactRoutes from "../routes/contact.routes.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const FRONTEND_URL = (process.env.FRONTEND_URL).replace(/\/$/, "");
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required. Copy .env.example to .env and configure it.");
}

app.set("trust proxy", 1);
app.use(express.json({ limit: "20kb" }));
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
}));
// app.use(express.json());

app.use(session({
  name: "jp_nexa.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction, // Production must use HTTPS.
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

function normalizeUser(provider, profile) {
  const emails = Array.isArray(profile.emails) ? profile.emails : [];
  const photos = Array.isArray(profile.photos) ? profile.photos : [];
  return {
    id: profile.id,
    provider,
    displayName: profile.displayName || profile.username || "User",
    email: emails.find((item) => item.value)?.value || null,
    photo: photos[0]?.value || null,
  };
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use("google", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ["profile", "email"],
  }, (_accessToken, _refreshToken, profile, done) => {
    done(null, normalizeUser("google", profile));
  }));
} else {
  console.warn("Google OAuth is not configured; set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.");
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use("github", new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ["user:email"],
  }, (_accessToken, _refreshToken, profile, done) => {
    done(null, normalizeUser("github", profile));
  }));
} else {
  console.warn("GitHub OAuth is not configured; set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.");
}

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/contact-test", (_req, res) => {
  res.status(200).json({
    status: "ok",
    route: "contact-test",
  });
});

app.use("/api/contact",contactRoutes);
app.get("/auth/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ error: "Google OAuth is not configured on the server." });
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login?oauth=failed`,
  }),
  (_req, res) => res.redirect(`${FRONTEND_URL}/oauth/callback`)
);

app.get("/auth/github", (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(503).json({ error: "GitHub OAuth is not configured on the server." });
  }
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});

app.get("/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${FRONTEND_URL}/login?oauth=failed`,
  }),
  (_req, res) => res.redirect(`${FRONTEND_URL}/oauth/callback`)
);

app.get("/api/auth/me", (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, user: req.user });
});

app.post("/api/auth/logout", (req, res, next) => {
  req.logout((logoutError) => {
    if (logoutError) return next(logoutError);
    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      res.clearCookie("jp_nexa.sid", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
      });
      res.status(204).end();
    });
  });
});

app.use((err, _req, res, _next) => {
  console.error("Request error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`JP Nexa OAuth API listening on http://localhost:${PORT}`);
  console.log(`Frontend origin: ${FRONTEND_URL}`);
});
