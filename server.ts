import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import axios from "axios";
import crypto from "crypto";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "scamshield.db"));

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    type TEXT,
    content TEXT,
    risk_score INTEGER,
    risk_level TEXT,
    explanation TEXT,
    owner_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS community_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    scam_type TEXT,
    evidence_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS newsletter (
    email TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_email TEXT,
    referred_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(referrer_email) REFERENCES users(email)
  );

  CREATE TABLE IF NOT EXISTS counters (
    id TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0
  );
  INSERT OR IGNORE INTO counters (id, count) VALUES ('guest_users', 0);

  -- Ensure existing users have at least 5 searches if they are free
  UPDATE users SET searches_remaining = 5 WHERE searches_remaining < 5 AND is_premium = 0;
`);

// Helper to send email notifications (mock)
function sendEmailNotification(subject: string, body: string) {
  console.log(`[EMAIL NOTIFICATION] To: ambsamuel75@gmail.com | Subject: ${subject} | Body: ${body}`);
  // In a real production environment, you would use a service like SendGrid, Mailgun, or AWS SES here.
}

// Helper to generate unique referral code
function generateReferralCode() {
  let code = "";
  let isUnique = false;
  while (!isUnique) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const collision = db.prepare("SELECT email FROM users WHERE referral_code = ?").get(code);
    if (!collision) isUnique = true;
  }
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
      secure: true, // Required for SameSite=None in iframes
      sameSite: "none",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth Routes
  app.post("/api/auth/verify", (req, res) => {
    const { email, passcode, referralCode } = req.body;
    if (!email || !passcode) return res.status(400).json({ error: "Email and passcode required" });
    if (passcode.length !== 6) return res.status(400).json({ error: "Passcode must be 6 digits" });

    const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    
    if (existingUser) {
      if (existingUser.passcode === passcode) {
        (req.session as any).user = existingUser;
        return res.json({ user: existingUser, message: "Login successful" });
      } else if (!existingUser.passcode) {
        // User exists but has no passcode yet (e.g. from referral or guest init)
        // Set the passcode now
        db.prepare("UPDATE users SET passcode = ?, name = COALESCE(name, ?) WHERE email = ?")
          .run(passcode, existingUser.name || email.split('@')[0], email);
        
        const updatedUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        (req.session as any).user = updatedUser;
        return res.json({ user: updatedUser, message: "Account setup complete" });
      } else {
        return res.status(401).json({ error: "Invalid passcode" });
      }
    }

    // New User
    try {
      const myReferralCode = generateReferralCode();

      db.prepare("INSERT INTO users (email, passcode, name, referral_code) VALUES (?, ?, ?, ?)")
        .run(email, passcode, email.split('@')[0], myReferralCode);
      
      // Handle referral code if provided
      if (referralCode) {
        const referrer = db.prepare("SELECT email FROM users WHERE referral_code = ?").get(referralCode) as any;
        if (referrer && referrer.email !== email) {
          db.prepare("INSERT INTO referrals (referrer_email, referred_email) VALUES (?, ?)").run(referrer.email, email);
          db.prepare("UPDATE users SET searches_remaining = searches_remaining + 1 WHERE email = ?").run(referrer.email);
          db.prepare("UPDATE users SET searches_remaining = searches_remaining + 1 WHERE email = ?").run(email);
        }
      }

      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
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
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(sessionUser.email);
      res.json(user);
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
      // Exchange code for tokens
      const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`,
        grant_type: "authorization_code",
      });

      const { access_token } = tokenResponse.data;

      // Get user info
      const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { email, name, picture } = userResponse.data;
      
      let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (!user) {
        const referralCode = generateReferralCode();
        db.prepare("INSERT INTO users (email, name, profile_photo, referral_code) VALUES (?, ?, ?, ?)")
          .run(email, name, picture, referralCode);
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      } else {
        // Update profile photo if it changed
        db.prepare("UPDATE users SET profile_photo = COALESCE(profile_photo, ?), name = COALESCE(name, ?) WHERE email = ?")
          .run(picture, name, email);
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      }

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
    db.prepare("UPDATE users SET name = COALESCE(?, name), profile_photo = COALESCE(?, profile_photo) WHERE email = ?")
      .run(name, profile_photo, sessionUser.email);
    
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(sessionUser.email);
    (req.session as any).user = user;
    res.json(user);
  });

  app.post("/api/user/apply-referral", (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });

    const { referralCode } = req.body;
    if (!referralCode) return res.status(400).json({ error: "Referral code required" });

    // Check if user was already referred
    const alreadyReferred = db.prepare("SELECT * FROM referrals WHERE referred_email = ?").get(sessionUser.email);
    if (alreadyReferred) return res.status(400).json({ error: "You have already used a referral code" });

    const referrer = db.prepare("SELECT email FROM users WHERE referral_code = ?").get(referralCode) as any;
    if (!referrer) return res.status(400).json({ error: "Invalid referral code" });
    if (referrer.email === sessionUser.email) return res.status(400).json({ error: "You cannot refer yourself" });

    db.prepare("INSERT INTO referrals (referrer_email, referred_email) VALUES (?, ?)").run(referrer.email, sessionUser.email);
    db.prepare("UPDATE users SET searches_remaining = searches_remaining + 1 WHERE email = ?").run(referrer.email);
    db.prepare("UPDATE users SET searches_remaining = searches_remaining + 1 WHERE email = ?").run(sessionUser.email);

    res.json({ success: true });
  });

  app.post("/api/user/subscribe-premium", (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });

    db.prepare("UPDATE users SET is_premium = 1 WHERE email = ?").run(sessionUser.email);
    res.json({ success: true });
  });

  app.get("/api/user/profile-data", (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(sessionUser.email);
    const history = db.prepare("SELECT * FROM reports WHERE user_email = ? ORDER BY created_at DESC LIMIT 20").all(sessionUser.email);
    const referrals = db.prepare("SELECT referred_email, created_at FROM referrals WHERE referrer_email = ?").all(sessionUser.email);

    res.json({ user, history, referrals });
  });

  // Paystack Integration
  // NOTE: Currently using test mode keys. Replace with live keys for production.
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
          metadata: {
            ...metadata,
            user_email: sessionUser.email
          }
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
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`
          }
        }
      );

      const data = response.data.data;
      if (data.status === "success") {
        const { type, credits, user_email } = data.metadata;

        if (type === "credits") {
          db.prepare("UPDATE users SET credits = credits + ? WHERE email = ?").run(credits, user_email);
        } else if (type === "premium") {
          db.prepare("UPDATE users SET is_premium = 1 WHERE email = ?").run(user_email);
        }

        const updatedUser = db.prepare("SELECT * FROM users WHERE email = ?").get(user_email);
        const sessionUser = (req.session as any).user;
        if (sessionUser && sessionUser.email === user_email) {
          (req.session as any).user = updatedUser;
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

  app.post("/api/payments/paystack/webhook", (req: any, res) => {
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(req.rawBody).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const { type, credits, user_email } = event.data.metadata;

      if (type === 'credits') {
        db.prepare("UPDATE users SET credits = credits + ? WHERE email = ?").run(credits, user_email);
      } else if (type === 'premium') {
        db.prepare("UPDATE users SET is_premium = 1 WHERE email = ?").run(user_email);
      }
      
      console.log(`Webhook: Successfully processed ${type} for ${user_email}`);
    }

    res.status(200).send('OK');
  });

  // API Routes
  app.get("/api/history", (req, res) => {
    const history = db.prepare("SELECT * FROM reports ORDER BY created_at DESC LIMIT 50").all();
    res.json(history);
  });

  app.post("/api/reports", (req, res) => {
    const sessionUser = (req.session as any).user;
    const { type, content, risk_score, risk_level, explanation, owner_info } = req.body;
    
    if (!sessionUser) {
      db.prepare("UPDATE counters SET count = count + 1 WHERE id = 'guest_users'").run();
    }

    const info = db.prepare(
      "INSERT INTO reports (user_email, type, content, risk_score, risk_level, explanation, owner_info) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(sessionUser?.email || null, type, content, risk_score, risk_level, explanation, owner_info);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/community-reports", (req, res) => {
    const reports = db.prepare("SELECT * FROM community_reports ORDER BY created_at DESC").all();
    res.json(reports);
  });

  app.post("/api/community-reports", (req, res) => {
    const { title, description, scam_type, evidence_url } = req.body;
    const info = db.prepare(
      "INSERT INTO community_reports (title, description, scam_type, evidence_url) VALUES (?, ?, ?, ?)"
    ).run(title, description, scam_type, evidence_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/verify/local", (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    
    const searchStr = `%${query}%`;
    try {
      const localMatches = db.prepare(`
        SELECT title as name, description as details, scam_type as type, created_at 
        FROM community_reports 
        WHERE title LIKE ? OR description LIKE ?
        UNION
        SELECT 'Previous Analysis' as name, explanation as details, type as type, created_at
        FROM reports
        WHERE content LIKE ? OR explanation LIKE ?
        LIMIT 5
      `).all(searchStr, searchStr, searchStr, searchStr);
      
      res.json(localMatches);
    } catch (e) {
      console.error("Local verify error:", e);
      res.json([]);
    }
  });

  app.get("/api/stats", (req, res) => {
    const totalChecks = db.prepare("SELECT COUNT(*) as count FROM reports").get() as { count: number };
    const highRisk = db.prepare("SELECT COUNT(*) as count FROM reports WHERE risk_level = 'High'").get() as { count: number };
    const avgRisk = db.prepare("SELECT AVG(risk_score) as avg FROM reports").get() as { avg: number };
    const registeredUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    const guestUsers = db.prepare("SELECT count FROM counters WHERE id = 'guest_users'").get() as { count: number };
    
    res.json({
      totalChecks: totalChecks.count,
      highRiskDetected: highRisk.count,
      averageRiskScore: Math.round(avgRisk.avg || 0),
      registeredUsers: registeredUsers.count,
      guestUsers: guestUsers.count
    });
  });

  // User & Credits Routes
  app.post("/api/user/init", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      const referralCode = generateReferralCode();
      db.prepare("INSERT INTO users (email, referral_code) VALUES (?, ?)").run(email, referralCode);
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    }
    res.json(user);
  });

  app.get("/api/user/me", (req, res) => {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email required" });
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    res.json(user || { error: "User not found" });
  });

  app.post("/api/user/newsletter", (req, res) => {
    const { email } = req.body;
    try {
      db.prepare("INSERT INTO newsletter (email) VALUES (?)").run(email);
      sendEmailNotification("New Newsletter Subscription", `New Newsletter Subscription from ${email}`);
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, message: "Already subscribed or invalid email" });
    }
  });

  app.post("/api/user/referral", (req, res) => {
    const { email, referredEmail } = req.body;
    try {
      // Check if referred email already exists
      const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(referredEmail);
      if (existing) return res.json({ success: false, message: "User already registered" });

      // Create referred user
      const referralCode = generateReferralCode();
      db.prepare("INSERT INTO users (email, referral_code) VALUES (?, ?)").run(referredEmail, referralCode);
      
      // Record referral
      db.prepare("INSERT INTO referrals (referrer_email, referred_email) VALUES (?, ?)").run(email, referredEmail);
      
      // Reward referrer: +1 search
      db.prepare("UPDATE users SET searches_remaining = searches_remaining + 1 WHERE email = ?").run(email);
      
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, message: "Referral failed" });
    }
  });

  app.get("/api/user/referrals", (req, res) => {
    const email = req.query.email as string;
    const referrals = db.prepare("SELECT referred_email, created_at FROM referrals WHERE referrer_email = ?").all(email);
    res.json(referrals);
  });

  app.post("/api/user/add-credits", (req, res) => {
    const { email, credits } = req.body;
    db.prepare("UPDATE users SET credits = credits + ? WHERE email = ?")
      .run(credits, email);
    res.json({ success: true });
  });

  app.post("/api/user/use-search", (req, res) => {
    const { email } = req.body;
    const user = db.prepare("SELECT searches_remaining, credits FROM users WHERE email = ?").get(email) as any;
    if (user && user.searches_remaining > 0) {
      db.prepare("UPDATE users SET searches_remaining = searches_remaining - 1 WHERE email = ?").run(email);
      res.json({ success: true });
    } else if (user && user.credits > 0) {
      // Deduct 2 credits per search (since 10 credits = 5 searches)
      db.prepare("UPDATE users SET credits = MAX(0, credits - 2) WHERE email = ?").run(email);
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "No searches remaining" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production (like Vercel), static files are served by the platform
    // but we keep this for local production testing
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    
    // API routes are already handled above
    // For SPA, serve index.html for any non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "production" || process.env.VITE_DEV_SERVER === "true") {
    const listenPort = process.env.PORT || 3000;
    app.listen(Number(listenPort), '0.0.0.0', () => {
  console.log(`Server is listening on port ${listenPort}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

export { app };

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  console.log("Starting ScamShield Server...");
  configureApp().catch(err => {
    console.error("CRITICAL: Server failed to start:", err);
  });
}

export default app;
