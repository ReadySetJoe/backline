"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userEmail: string;
  profileName?: string | null;
}

export function Header({ userEmail, profileName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Mobile: show app name; Desktop: empty (sidebar has branding) */}
      <div className="md:hidden text-lg font-bold">Backline</div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {profileName || userEmail}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
