/**
 * Daily cron — runs every day at 8:00 AM WAT (07:00 UTC).
 * Sends reminder (24–48h before), day-of welcome, and post-dining thank-you emails.
 */

const { createClient } = require('@supabase/supabase-js');
const { sendBlackRockEmail } = require('../../api/_lib/email');
const { reminderEmail, dayOfEmail, thankYouEmail } = require('../../api/_lib/templates');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

function todayUTC() {
  return new Date().toISOString().split('T')[0];
}

async function markSent(id, column) {
  const { error } = await supabase
    .from('reservations')
    .update({ [column]: true })
    .eq('id', id);
  if (error) console.error(`markSent(${column}) failed for id ${id}:`, error);
}

exports.handler = async () => {
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
    return { statusCode: 500, body: error.message };
  }

  let sent = 0;
  let failed = 0;

  for (const r of reservations || []) {
    // ── EMAIL 2: REMINDER (send if dining tomorrow or day-after, not yet sent) ──
    if ((r.date === tomorrow || r.date === dayAfter) && !r.reminder_sent && r.email) {
      try {
        const t = reminderEmail({ name: r.name, date: r.date, time: r.time, party: Number(r.party) || 2, occasion: r.occasion });
        const daySubject = r.date === tomorrow
          ? 'Reminder — your table at BLACKROCK is tomorrow'
          : 'Reminder — your table at BLACKROCK is in 2 days';
        await sendBlackRockEmail({ to: r.email, subject: daySubject, guestName: t.guestName, bodyHtml: t.bodyHtml, type: 'reservation' });
        await markSent(r.id, 'reminder_sent');
        sent++;
      } catch (err) {
        console.error(`[REMINDER] Failed for ${r.email}:`, err);
        failed++;
      }
    }

    // ── EMAIL 3: DAY-OF (send if dining today, not yet sent) ──
    if (r.date === today && !r.day_of_sent && r.email) {
      try {
        const t = dayOfEmail({ name: r.name, date: r.date, time: r.time, party: Number(r.party) || 2, occasion: r.occasion });
        const firstName = (r.name || '').split(' ')[0];
        await sendBlackRockEmail({ to: r.email, subject: `Tonight at BLACKROCK — your table is ready, ${firstName}`, guestName: t.guestName, bodyHtml: t.bodyHtml, type: 'reservation' });
        await markSent(r.id, 'day_of_sent');
        sent++;
      } catch (err) {
        console.error(`[DAY-OF] Failed for ${r.email}:`, err);
        failed++;
      }
    }

    // ── EMAIL 4: THANK YOU (send if dined yesterday, not yet sent) ──
    if (r.date === yesterday && !r.thankyou_sent && r.email) {
      try {
        const t = thankYouEmail({ name: r.name, occasion: r.occasion });
        await sendBlackRockEmail({ to: r.email, subject: `Thank you for dining with us — BLACKROCK`, guestName: t.guestName, bodyHtml: t.bodyHtml, type: 'reservation' });
        await markSent(r.id, 'thankyou_sent');
        sent++;
      } catch (err) {
        console.error(`[THANK-YOU] Failed for ${r.email}:`, err);
        failed++;
      }
    }
  }

  console.log(`Scheduled emails done. Sent: ${sent}, Failed: ${failed}, Total reservations checked: ${(reservations || []).length}`);
  return { statusCode: 200, body: JSON.stringify({ sent, failed }) };
};
