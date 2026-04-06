# Pricing Section Design

## Overview

Marketing-only pricing section for the Backline landing page. Role-specific tiers shown via a toggle (Artists / Venues). No payment processing — all CTAs funnel to signup. Venues are the primary revenue target.

## Pricing Tiers

### Artist Tiers

**Free (Always Free)**

- Smart matching with local shows
- Messaging with matched venues
- Artist profile with bio, genres, and location
- Browse and like shows
- Up to 5 active likes at a time

**Pro ($9/mo)**

- Everything in Free
- Unlimited active likes
- Priority placement in venue match feeds
- Enhanced profile: embedded music player, electronic press kit (EPK)
- Match insights: see how you scored and why
- Early access to new show listings (24hr head start)

### Venue Tiers

**Free (Always Free)**

- Up to 2 active shows at a time
- Smart matching with local artists
- Messaging with matched artists
- Venue profile with capacity, genres, and amenities
- Browse and like artists for your shows

**Pro ($29/mo)**

- Everything in Free
- Unlimited active shows
- Featured show badge (stands out in artist feeds)
- Advanced artist filters (by draw estimate, artist type, set length)
- Booking analytics dashboard
- Priority support

## Landing Page UI

### Layout

- Replace existing 3-card placeholder pricing section
- Tabbed section with pill toggle: "For Artists" / "For Venues"
- Two pricing cards below the toggle (Free + Pro for selected role)
- Default tab: "For Venues" (primary paying customer)

### Card Design

- Reuse existing shadcn/ui `Card` components
- Pro card highlighted with `border-primary` and "Recommended" badge
- Each card: tier name, price, one-liner description, feature checklist, CTA button
- Free CTA: "Get Started" → `/signup`
- Pro CTA: "Start Free Trial" → `/signup` (placeholder, no trial logic)

### Feature List Style

- Checkmark icon (lucide `Check`) + feature text
- Pro card: inherited Free features shown in muted text, Pro-only features in normal weight

### Responsive

- Two cards side by side on desktop (`sm:grid-cols-2`)
- Stack vertically on mobile

## Scope

- **In scope**: Landing page pricing section UI only (marketing)
- **Out of scope**: Payment processing, Stripe integration, subscription database models, feature gating in the app

## Implementation

### Files to modify

- `src/app/page.tsx` — replace placeholder pricing section with new component reference
- New: `src/components/landing/pricing.tsx` — "use client" component with role toggle and pricing cards

### Dependencies

- shadcn/ui: Card, Tabs (or custom toggle buttons)
- lucide-react: Check icon
- No new packages needed
