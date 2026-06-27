const { sendBlackRockEmail } = require('./_lib/email');
const { enquiryReplyEmail } = require('./_lib/templates');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { name, email, message } = req.body || {};
  if (!email || !name) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const { subject, bodyHtml, guestName } = enquiryReplyEmail({ name, message });
    await sendBlackRockEmail({ to: email, subject, guestName, bodyHtml, type: 'enquiry' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[send-enquiry-reply]', err);
    return res.status(500).json({ error: err.message });
  }
};
