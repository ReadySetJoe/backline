"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setRole } from "@/actions/auth";

export function RoleSelection() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(role: "ARTIST" | "VENUE") {
    setError(null);
    startTransition(async () => {
      const result = await setRole(role);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Welcome! What describes you best?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-24 text-lg"
              onClick={() => handleSelect("ARTIST")}
              disabled={isPending}
            >
              I&apos;m an Artist
            </Button>
            <Button
              variant="outline"
              className="h-24 text-lg"
              onClick={() => handleSelect("VENUE")}
              disabled={isPending}
            >
              I&apos;m a Venue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
