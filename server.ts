process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  process.exit(1);
});

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
// import Database from "better-sqlite3";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import axios from "axios";
import crypto from "crypto";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const db = new Database(path.join(__dirname, "scamshield.db"));

// Initialize database
// db.exec(`
//   CREATE TABLE IF NOT EXISTS reports (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     user_email TEXT,
//     type TEXT,
//     content TEXT,
//     risk_score INTEGER,
//     risk_level TEXT,
//     explanation TEXT,
//     owner_info TEXT,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//   );
//
//   CREATE TABLE IF NOT EXISTS community_reports (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     title TEXT,
//     description TEXT,
//     scam_type TEXT,
//     evidence_url TEXT,
//     status TEXT DEFAULT 'pending',
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//   );
//
//   CREATE TABLE IF NOT EXISTS users (
//     email TEXT PRIMARY KEY,
//     passcode TEXT,
//     name TEXT,
//     profile_photo TEXT,
//     credits INTEGER DEFAULT 0,
//     searches_remaining INTEGER DEFAULT 5,
//     referral_code TEXT UNIQUE,
//     is_premium INTEGER DEFAULT 0,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//   );
//
//   CREATE TABLE IF NOT EXISTS newsletter (
//     email TEXT PRIMARY KEY,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//   );
//
//   CREATE TABLE IF NOT EXISTS referrals (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     referrer_email TEXT,
//     referred_email TEXT,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY(referrer_email) REFERENCES users(email)
//   );
//
//   CREATE TABLE IF NOT EXISTS counters (
//     id TEXT PRIMARY KEY,
//     count INTEGER DEFAULT 0
//   );
//   INSERT OR IGNORE INTO counters (id, count) VALUES ('guest_users', 0);
//
//   -- Ensure existing users have at least 5 searches if they are free
//   UPDATE users SET searches_remaining = 5 WHERE searches_remaining < 5 AND is_premium = 0;
// `);

// Helper to send email notifications (mock)
function sendEmailNotification(subject: string, body: string) {
  console.log(`[EMAIL NOTIFICATION] To: ambsamuel75@gmail.com | Subject: ${subject} | Body: ${body}`);
}

// Helper to generate unique referral code
function generateReferralCode() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  return code;
}

const app = express();
const PORT = process.env.PORT || 3000;

