const { sendBlackRockEmail } = require('./_lib/email');
const { confirmationEmail } = require('./_lib/templates');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { name, email, date, time, party, occasion, notes } = req.body || {};
  if (!email || !name) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const { subject, bodyHtml, guestName } = confirmationEmail({ name, date, time, party: Number(party) || 2, occasion, notes });
    await sendBlackRockEmail({ to: email, subject, guestName, bodyHtml, type: 'reservation', ctaText: 'View Reservations', ctaUrl: 'https://blackrockrestaurantng.com/reservations' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[send-confirmation]', err);
    return res.status(500).json({ error: err.message });
  }
};
