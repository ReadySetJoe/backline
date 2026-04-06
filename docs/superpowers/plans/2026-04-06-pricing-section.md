# Pricing Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder pricing section on the landing page with a role-toggled (Artists/Venues) pricing display showing Free and Pro tiers with real feature copy.

**Architecture:** A single client component (`Pricing`) with a shadcn Tabs toggle (requires `"use client"` because Tabs use client-side interactivity). Pricing data is co-located in the component as static arrays. The parent `page.tsx` imports and renders it, replacing the old inline pricing cards.

**Tech Stack:** Next.js, React, shadcn/ui (Tabs, Card, Badge, Button), lucide-react (Check), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-06-pricing-section-design.md`

---

## File Structure

| Action | File                                 | Responsibility                                                                          |
| ------ | ------------------------------------ | --------------------------------------------------------------------------------------- |
| Create | `src/components/landing/pricing.tsx` | Client component: role toggle + pricing cards                                           |
| Modify | `src/app/page.tsx`                   | Remove `pricingTiers` const and inline pricing section; import and render `<Pricing />` |

---

### Task 1: Create the Pricing component

**Files:**

- Create: `src/components/landing/pricing.tsx`

- [ ] **Step 1: Create the pricing data and types**

Create `src/components/landing/pricing.tsx` with the static pricing data:

```tsx
"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  inheritedFeatures?: string[];
  cta: string;
  recommended?: boolean;
}

const artistTiers: PricingTier[] = [
  {
    name: "Free",
    price: "Free",
    description: "Everything you need to find your next gig",
    features: [
      "Smart matching with local shows",
      "Messaging with matched venues",
      "Artist profile with bio, genres, and location",
      "Browse and like shows",
      "Up to 5 active likes at a time",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$9",
    period: "/mo",
    description: "Stand out and get booked faster",
    inheritedFeatures: ["Everything in Free"],
    features: [
      "Unlimited active likes",
      "Priority placement in venue match feeds",
      "Enhanced profile with embedded music player & EPK",
      "Match insights — see how you scored and why",
      "Early access to new show listings (24hr head start)",
    ],
    cta: "Start Free Trial",
    recommended: true,
  },
];

const venueTiers: PricingTier[] = [
  {
    name: "Free",
    price: "Free",
    description: "Start finding artists for your shows",
    features: [
      "Up to 2 active shows at a time",
      "Smart matching with local artists",
      "Messaging with matched artists",
      "Venue profile with capacity, genres, and amenities",
      "Browse and like artists for your shows",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "Fill every slot with the perfect artist",
    inheritedFeatures: ["Everything in Free"],
    features: [
      "Unlimited active shows",
      "Featured show badge in artist feeds",
      "Advanced artist filters (draw, type, set length)",
      "Booking analytics dashboard",
      "Priority support",
    ],
    cta: "Start Free Trial",
    recommended: true,
  },
];
```

- [ ] **Step 2: Add the PricingCard subcomponent**

Append below the data arrays in the same file:

```tsx
function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <Card
      className={
        tier.recommended
          ? "border-primary relative flex flex-col"
          : "border-border/60 flex flex-col"
      }
    >
      {tier.recommended && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Recommended
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{tier.name}</CardTitle>
        <p className="text-3xl font-bold">
          {tier.price}
          {tier.period && (
            <span className="text-sm font-normal text-muted-foreground">
              {tier.period}
            </span>
          )}
        </p>
        <CardDescription className="text-sm">
          {tier.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="space-y-3 text-sm">
          {tier.inheritedFeatures?.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-muted-foreground"
            >
              <Check className="mt-0.5 size-4 shrink-0" />
              {feature}
            </li>
          ))}
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          className="w-full"
          variant={tier.recommended ? "default" : "outline"}
        >
          <Link href="/signup">{tier.cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

- [ ] **Step 3: Add the exported Pricing component with tabs**

Append the main export at the bottom of the file:

```tsx
export function Pricing() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-2 text-muted-foreground">
          Start free. Upgrade when you&apos;re ready.
        </p>
      </div>

      <Tabs defaultValue="venues" className="w-full items-center">
        <TabsList>
          <TabsTrigger value="venues">For Venues</TabsTrigger>
          <TabsTrigger value="artists">For Artists</TabsTrigger>
        </TabsList>

        <TabsContent value="venues">
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {venueTiers.map((tier) => (
              <PricingCard key={tier.name} tier={tier} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="artists">
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {artistTiers.map((tier) => (
              <PricingCard key={tier.name} tier={tier} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Verify the file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to `pricing.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/pricing.tsx
git commit -m "feat: add Pricing component with role toggle and tier cards"
```

---

### Task 2: Wire up Pricing in the landing page

**Files:**

- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the pricing section in page.tsx**

In `src/app/page.tsx`, make all of these edits together:

1. Add import at top: `import { Pricing } from "@/components/landing/pricing";`
2. Remove the entire `pricingTiers` const (lines 31-50). Keep the `CircleCheck` import — it is still used by the `features` array.
3. Replace the `{/* Pricing */}` section block (the `<section>` containing the `pricingTiers.map`) with:

```tsx
{
  /* Pricing */
}
<section className="mx-auto w-full max-w-5xl px-6 pb-24">
  <Pricing />
</section>;
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace placeholder pricing with role-toggled Pricing component"
```

---

### Task 3: Visual verification

- [ ] **Step 1: Start dev server and verify**

Run: `npm run dev`

Open `http://localhost:3000` and verify:

1. Pricing section shows "Simple, Transparent Pricing" heading
2. "For Venues" tab is selected by default showing Free + Pro cards
3. Clicking "For Artists" swaps to artist tier cards
4. Pro cards have "Recommended" badge and primary border
5. Free features in Pro cards are muted
6. CTA buttons link to `/signup`
7. Cards stack on mobile, side by side on desktop
8. Overall visual consistency with the rest of the page

- [ ] **Step 2: Final commit if any touch-ups needed**

Only if visual adjustments were made.
