const { sendBlackRockEmail } = require('../../api/_lib/email');
const { confirmationEmail } = require('../../api/_lib/templates');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { name, email, date, time, party, occasion, notes } = body;

  if (!email || !name) {
    return { statusCode: 400, body: 'Missing required fields: name, email' };
  }

  try {
    const { subject, bodyHtml, guestName } = confirmationEmail({ name, date, time, party: Number(party) || 2, occasion, notes });
    await sendBlackRockEmail({ to: email, subject, guestName, bodyHtml, type: 'reservation', ctaText: 'View Reservations', ctaUrl: 'https://blackrockrestaurantng.com/reservations' });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('[send-confirmation]', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
