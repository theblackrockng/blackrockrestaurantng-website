# The BlackRock Lagos — Website PRD

## Original Problem Statement
> "Can you help me make this webpage more premium, sleeky and more fancy to interact with. Replace the logo."

User provided: BlackRock Lagos logo (theblackrocklagos.png) + Website Architecture HTML document for a premium restaurant/lounge/rooftop in Ikeja, Lagos.

## User Choices (initial build)
- **Scope:** Full 6-page site (Home, About, Menu, Reservations, Gallery, Contact)
- **Reservation backend:** UI-only (success modal, no DB persistence)
- **Imagery:** Curated Unsplash (moody, premium)

## Architecture / Stack
- Frontend: React 19 + React Router v7 + Tailwind + framer-motion + lucide-react
- Backend: FastAPI template (untouched — no reservation API yet)
- DB: MongoDB (unused)
- Routes: `/`, `/about`, `/menu`, `/reservations`, `/gallery`, `/contact`

## Design System (locked-in)
- Palette: burgundy `#7a1c1c`, gold `#c8a96e`, charcoal `#1a1a1a`, warm-white `#faf8f5`, cream `#f2ede6`
- Fonts: Cormorant Garamond (display, italic) + DM Sans (body)
- Custom buttons: `.btn-burgundy`, `.btn-outline-gold`, `.btn-ghost-dark`
- Components: occasion cards, gold-line divider, grain overlay, ken-burns hero, marquee strip

## What's Implemented (2026-05-24)
- Premium Navbar with transparent → opaque scroll transition, mobile hamburger menu
- **Home:** full-bleed ken-burns hero, brand statement, occasion preview (4), kitchen feature, three spaces (Restaurant/Lounge/Rooftop), testimonial, Instagram marquee, location with map
- **About:** dark hero, opening statement, three detailed space sections, philosophy values, social-proof numbers, CTA
- **Menu:** 5 category tabs (Starters/Mains/Grills/Desserts/Drinks) with sticky tabs, animated content swap, 18 dishes with Naira pricing
- **Reservations:** 3-step flow — occasion selector (8 occasions) → dynamic form (or concierge branch for proposal/private-dining) → success modal with confirmation
  - Dynamic fields per occasion (birthday, corporate, anniversary, special)
  - Pre-select via `?occasion=<id>` query param
- **Gallery:** filterable grid (6 tags) with lightbox + "Daylight & After Dark" feature
- **Contact:** 4 contact methods (call/WhatsApp/email/visit), opening hours, general enquiry form, embedded map
- **Footer:** brand, visit info, hours, navigation, Instagram link
- Floating WhatsApp button on every page
- Logo replaced with BlackRock Lagos artwork; inverted to white on dark hero, dark elsewhere

## Test Status (iteration_1)
- Frontend: 95% pass. One HIGH issue (Tailwind opacity modifier on CSS var) — **FIXED** by switching to inline `style={{ backgroundColor: 'rgba(250,248,245,0.95)' }}` on navbar and menu sticky tabs.
- Backend: not tested (template only).

## Prioritized Backlog
### P1 — Next iteration candidates
- Persist reservations to MongoDB (`POST /api/reservations`) + admin view
- Real email confirmation flow (Resend/SendGrid) — 4-email sequence per architecture
- Replace stock imagery with real BlackRock photography
- Real Google Maps embed with verified coordinates

### P2 — Polish
- Image preloader / blur-up for hero
- SEO meta tags + OpenGraph cards per page
- Newsletter capture in footer
- Press / awards page
- 404 / NotFound route
- Refactor `step === 2.5` to a named state machine in Reservations.jsx

### P3 — Growth
- Gift voucher purchase flow
- Private events enquiry funnel with calendar integration
- Loyalty / member program
