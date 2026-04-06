import { Hero } from "@/components/landing/hero";
import { Pricing } from "@/components/landing/pricing";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
        <Pricing />
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Backline</span>
        {" — "}Connect artists &amp; venues.
      </footer>
    </div>
  );
}
