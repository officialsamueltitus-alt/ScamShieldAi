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
import pg from "pg";
import dotenv from "dotenv";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cookieParser from "cookie-parser";
import axios from "axios";
import crypto from "crypto";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      user_email TEXT,
      type TEXT,
      content TEXT,
      risk_score INTEGER,
      risk_level TEXT,
      explanation TEXT,
      owner_info TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS community_reports (
      id SERIAL PRIMARY KEY,
      title TEXT,
      description TEXT,
      scam_type TEXT,
      evidence_url TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      passcode TEXT,
      name TEXT,
      profile_photo TEXT,
      credits INTEGER DEFAULT 0,
      searches_remaining INTEGER DEFAULT 5,
      referral_code TEXT UNIQUE,
      is_premium INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS newsletter (
      email TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS referrals (
      id SERIAL PRIMARY KEY,
      referrer_email TEXT,
      referred_email TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS counters (
      id TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0
    );
    INSERT INTO counters (id, count) VALUES ('guest_users', 0) ON CONFLICT DO NOTHING;
  `);
  console.log("Database initialized successfully");
}

function sendEmailNotification(subject: string, body: string) {
  console.log(`[EMAIL NOTIFICATION] To: ambsamuel75@gmail.com | Subject: ${subject} | Body: ${body}`);
}

async function generateReferralCode(): Promise<string> {
  let code = "";
  let isUnique = false;
  while (!isUnique) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await pool.query("SELECT email FROM users WHERE referral_code = $1", [code]);
    if (result.rows.length === 0) isUnique = true;
  }
  return code;
}

const app = express();

async function configureApp() {
  await initDB();

  const PgSession = connectPgSimple(session);

  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(cookieParser());
  app.use(session({
    store: new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || "scamshield-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  }));

  // =====================
  // AUTH ROUTES
  // =====================

  app.post("/api/auth/verify", async (req, res) => {
    const { email, passcode, referralCode } = req.body;
    if (!email || !passcode) return res.status(400).json({ error: "Email and passcode required" });
    if (passcode.length !== 6) return res.status(400).json({ error: "Passcode must be 6 digits" });
    try {
      const existingResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const existingUser = existingResult.rows[0];
      if (existingUser) {
        if (existingUser.passcode === passcode) {
          (req.session as any).user = existingUser;
          await new Promise<void>((resolve) => req.session.save(() => resolve()));
          return res.json({ user: existingUser, message: "Login successful" });
        } else if (!existingUser.passcode) {
          await pool.query("UPDATE users SET passcode = $1, name = COALESCE(name, $2) WHERE email = $3", [passcode, email.split('@')[0], email]);
          const updatedResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
          const updatedUser = updatedResult.rows[0];
          (req.session as any).user = updatedUser;
          await new Promise<void>((resolve) => req.session.save(() => resolve()));
          return res.json({ user: updatedUser, message: "Account setup complete" });
        } else {
          return res.status(401).json({ error: "Invalid passcode" });
        }
      }
      const myReferralCode = await generateReferralCode();
      await pool.query("INSERT INTO users (email, passcode, name, referral_code) VALUES ($1, $2, $3, $4)", [email, passcode, email.split('@')[0], myReferralCode]);
      if (referralCode) {
        const referrerResult = await pool.query("SELECT email FROM users WHERE referral_code = $1", [referralCode]);
        const referrer = referrerResult.rows[0];
        if (referrer && referrer.email !== email) {
          await pool.query("INSERT INTO referrals (referrer_email, referred_email) VALUES ($1, $2)", [referrer.email, email]);
          await pool.query("UPDATE users SET searches_remaining = searches_remaining + 1 WHERE email = $1", [referrer.email]);
          await pool.query("UPDATE users SET searches_remaining = searches_remaining + 1 WHERE email = $1", [email]);
        }
      }
      const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const user = userResult.rows[0];
      (req.session as any).user = user;
      await new Promise<void>((resolve) => req.session.save(() => resolve()));
      sendEmailNotification("New User Joined ScamShield", `New User Joined ScamShield, ${email}`);
      res.json({ user, message: "Signup successful" });
    } catch (e) {
      console.error("Signup error:", e);
      res.status(400).json({ error: "Failed to create user. Please try again." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (sessionUser) {
      try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [sessionUser.email]);
        if (result.rows[0]) {
          (req.session as any).user = result.rows[0];
          res.json(result.rows[0]);
        } else {
          res.status(401).json({ error: "Not authenticated" });
        }
      } catch (e) {
        res.status(500).json({ error: "Failed to fetch user" });
      }
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  app.get("/api/auth/google/url", (req, res) => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: `${process.env.APP_URL || "https://scamshieldai.onrender.com"}/api/auth/google/callback`,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"].join(" "),
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
        redirect_uri: `${process.env.APP_URL || "https://scamshieldai.onrender.com"}/api/auth/google/callback`,
        grant_type: "authorization_code",
      });
      const { access_token } = tokenResponse.data;
      const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const { email, name, picture } = userResponse.data;
      let userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      let user = userResult.rows[0];
      if (!user) {
        const referralCode = await generateReferralCode();
        await pool.query("INSERT INTO users (email, name, profile_photo, referral_code) VALUES ($1, $2, $3, $4)", [email, name, picture, referralCode]);
      } else {
        await pool.query("UPDATE users SET profile_photo = COALESCE(profile_photo, $1), name = COALESCE(name, $2) WHERE email = $3", [picture, name, email]);
      }
      userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      user = userResult.rows[0];
      (req.session as any).user = user;
      await new Promise<void>((resolve) => req.session.save(() => resolve()));
      res.send(`<html><body><script>if (window.opener) { window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*'); window.close(); } else { window.location.href = '/'; }</script><p>Authentication successful.</p></body></html>`);
    } catch (error: any) {
      console.error("Google OAuth Error:", error.response?.data || error.message);
      res.status(500).send("Authentication failed");
    }
  });

  // =====================
  // USER ROUTES
  // =====================

  app.post("/api/user/update-profile", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    const { name, profile_photo } = req.body;
    await pool.query("UPDATE users SET name = COALESCE($1, name), profile_photo = COALESCE($2, profile_photo) WHERE email = $3", [name, profile_photo, sessionUser.email]);
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [sessionUser.email]);
    (req.session as any).user = result.rows[0];
    res.json(result.rows[0]);
  });

  app.post("/api/user/apply-referral", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    const { referralCode } = req.body;
    if (!referralCode) return res.status(400).json({ error: "Referral code required" });
    const alreadyReferred = await pool.query("SELECT * FROM referrals WHERE referred_email = $1", [sessionUser.email]);
    if (alreadyReferred.rows.length > 0) return res.status(400).json({ error: "You have already used a referral code" });
    const referrerResult = await pool.query("SELECT email FROM users WHERE referral_code = $1", [referralCode]);
    const referrer = referrerResult.rows[0];
    if (!referrer) return res.status(400).json({ error: "Invalid referral code" });
    if (referrer.email === sessionUser.email) return res.status(400).json({ error: "You cannot refer yourself" });
    await pool.query("INSERT INTO referrals (referrer_email, referred_email) VALUES ($1, $2)", [referrer.email, sessionUser.email]);
    await pool.query("UPDATE users SET searches_remaining = searches_remaining + 1 WHERE email = $1", [referrer.email]);
    await pool.query("UPDATE users SET searches_remaining = searches_remaining + 1 WHERE email = $1", [sessionUser.email]);
    res.json({ success: true });
  });

  app.post("/api/user/subscribe-premium", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    await pool.query("UPDATE users SET is_premium = 1 WHERE email = $1", [sessionUser.email]);
    res.json({ success: true });
  });

  app.get("/api/user/profile-data", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [sessionUser.email]);
    const historyResult = await pool.query("SELECT * FROM reports WHERE user_email = $1 ORDER BY created_at DESC LIMIT 20", [sessionUser.email]);
    const referralsResult = await pool.query("SELECT referred_email, created_at FROM referrals WHERE referrer_email = $1", [sessionUser.email]);
    res.json({ user: userResult.rows[0], history: historyResult.rows, referrals: referralsResult.rows });
  });

  app.post("/api/user/newsletter", async (req, res) => {
    const { email } = req.body;
    try {
      await pool.query("INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT DO NOTHING", [email]);
      sendEmailNotification("New Newsletter Subscription", `New Newsletter Subscription from ${email}`);
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, message: "Already subscribed or invalid email" });
    }
  });

  app.post("/api/user/referral", async (req, res) => {
    const { email, referredEmail } = req.body;
    try {
      const existing = await pool.query("SELECT * FROM users WHERE email = $1", [referredEmail]);
      if (existing.rows.length > 0) return res.json({ success: false, message: "User already registered" });
      const referralCode = await generateReferralCode();
      await pool.query("INSERT INTO users (email, referral_code) VALUES ($1, $2)", [referredEmail, referralCode]);
      await pool.query("INSERT INTO referrals (referrer_email, referred_email) VALUES ($1, $2)", [email, referredEmail]);
      await pool.query("UPDATE users SET searches_remaining = searches_remaining + 1 WHERE email = $1", [email]);
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, message: "Referral failed" });
    }
  });

  app.get("/api/user/referrals", async (req, res) => {
    const email = req.query.email as string;
    const result = await pool.query("SELECT referred_email, created_at FROM referrals WHERE referrer_email = $1", [email]);
    res.json(result.rows);
  });

  app.post("/api/user/add-credits", async (req, res) => {
    const { email, credits } = req.body;
    await pool.query("UPDATE users SET credits = credits + $1 WHERE email = $2", [credits, email]);
    res.json({ success: true });
  });

  app.post("/api/user/use-search", async (req, res) => {
    const { email } = req.body;
    const result = await pool.query("SELECT searches_remaining, credits FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (user && user.searches_remaining > 0) {
      await pool.query("UPDATE users SET searches_remaining = searches_remaining - 1 WHERE email = $1", [email]);
      res.json({ success: true });
    } else if (user && user.credits > 0) {
      await pool.query("UPDATE users SET credits = GREATEST(0, credits - 2) WHERE email = $1", [email]);
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "No searches remaining" });
    }
  });

  app.post("/api/user/init", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    let result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user = result.rows[0];
    if (!user) {
      const referralCode = await generateReferralCode();
      await pool.query("INSERT INTO users (email, referral_code) VALUES ($1, $2)", [email, referralCode]);
      result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      user = result.rows[0];
    }
    res.json(user);
  });

  app.get("/api/user/me", async (req, res) => {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email required" });
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    res.json(result.rows[0] || { error: "User not found" });
  });

  // =====================
  // PAYMENT ROUTES
  // =====================

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
  const APP_URL = process.env.APP_URL || "https://scamshieldai.onrender.com";

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
          callback_url: `${APP_URL}/api/payments/paystack/callback`,
          metadata: { ...metadata, user_email: sessionUser.email }
        },
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" } }
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
        const { type, credits, user_email } = data.metadata;
        if (type === "credits") {
          await pool.query("UPDATE users SET credits = credits + $1 WHERE email = $2", [credits, user_email]);
        } else if (type === "premium") {
          await pool.query("UPDATE users SET is_premium = 1 WHERE email = $1", [user_email]);
        }
        res.redirect("/pricing?payment=success");
      } else {
        res.redirect("/pricing?payment=failed");
      }
    } catch (error) {
      console.error("Paystack Verify Error:", error);
      res.redirect("/pricing?payment=error");
    }
  });

  app.post("/api/payments/paystack/webhook", async (req: any, res) => {
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(req.rawBody).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) return res.status(401).send('Invalid signature');
    const event = req.body;
    if (event.event === 'charge.success') {
      const { type, credits, user_email } = event.data.metadata;
      if (type === 'credits') {
        await pool.query("UPDATE users SET credits = credits + $1 WHERE email = $2", [credits, user_email]);
      } else if (type === 'premium') {
        await pool.query("UPDATE users SET is_premium = 1 WHERE email = $1", [user_email]);
      }
      console.log(`Webhook: Successfully processed ${type} for ${user_email}`);
    }
    res.status(200).send('OK');
  });

  // =====================
  // REPORTS & STATS
  // =====================

  app.get("/api/history", async (req, res) => {
    const result = await pool.query("SELECT * FROM reports ORDER BY created_at DESC LIMIT 50");
    res.json(result.rows);
  });

  app.post("/api/reports", async (req, res) => {
    const sessionUser = (req.session as any).user;
    const { type, content, risk_score, risk_level, explanation, owner_info } = req.body;
    if (!sessionUser) await pool.query("UPDATE counters SET count = count + 1 WHERE id = 'guest_users'");
    const result = await pool.query(
      "INSERT INTO reports (user_email, type, content, risk_score, risk_level, explanation, owner_info) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [sessionUser?.email || null, type, content, risk_score, risk_level, explanation, owner_info]
    );
    res.json({ id: result.rows[0].id });
  });

  app.get("/api/community-reports", async (req, res) => {
    const result = await pool.query("SELECT * FROM community_reports ORDER BY created_at DESC");
    res.json(result.rows);
  });

  app.post("/api/community-reports", async (req, res) => {
    const { title, description, scam_type, evidence_url } = req.body;
    const result = await pool.query(
      "INSERT INTO community_reports (title, description, scam_type, evidence_url) VALUES ($1, $2, $3, $4) RETURNING id",
      [title, description, scam_type, evidence_url]
    );
    res.json({ id: result.rows[0].id });
  });

  app.get("/api/verify/local", async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    const searchStr = `%${query}%`;
    try {
      const result = await pool.query(`
        SELECT title as name, description as details, scam_type as type, created_at FROM community_reports WHERE title ILIKE $1 OR description ILIKE $2
        UNION
        SELECT 'Previous Analysis' as name, explanation as details, type as type, created_at FROM reports WHERE content ILIKE $3 OR explanation ILIKE $4
        LIMIT 5
      `, [searchStr, searchStr, searchStr, searchStr]);
      res.json(result.rows);
    } catch (e) {
      console.error("Local verify error:", e);
      res.json([]);
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const totalChecks = await pool.query("SELECT COUNT(*) as count FROM reports");
      const highRisk = await pool.query("SELECT COUNT(*) as count FROM reports WHERE risk_level = 'High'");
      const avgRisk = await pool.query("SELECT AVG(risk_score) as avg FROM reports");
      const registeredUsers = await pool.query("SELECT COUNT(*) as count FROM users");
      const guestUsers = await pool.query("SELECT count FROM counters WHERE id = 'guest_users'");
      res.json({
        totalChecks: parseInt(totalChecks.rows[0].count),
        highRiskDetected: parseInt(highRisk.rows[0].count),
        averageRiskScore: Math.round(avgRisk.rows[0].avg || 0),
        registeredUsers: parseInt(registeredUsers.rows[0].count),
        guestUsers: guestUsers.rows[0]?.count || 0
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // =====================
  // FRONTEND
  // =====================

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

console.log("Starting ScamShield Server...");
configureApp().catch(err => {
  console.error("CRITICAL: Server failed to start:", err);
});

export { app };
export default app;