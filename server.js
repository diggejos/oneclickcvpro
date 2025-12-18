import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import Stripe from 'stripe';
import bcrypt from "bcryptjs";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
};

// --- EMAIL SETUP ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ Email service not configured:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

const app = express();

const allowedOrigins = [
  "https://oneclickcvpro-frontend.onrender.com",
  "https://oneclickcvpro.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "stripe-signature"],
    credentials: false, 
  })
);

app.options("*", cors());

const PORT = process.env.PORT || 4242;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "1040938691698-o9k428s47iskgq1vs6rk1dnc1857tnir.apps.googleusercontent.com";


app.get("/api/users/me", async (req, res) => {
  try {
    const userIdRaw = req.headers["x-user-id"];
    if (!userIdRaw) return res.status(401).json({ error: "Unauthorized" });

    const userId = toObjectId(userIdRaw);
    if (!userId) return res.status(400).json({ error: "Invalid user id" });

    const user = await User.findById(userId).select("email name avatar credits").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ credits: user.credits });
  } catch (err) {
    console.error("ME ERROR:", err);
    return res.status(500).json({ error: "Failed to load user" });
  }
});

// --- MIDDLEWARE ---
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') return next();
  express.json({ limit: "25mb" })(req, res, next);
});

// --- DATABASE CONNECTION ---
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.warn('⚠️ No MONGODB_URI found. Database features will fail.');
}

// --- MONGOOSE MODELS ---

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  googleId: String,
  name: String,
  avatar: String,
  credits: { type: Number, default: 1 },
  // Track processed sessions to prevent double-crediting
  processedSessions: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId: { type: String, required: true },
  title: String,
  lastModified: Number,
  baseResumeInput: Object,
  jobDescriptionInput: Object,
  baseResumeData: Object,
  tailoredResumeData: Object,
  config: Object,
  profileImage: String
});

resumeSchema.index({ userId: 1, resumeId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const Resume = mongoose.model('Resume', resumeSchema);

// --- AUTHENTICATION ENDPOINTS ---

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ googleId, email, name, avatar: picture, isVerified: true, verificationToken: null });
      await user.save();
    } else {
      user.avatar = picture;
      user.name = name;
      await user.save();
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      credits: user.credits
    });

  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
});

// --- RESUME SYNC ENDPOINTS ---

