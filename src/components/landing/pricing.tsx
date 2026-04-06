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
