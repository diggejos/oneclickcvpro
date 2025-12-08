
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

// Initialize Stripe with Secret Key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// --- EMAIL SETUP ---
// Configure email transporter (using Gmail or your email service)
// For Gmail: use an App Password (not your regular password)
// For other services: update host, port, auth as needed
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Test email connection (logs at startup)
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ Email service not configured:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

const app = express();
const PORT = process.env.PORT || 4242;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "1040938691698-o9k428s47iskgq1vs6rk1dnc1857tnir.apps.googleusercontent.com";

// --- MIDDLEWARE ---
// Stripe Webhook needs raw body, so we handle that specifically
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(cors({
  origin: true,       // reflect the request's origin
  credentials: false, // we don't use cookies for this API
}));

// --- DATABASE CONNECTION ---
// You must set MONGODB_URI in your environment variables
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

  // For normal signup
  passwordHash: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,

  // For Google OAuth
  googleId: String,
  name: String,
  avatar: String,

  credits: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now }
});

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId: { type: String, required: true }, // Frontend UUID
  title: String,
  lastModified: Number,
  baseResumeInput: Object,
  jobDescriptionInput: Object,
  baseResumeData: Object,
  tailoredResumeData: Object,
  config: Object,
  profileImage: String
});

const User = mongoose.model('User', userSchema);
const Resume = mongoose.model('Resume', resumeSchema);

// --- AUTHENTICATION ENDPOINTS ---

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  try {
    // Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or Create User
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ googleId, email, name, avatar: picture });
      await user.save();
    } else {
      // Update info if changed
      user.avatar = picture;
      user.name = name;
      await user.save();
    }

    // Return user data (including real DB credits)
    res.json({
      id: user._id, // MongoID
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
  const userId = req.headers['x-user-id']; // Simple header auth for this demo
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const resumes = await Resume.find({ userId });
    // Transform back to frontend shape if needed
    const frontendResumes = resumes.map(r => ({
      id: r.resumeId,
      title: r.title,
      lastModified: r.lastModified,
      baseResumeInput: r.baseResumeInput,
      jobDescriptionInput: r.jobDescriptionInput,
      baseResumeData: r.baseResumeData,
      tailoredResumeData: r.tailoredResumeData,
      config: r.config,
      profileImage: r.profileImage
    }));
    res.json(frontendResumes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

app.post('/api/resumes', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const resumeData = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Upsert (Update if exists, Insert if new) based on resumeId + userId
    await Resume.findOneAndUpdate(
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
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save resume" });
  }
});

app.delete('/api/resumes/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const resumeId = req.params.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await Resume.deleteOne({ userId, resumeId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});


// --- Signup Route (Email + Password) ---

const bcrypt = require('bcrypt');
const crypto = require('crypto');

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: "Email already used" });

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    email,
    passwordHash,
    name,
    verificationToken,
    isVerified: false
  });

  // Send email
  const verifyURL = `${CLIENT_URL}/verify?token=${verificationToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your OneClickCV Pro account",
    html: `
      <h2>Verify your account</h2>
      <p>Click the link below to activate your account:</p>
      <a href="${verifyURL}" target="_blank">Verify Account</a>
    `
  });

  res.json({ message: "Verification email sent" });
});
// --- VERIFICATION ROUTE ---
app.get('/api/auth/verify', async (req, res) => {
  const token = req.query.token;

  const user = await User.findOne({ verificationToken: token });
  if (!user) return res.status(400).json({ error: "Invalid token" });

  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  res.redirect(`${CLIENT_URL}/verified`);
});
// --- EMAIL LOGIN ROUTE ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
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

// --- PAYMENT ENDPOINTS ---

app.post('/create-checkout-session', async (req, res) => {
  const { priceId, amount, userId } = req.body; // userId passed from frontend

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${CLIENT_URL}/?success=true`,
      cancel_url: `${CLIENT_URL}/?canceled=true`,
      // Attach UserID to metadata so Webhook knows who to credit
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

// --- STRIPE WEBHOOK (Secure Fulfillment) ---
// This endpoint runs automatically when Stripe confirms payment
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    // Verify the webhook signature using your Secret from Stripe Dashboard
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Retrieve metadata
    const userId = session.metadata.userId;
    const creditAmount = parseInt(session.metadata.creditAmount || '0');

    if (userId && creditAmount > 0) {
      try {
        // Update User Credits in DB
        const user = await User.findById(userId);
        if (user) {
          user.credits += creditAmount;
          await user.save();
          console.log(`✅ Added ${creditAmount} credits to user ${userId}`);

          // Send confirmation email
          const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@oneclickcv.com',
            to: user.email,
            subject: `✅ Payment Confirmed - ${creditAmount} Credits Added to Your Account`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Payment Successful!</h2>
                <p>Hi <strong>${user.name || 'there'}</strong>,</p>
                <p>Your payment has been processed successfully. Here are the details:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Credits Added:</strong> <span style="font-size: 24px; color: #4CAF50;">${creditAmount}</span></p>
                  <p><strong>Total Credits:</strong> ${user.credits}</p>
                  <p><strong>Amount Paid:</strong> $${(creditAmount * 1.0).toFixed(2)}</p>
                </div>
                <p>You can now use these credits to:</p>
                <ul>
                  <li>Generate AI-tailored resumes</li>
                  <li>Get expert feedback and suggestions</li>
                  <li>Create multiple resume versions</li>
                </ul>
                <p>Thank you for supporting OneClickCV Pro!</p>
                <p style="color: #888; font-size: 12px; margin-top: 30px;">
                  If you have any questions, reply to this email or visit our support page.
                </p>
              </div>
            `
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('❌ Email send failed:', error);
            } else {
              console.log('✅ Confirmation email sent to', user.email);
            }
          });
        }
      } catch (err) {
        console.error('Database update failed:', err);
      }
    }
  }

  response.send();
});


app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