app.get('/api/resumes', async (req, res) => {
  const userIdRaw = req.headers['x-user-id'];
  if (!userIdRaw) return res.status(401).json({ error: "Unauthorized" });

  const userId = toObjectId(userIdRaw);
  if (!userId) return res.status(400).json({ error: "Invalid user id" });

  try {
    const resumes = await Resume.find({ userId });

    res.json(resumes.map(r => ({
      id: r.resumeId,
      title: r.title,
      lastModified: r.lastModified,
      baseResumeInput: r.baseResumeInput,
      jobDescriptionInput: r.jobDescriptionInput,
      baseResumeData: r.baseResumeData,
      tailoredResumeData: r.tailoredResumeData,
      config: r.config,
      profileImage: r.profileImage
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});


app.post('/api/resumes', async (req, res) => {
  const userIdRaw = req.headers['x-user-id'];
  const resumeData = req.body;

  if (!userIdRaw) return res.status(401).json({ error: "Unauthorized" });

  const userId = toObjectId(userIdRaw);
  if (!userId) return res.status(400).json({ error: "Invalid user id" });

  if (!resumeData || !resumeData.id) {
    return res.status(400).json({ error: "Missing resume id (resumeData.id)" });
  }

  try {
    const updated = await Resume.findOneAndUpdate(
      { userId, resumeId: resumeData.id },
      {
        userId,
        resumeId: resumeData.id,
        title: resumeData.title,
        lastModified: resumeData.lastModified,
        baseResumeInput: resumeData.baseResumeInput,
        jobDescriptionInput: resumeData.jobDescriptionInput,
        baseResumeData: resumeData.baseResumeData,
        tailoredResumeData: resumeData.tailoredResumeData,
        config: resumeData.config,
        profileImage: resumeData.profileImage
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, resumeId: updated.resumeId });
  } catch (error) {
    console.error("❌ Failed to save resume:", error);
    return res.status(500).json({ error: "Failed to save resume" });
  }
});


app.delete('/api/resumes/:id', async (req, res) => {
  const userIdRaw = req.headers['x-user-id'];
  const resumeId = req.params.id;

  if (!userIdRaw) return res.status(401).json({ error: "Unauthorized" });

  const userId = toObjectId(userIdRaw);
  if (!userId) return res.status(400).json({ error: "Invalid user id" });

  try {
    await Resume.deleteOne({ userId, resumeId });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Delete failed" });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token || typeof token !== "string") return res.status(400).send("Missing token.");

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).send("Invalid or expired token.");

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    const baseClientUrl = (process.env.CLIENT_URL || "https://oneclickcvpro.com")
      .replace(/\/index\.html$/i, "")
      .replace(/\/+$/g, "");

    return res.redirect(`${baseClientUrl}/verified`);
  } catch (err) {
    return res.status(500).send("Server error.");
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ error: "Email already used" });

    const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,}$/;
    if (!passwordPattern.test(password || "")) {
      return res.status(400).json({
        error: "Password must be at least 8 characters and include 1 number and 1 uppercase letter.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await User.create({
      email: normalizedEmail,
      passwordHash,
      name,
      verificationToken,
      isVerified: false,
    });

    const baseBackendUrl = (process.env.BACKEND_URL || "https://oneclickcvpro-backend.onrender.com").replace(/\/+$/g, "");
    const verifyURL = `${baseBackendUrl}/api/auth/verify?token=${verificationToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "Verify your OneClickCV Pro account",
      html: `
        <h2>Verify your account</h2>
        <p>Click the link below to activate your account:</p>
        <a href="${verifyURL}" target="_blank" rel="noopener noreferrer">Verify Account</a>
      `,
    });

    return res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
});


app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return res.status(400).json({ error: "No user with that email" });
  if (!user.isVerified) return res.status(401).json({ error: "Email not verified" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Incorrect password" });

  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    credits: user.credits
  });
});

app.post("/api/credits/spend", async (req, res) => {
  try {
    const userIdRaw = req.headers["x-user-id"];
    const { reason } = req.body || {};

    if (!userIdRaw) return res.status(401).json({ error: "Unauthorized" });

    const userId = toObjectId(userIdRaw);
    if (!userId) return res.status(400).json({ error: "Invalid user id" });

    // Atomic decrement
    const user = await User.findOneAndUpdate(
      { _id: userId, credits: { $gt: 0 } },
      { $inc: { credits: -1 } },
      { new: true }
    );

    if (!user) {
      return res.status(402).json({ error: "Not enough credits" });
    }

    return res.json({
      success: true,
      credits: user.credits,
      reason: reason || null
    });
  } catch (err) {
    console.error("CREDITS SPEND ERROR:", err);
    return res.status(500).json({ error: "Failed to spend credit" });
  }
});

// --- PAYMENT ENDPOINTS ---

app.post('/create-checkout-session', async (req, res) => {
  const { priceId, amount, userId } = req.body; 

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${CLIENT_URL}/editor?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/editor?canceled=true&t=${Date.now()}`,
      metadata: {
        userId: userId,
        creditAmount: amount
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- ✅ ATOMIC MANUAL VERIFICATION WITH RETRY ---
app.post('/api/credits/verify-session', async (req, res) => {
  const { sessionId } = req.body;
  const userIdRaw = req.headers['x-user-id'];
  
  const userId = toObjectId(userIdRaw);
  if (!userId) return res.status(401).json({error: "Unauthorized"});

  try {
    console.log(`[Verify] Checking session ${sessionId} for user ${userId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Check if Stripe considers it paid
    if (session.payment_status === 'paid' || session.status === 'complete') {
       const amount = parseInt(session.metadata.creditAmount || '0');
       
       if (amount > 0) {
         // 1. Try ATOMIC update
         const updatedUser = await User.findOneAndUpdate(
            { _id: userId, processedSessions: { $ne: sessionId } }, 
            { 
               $inc: { credits: amount },
               $push: { processedSessions: sessionId }
            },
            { new: true }
         );
         
         if (updatedUser) {
            console.log(`✅ [Verify] Manually added ${amount} credits.`);
            return res.json({ success: true, credits: updatedUser.credits });
         } 
         
         // 2. If update failed (returned null), it means the Webhook likely already processed it.
         // BUT! Database read replicas might still show old data for a few milliseconds.
         // So we enter a "Wait Loop" to ensure we return the FRESH data.
         console.log(`ℹ️ [Verify] Session processed by webhook. Waiting for DB sync...`);
         
         for (let i = 0; i < 5; i++) {
            // Check if user has this session in processedSessions
            const freshUser = await User.findOne({ _id: userId, processedSessions: sessionId }).select("credits");
            if (freshUser) {
               console.log(`✅ [Verify] Found updated credits: ${freshUser.credits}`);
               return res.json({ success: true, credits: freshUser.credits });
            }
            // Wait 200ms and try again
            await new Promise(r => setTimeout(r, 200));
         }
       }

       // 3. Fallback: If after waiting we still don't see it (weird), just return whatever we have.
       const finalUser = await User.findById(userId).select("credits").lean();
       return res.json({ success: true, credits: finalUser?.credits || 0 });

    } else {
       return res.json({ success: false, message: "Payment pending or incomplete" });
    }
  } catch(e) {
    console.error("Manual verify error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// --- ✅ ATOMIC WEBHOOK ---
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userIdRaw = session.metadata.userId;
    const creditAmount = parseInt(session.metadata.creditAmount || '0');

    const userId = toObjectId(userIdRaw);

    if (userId && creditAmount > 0) {
      try {
         // Atomic update prevents race conditions
         const updatedUser = await User.findOneAndUpdate(
            { _id: userId, processedSessions: { $ne: session.id } },
            { 
               $inc: { credits: creditAmount },
               $push: { processedSessions: session.id }
            },
            { new: true }
         );

         if (updatedUser) {
            console.log(`✅ [Webhook] Atomic add: ${creditAmount} credits to ${userId}`);
            
            const mailOptions = {
              from: process.env.EMAIL_USER || 'noreply@oneclickcv.com',
              to: updatedUser.email,
              subject: `✅ Payment Confirmed - ${creditAmount} Credits Added`,
              html: `<h3>Payment Successful!</h3><p>Total Credits: ${updatedUser.credits}</p>`
            };
            transporter.sendMail(mailOptions, (e) => { if (e) console.error('Email failed:', e); });
         } else {
            console.log(`ℹ️ [Webhook] Session ${session.id} skipped (already processed).`);
         }
      } catch (err) {
        console.error('Database update failed:', err);
      }
    }
  }

  response.send();
});


app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
