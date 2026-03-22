import express from 'express';
import Contact from '../models/Contact.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// ================= POST CONTACT =================
router.post('/submit', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // ✅ Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // ✅ Save to DB (safe)
    let savedContact;
    try {
      const newContact = new Contact({ name, email, message });
      savedContact = await newContact.save();
      console.log('✅ Contact saved:', savedContact._id);
    } catch (dbError) {
      console.error('❌ DB Save Error:', dbError);
      return res.status(500).json({ error: 'Database error.' });
    }

    // ================= EMAIL (NON-BLOCKING) =================
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      (async () => {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS, // MUST be App Password
            },
          });

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `New Portfolio Message from ${name}`,
            html: `
              <h2>New Contact Message</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Message:</strong><br/>${message}</p>
            `,
          });

          console.log('✅ Email sent');
        } catch (emailError) {
          console.error('❌ Email Error:', emailError.message);
        }
      })(); // 🔥 NON-BLOCKING
    }

    // ✅ Respond immediately (don’t wait for email)
    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
    });

  } catch (error) {
    console.error('❌ Contact Route Crash:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ================= ADMIN ROUTE =================
router.get('/submissions', async (req, res) => {
  try {
    const secretKey = req.headers['x-admin-key'];

    if (secretKey !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const messages = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ Fetch Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;