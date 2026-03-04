import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <Image
        src="/concert-crowd.jpg"
        alt="Concert crowd with hands raised under stage lights"
        fill
        className="object-cover"
        priority
      />

      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-background/60" />

      {/* Top gradient blending into nav */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-linear-to-b from-background to-transparent" />

      {/* Bottom gradient blending into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-linear-to-t from-background to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-6 py-32 text-center sm:py-40 md:py-48">
        <div className="flex flex-col items-center gap-4">
          <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            <span className="block">Match.</span>
            <span className="block">Book.</span>
            <span className="block">Play.</span>
          </h1>
          <p className="max-w-xl text-lg text-white/90 sm:text-xl">
            Connecting artists and venues the easy way.
          </p>
        </div>
        <div className="flex gap-3 sm:gap-4">
          <Button asChild size="lg" variant="outline" className="text-base">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild size="lg" className="text-base">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