async function configureApp() {
  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || "scamshield-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  // Auth Routes
  app.post("/api/auth/verify", (req, res) => {
    const { email, passcode, referralCode } = req.body;
    if (!email || !passcode) return res.status(400).json({ error: "Email and passcode required" });
    if (passcode.length !== 6) return res.status(400).json({ error: "Passcode must be 6 digits" });

    // const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    const existingUser = null;

    if (existingUser) {
      // db logic commented out
    }

    try {
      const myReferralCode = generateReferralCode();
      // db.prepare("INSERT INTO users (email, passcode, name, referral_code) VALUES (?, ?, ?, ?)").run(email, passcode, email.split('@')[0], myReferralCode);
      const user = { email, name: email.split('@')[0], referral_code: myReferralCode };
      (req.session as any).user = user;
      sendEmailNotification("New User Joined ScamShield", `New User Joined ScamShield, ${email}`);
      res.json({ user, message: "Signup successful" });
    } catch (e) {
      console.error("Signup error:", e);
      res.status(400).json({ error: "Failed to create user. Please try again." });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const sessionUser = (req.session as any).user;
    if (sessionUser) {
      // const user = db.prepare("SELECT * FROM users WHERE email = ?").get(sessionUser.email);
      res.json(sessionUser);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Google OAuth
  app.get("/api/auth/google/url", (req, res) => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`,
      client_id: process.env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };
    const qs = new URLSearchParams(options);
    res.json({ url: `${rootUrl}?${qs.toString()}` });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code as string;
    try {
      const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`,
        grant_type: "authorization_code",
      });
      const { access_token } = tokenResponse.data;
      const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const { email, name, picture } = userResponse.data;
      // let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      const user = { email, name, profile_photo: picture, referral_code: generateReferralCode() };
      (req.session as any).user = user;
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Google OAuth Error:", error.response?.data || error.message);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/user/update-profile", (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    const { name, profile_photo } = req.body;
    // db.prepare("UPDATE users SET name = COALESCE(?, name), profile_photo = COALESCE(?, profile_photo) WHERE email = ?").run(name, profile_photo, sessionUser.email);
    const user = { ...sessionUser, name: name || sessionUser.name, profile_photo: profile_photo || sessionUser.profile_photo };
    (req.session as any).user = user;
    res.json(user);
  });

  app.post("/api/user/apply-referral", (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    const { referralCode } = req.body;
    if (!referralCode) return res.status(400).json({ error: "Referral code required" });
    // db logic commented out
    res.json({ success: true });
  });

  app.post("/api/user/subscribe-premium", (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    // db.prepare("UPDATE users SET is_premium = 1 WHERE email = ?").run(sessionUser.email);
    res.json({ success: true });
  });

  app.get("/api/user/profile-data", (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    // const user = db.prepare("SELECT * FROM users WHERE email = ?").get(sessionUser.email);
    // const history = db.prepare("SELECT * FROM reports WHERE user_email = ? ORDER BY created_at DESC LIMIT 20").all(sessionUser.email);
    // const referrals = db.prepare("SELECT referred_email, created_at FROM referrals WHERE referrer_email = ?").all(sessionUser.email);
    res.json({ user: sessionUser, history: [], referrals: [] });
  });

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "sk_test_mock_key";

  app.post("/api/payments/paystack/initialize", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    const { amount, metadata } = req.body;
    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email: sessionUser.email,
          amount: Math.round(amount * 100),
          callback_url: `${process.env.APP_URL || "http://localhost:3000"}/api/payments/paystack/callback`,
          metadata: { ...metadata, user_email: sessionUser.email }
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json"
          }
        }
      );
      res.json(response.data.data);
    } catch (error: any) {
      console.error("Paystack Init Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to initialize payment" });
    }
  });

  app.get("/api/payments/paystack/callback", async (req, res) => {
    const { reference } = req.query;
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
      );
      const data = response.data.data;
      if (data.status === "success") {
        // const { type, credits, user_email } = data.metadata;
        // db logic commented out
        res.redirect("/pricing?payment=success");
      } else {
        res.redirect("/pricing?payment=failed");
      }
    } catch (error) {
      console.error("Paystack Verify Error:", error);
      res.redirect("/pricing?payment=error");
    }
  });

  app.post("/api/payments/paystack/webhook", (req: any, res) => {
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(req.rawBody).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send('Invalid signature');
    }
    const event = req.body;
    if (event.event === 'charge.success') {
      // db logic commented out
      console.log(`Webhook: Successfully processed payment for ${event.data.metadata.user_email}`);
    }
    res.status(200).send('OK');
  });

  app.get("/api/history", (req, res) => {
    // const history = db.prepare("SELECT * FROM reports ORDER BY created_at DESC LIMIT 50").all();
    res.json([]);
  });

  app.post("/api/reports", (req, res) => {
    // const sessionUser = (req.session as any).user;
    // db logic commented out
    res.json({ id: 1 });
  });

  app.get("/api/community-reports", (req, res) => {
    // const reports = db.prepare("SELECT * FROM community_reports ORDER BY created_at DESC").all();
    res.json([]);
  });

  app.post("/api/community-reports", (req, res) => {
    // db logic commented out
    res.json({ id: 1 });
  });

  app.get("/api/verify/local", (req, res) => {
    // db logic commented out
    res.json([]);
  });

  app.get("/api/stats", (req, res) => {
    // db logic commented out
    res.json({
      totalChecks: 0,
      highRiskDetected: 0,
      averageRiskScore: 0,
      registeredUsers: 0,
      guestUsers: 0
    });
  });

  app.post("/api/user/init", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    const user = { email, referral_code: generateReferralCode(), searches_remaining: 5, credits: 0, is_premium: 0 };
    res.json(user);
  });

  app.get("/api/user/me", (req, res) => {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email required" });
    // const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    res.json({ email, searches_remaining: 5, credits: 0, is_premium: 0 });
  });

  app.post("/api/user/newsletter", (req, res) => {
    const { email } = req.body;
    try {
      // db.prepare("INSERT INTO newsletter (email) VALUES (?)").run(email);
      sendEmailNotification("New Newsletter Subscription", `New Newsletter Subscription from ${email}`);
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, message: "Already subscribed or invalid email" });
    }
  });

  app.post("/api/user/referral", (req, res) => {
    // db logic commented out
    res.json({ success: true });
  });

  app.get("/api/user/referrals", (req, res) => {
    // const referrals = db.prepare("SELECT referred_email, created_at FROM referrals WHERE referrer_email = ?").all(email);
    res.json([]);
  });

  app.post("/api/user/add-credits", (req, res) => {
    // db.prepare("UPDATE users SET credits = credits + ? WHERE email = ?").run(credits, email);
    res.json({ success: true });
  });

  app.post("/api/user/use-search", (req, res) => {
    // db logic commented out
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const listenPort = process.env.PORT || 3000;
  app.listen(Number(listenPort), '0.0.0.0', () => {
    console.log(`Server is listening on port ${listenPort}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export { app };

console.log("Starting ScamShield Server...");
configureApp().catch(err => {
  console.error("CRITICAL: Server failed to start:", err);
});

export default app;