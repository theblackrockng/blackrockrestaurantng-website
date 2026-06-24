const { Resend } = require('resend');
const { confirmationEmail } = require('./_lib/templates');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, date, time, party, occasion, notes } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required fields: name, email' });
  }

  try {
    const { error } = await resend.emails.send({
      from: 'BLACKROCK <reservations@blackrockrestaurantng.com>',
      to: [email],
      subject: `Your reservation is confirmed — ${occasion || 'BLACKROCK'}`,
      html: confirmationEmail({ name, date, time, party: Number(party) || 2, occasion, notes }),
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
