import { Hero } from "@/components/landing/hero";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleCheck, BookOpen, Music } from "lucide-react";

const features = [
  {
    icon: CircleCheck,
    title: "Match",
    description:
      "Connect with artists and venues that fit your sound, size, and schedule.",
  },
  {
    icon: BookOpen,
    title: "Book",
    description:
      "Secure shows by finding the right talent and locking in your lineup.",
  },
  {
    icon: Music,
    title: "Play",
    description: "Take the stage with confidence and bring your sound to life.",
  },
] as const;

const pricingTiers = [
  {
    name: "Basic",
    price: "$0",
    featured: false,
    items: ["List Item", "List Item", "List Item", "List Item", "List Item"],
  },
  {
    name: "Pro",
    price: "$10",
    featured: false,
    items: ["List Item", "List Item", "List Item", "List Item", "List Item"],
  },
  {
    name: "Pro +",
    price: "$20",
    featured: true,
    items: ["List Item", "List Item", "List Item", "List Item", "List Item"],
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {/* Nav */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-lg font-bold tracking-tight">Backline</span>
      </header>

      {/* Hero */}
      <Hero />

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border-border/60 flex flex-col items-center text-center"
            >
              <Icon className="size-10 text-primary" />
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardContent>
                <CardDescription className="text-base">
                  {description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {pricingTiers.map(({ name, price, featured, items }) => (
            <Card
              key={name}
              className={
                featured ? "border-primary bg-card" : "border-border/60 bg-card"
              }
            >
              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <CardTitle className="text-xl">{name}</CardTitle>
                  <p className="text-2xl font-bold">
                    {price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="space-y-2 text-sm">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Backline</span>
        {" — "}Connect artists &amp; venues.
      </footer>
    </div>
  );
}
