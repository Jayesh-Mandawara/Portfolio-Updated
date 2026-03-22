import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import contactRoutes from './routes/contact.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= MIDDLEWARE =================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'https://portfolio-7bc5.onrender.com'],
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());

// Serve static frontend (only if you actually built it)
app.use(express.static(path.join(__dirname, 'public')));

// ================= ROUTES =================
app.use('/api/contact', contactRoutes);

// ================= START SERVER (IMPORTANT) =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

// ================= CATCH-ALL =================
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
