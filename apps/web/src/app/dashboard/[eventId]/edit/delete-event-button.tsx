"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { deleteEvent } from "@/server/events";

export function DeleteEventButton({ eventId, title }: { eventId: string; title: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="danger"
      className="mt-5"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete "${title}" and all of its guests? This can't be undone.`)) {
          startTransition(() => deleteEvent(eventId));
        }
      }}
    >
      {pending ? "Deleting…" : "Delete event"}
    </Button>
  );
}
