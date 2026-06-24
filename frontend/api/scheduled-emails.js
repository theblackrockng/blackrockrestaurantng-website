/**
 * Vercel Cron Job — runs daily at 07:00 UTC (8AM WAT).
 * Sends reminder (24–48h before), day-of welcome, and post-dining thank-you emails.
 * Configured in vercel.json under "crons".
 */

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const { reminderEmail, dayOfEmail, thankYouEmail } = require('./_lib/templates');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

function todayUTC() {
  return new Date().toISOString().split('T')[0];
}

async function send({ to, subject, html, tag }) {
  const { error } = await resend.emails.send({
    from: 'BLACKROCK <reservations@blackrockrestaurantng.com>',
    to: [to],
    subject,
    html,
  });
  if (error) {
    console.error(`[${tag}] Resend error for ${to}:`, error);
    return false;
  }
  return true;
}

async function markSent(id, column) {
  const { error } = await supabase
    .from('reservations')
    .update({ [column]: true })
    .eq('id', id);
  if (error) console.error(`markSent(${column}) failed for id ${id}:`, error);
}

module.exports = async function handler(req, res) {
  // Vercel passes Authorization: Bearer <CRON_SECRET> for cron requests
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = todayUTC();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);
  const yesterday = addDays(today, -1);

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .in('status', ['pending', 'confirmed'])
    .gte('date', yesterday)
    .lte('date', dayAfter);

  if (error) {
    console.error('Supabase fetch error:', error);
    return res.status(500).json({ error: error.message });
  }

  let sent = 0;
  let failed = 0;

  for (const r of reservations || []) {
    // EMAIL 2: REMINDER (tomorrow or day-after)
    if ((r.date === tomorrow || r.date === dayAfter) && !r.reminder_sent && r.email) {
      const ok = await send({
        to: r.email,
        subject: `Reminder — your table at BLACKROCK is ${r.date === tomorrow ? 'tomorrow' : 'in 2 days'}`,
        html: reminderEmail({ name: r.name, date: r.date, time: r.time, party: Number(r.party) || 2, occasion: r.occasion }),
        tag: 'REMINDER',
      });
      if (ok) { await markSent(r.id, 'reminder_sent'); sent++; } else { failed++; }
    }

    // EMAIL 3: DAY-OF (dining today)
    if (r.date === today && !r.day_of_sent && r.email) {
      const ok = await send({
        to: r.email,
        subject: `Tonight at BLACKROCK — your table is ready, ${(r.name || '').split(' ')[0]}`,
        html: dayOfEmail({ name: r.name, date: r.date, time: r.time, party: Number(r.party) || 2, occasion: r.occasion }),
        tag: 'DAY-OF',
      });
      if (ok) { await markSent(r.id, 'day_of_sent'); sent++; } else { failed++; }
    }

    // EMAIL 4: THANK YOU (dined yesterday)
    if (r.date === yesterday && !r.thankyou_sent && r.email) {
      const ok = await send({
        to: r.email,
        subject: `Thank you for dining with us — BLACKROCK`,
        html: thankYouEmail({ name: r.name, occasion: r.occasion }),
        tag: 'THANK-YOU',
      });
      if (ok) { await markSent(r.id, 'thankyou_sent'); sent++; } else { failed++; }
    }
  }

  console.log(`Done. Sent: ${sent}, Failed: ${failed}, Checked: ${(reservations || []).length}`);
  return res.status(200).json({ sent, failed });
};
