"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateShowStatus } from "@/actions/show";
import type { ShowStatus } from "@prisma/client";

interface ShowStatusButtonsProps {
  showId: string;
  currentStatus: ShowStatus;
}

export function ShowStatusButtons({
  showId,
  currentStatus,
}: ShowStatusButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStatusChange(status: ShowStatus) {
    startTransition(async () => {
      const result = await updateShowStatus(showId, status);
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "OPEN" && (
        <>
          <Button
            onClick={() => handleStatusChange("FULL")}
            disabled={isPending}
            variant="default"
          >
            {isPending ? "Updating..." : "Mark as Full"}
          </Button>
          <Button
            onClick={() => handleStatusChange("CANCELLED")}
            disabled={isPending}
            variant="destructive"
          >
            {isPending ? "Updating..." : "Cancel Show"}
          </Button>
        </>
      )}

      {currentStatus === "FULL" && (
        <>
          <Button
            onClick={() => handleStatusChange("OPEN")}
            disabled={isPending}
            variant="outline"
          >
            {isPending ? "Updating..." : "Reopen"}
          </Button>
          <Button
            onClick={() => handleStatusChange("CANCELLED")}
            disabled={isPending}
            variant="destructive"
          >
            {isPending ? "Updating..." : "Cancel Show"}
          </Button>
        </>
      )}

      {currentStatus === "CANCELLED" && (
        <Button
          onClick={() => handleStatusChange("OPEN")}
          disabled={isPending}
          variant="outline"
        >
          {isPending ? "Updating..." : "Reopen"}
        </Button>
      )}
    </div>
  );
}
