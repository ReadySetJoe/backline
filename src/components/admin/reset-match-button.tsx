"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resetMatch } from "@/actions/admin";

interface ResetMatchButtonProps {
  matchId: string;
  artistName: string;
}

export function ResetMatchButton({
  matchId,
  artistName,
}: ResetMatchButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const result = await resetMatch(matchId);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error ?? "Failed to reset");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Reset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Match</DialogTitle>
          <DialogDescription>
            Reset match for {artistName} back to Suggested?
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleReset} disabled={isPending}>
            {isPending ? "Resetting..." : "Reset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
