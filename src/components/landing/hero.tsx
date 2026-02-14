import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Mic2 } from "lucide-react";

export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center gap-8 px-6 py-24 text-center sm:py-32 md:py-40">
      <div className="flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <Music className="size-4" />
          <span>Live music, connected</span>
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Find Your Next Show
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
          Backline connects artists and venues to book live shows. No more cold
          emails, no more guesswork — just the right match.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button asChild size="lg" className="gap-2 text-base">
          <Link href="/signup">
            <Mic2 className="size-5" />
            I&apos;m an Artist
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="gap-2 text-base">
          <Link href="/signup">
            <Music className="size-5" />
            I&apos;m a Venue
          </Link>
        </Button>
      </div>
    </section>
  );
}
