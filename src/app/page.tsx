import { Hero } from "@/components/landing/hero";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Sparkles, CalendarCheck, MessageCircle } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Smart Matching",
    description:
      "We connect you with artists and venues that fit your sound, size, and schedule.",
  },
  {
    icon: CalendarCheck,
    title: "Book Shows Easily",
    description:
      "Create shows, find the right talent, and lock in your lineup.",
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    description:
      "Chat directly with your matches to work out the details.",
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
            <Card key={title} className="border-border/60">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {description}
                </CardDescription>
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
