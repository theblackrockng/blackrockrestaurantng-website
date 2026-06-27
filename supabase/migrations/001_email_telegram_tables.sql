-- Run this in the Supabase SQL editor to create the required tables

-- Maps Telegram message IDs to enquiries for reply detection
CREATE TABLE IF NOT EXISTS enquiry_telegram_messages (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_message_id BIGINT NOT NULL UNIQUE,
  enquiry_id          UUID REFERENCES enquiries(id) ON DELETE SET NULL,
  guest_email         TEXT NOT NULL,
  guest_name          TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enq_tg_message_id
  ON enquiry_telegram_messages(telegram_message_id);

-- Full audit log of every email sent
CREATE TABLE IF NOT EXISTS email_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email      TEXT NOT NULL,
  guest_name    TEXT,
  subject       TEXT NOT NULL,
  type          TEXT NOT NULL,
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at  ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type     ON email_logs(type);
