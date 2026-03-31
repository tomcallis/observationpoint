# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `site/` directory:

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

No test framework is configured.

## Architecture

Single-property vacation rental site built on Next.js (App Router) + React 19 + TypeScript + Tailwind CSS v4.

### Single source of truth

**`site/config/property.ts`** — all property content lives here: seasonal rates, amenities, reviews, FAQs, guidebook content, payment terms. Components import from this file; avoid hardcoding content elsewhere.

### Key directories

- `site/app/` — Next.js App Router pages and API routes
- `site/components/sections/` — one component per page section (Hero, Gallery, Booking, etc.)
- `site/components/ui/` — shared UI: NavBar, AvailabilityCalendar, BookingModal
- `site/lib/` — server-only utilities: `ical.ts` (VRBO feed), `pricing.ts` (rate calc)
- `site/data/weekly-prices.json` — per-date rate overrides managed via `/admin`

### Availability & booking flow

1. **VRBO sync**: `lib/ical.ts::getBlockedRanges()` fetches the VRBO iCal feed server-side (ISR, 15-min revalidation) and returns blocked date ranges. The iCal URL never reaches the browser.
2. **Calendar**: `components/ui/AvailabilityCalendar.tsx` — Saturday-only, 7-night minimum. Tile classes: `checkout-tile` (checkout-only Saturday), `checkin-tile` (checkin-only Saturday, selectable as checkout), `booked-tile` (back-to-back or interior).
3. **Pricing**: `lib/pricing.ts::getPriceForStay()` — matches check-in date to seasonal bucket in `property.ts`, checks `weekly-prices.json` overrides, applies 12.75% tax.
4. **Booking modal**: `components/ui/BookingModal.tsx` — 4-step form (agree → details → payment → confirm). On submit, calls `POST /api/booking`.
5. **Email**: `app/api/booking/route.ts` — sends two concurrent Resend emails (owner notification + guest confirmation). Falls back to `mailto:` if Resend unavailable.

### Password-gated routes

- `/guidebook` — guest guidebook; password from `GUIDEBOOK_PASSWORD` env var, stored in `sessionStorage`
- `/admin` — weekly pricing overrides; password from `NEXT_PUBLIC_ADMIN_PASSWORD` env var

### Environment variables

| Variable | Purpose |
|---|---|
| `VRBO_ICAL_URL` | VRBO iCal feed (server-only) |
| `RESEND_API_KEY` | Email service |
| `RESEND_FROM_EMAIL` | Sender address |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Owner email (exposed to browser) |
| `GUIDEBOOK_PASSWORD` | Guidebook unlock password |
| `GUIDEBOOK_DOOR_CODE` | Door code shown in guidebook |
| `GUIDEBOOK_WIFI_NAME` | WiFi SSID shown in guidebook |
| `GUIDEBOOK_WIFI_PASSWORD` | WiFi password shown in guidebook |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Admin panel password |
