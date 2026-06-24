const { Resend } = require('resend');
const { enquiryReplyEmail } = require('./_lib/templates');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, message } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { error } = await resend.emails.send({
      from: 'BLACKROCK <reservations@blackrockrestaurantng.com>',
      to: [email],
      subject: `We received your enquiry — BLACKROCK`,
      html: enquiryReplyEmail({ name, message }),
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({ error: err.message });
  }
};
