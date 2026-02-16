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
import { cancelShow } from "@/actions/admin";

interface CancelShowButtonProps {
  showId: string;
  title: string;
}

export function CancelShowButton({ showId, title }: CancelShowButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelShow(showId);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error ?? "Failed to cancel");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Cancel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Show</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel {title}?
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            No, keep it
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? "Cancelling..." : "Yes, cancel show"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
