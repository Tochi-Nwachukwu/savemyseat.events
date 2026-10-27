"use client";

import { CheckCircleIcon, HeartIcon, SmileySadIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { Button, Field, IconBubble, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { respondToInvite } from "@/server/rsvp";

type Status = "PENDING" | "ATTENDING" | "DECLINED";

export function RsvpForm({
  token,
  guestName,
  honoreeFirstName,
  initialStatus,
  initialNote,
  deadline,
  closed,
  full,
}: {
  token: string;
  guestName: string | null;
  honoreeFirstName: string;
  initialStatus: Status;
  initialNote: string;
  deadline: string | null;
  closed: boolean;
  full: boolean;
}) {
  const [saved, setSaved] = useState<Status>(initialStatus);
  const [editing, setEditing] = useState(initialStatus === "PENDING");
  const [choice, setChoice] = useState<"ATTENDING" | "DECLINED" | null>(initialStatus === "PENDING" ? null : initialStatus);
  const [name, setName] = useState("");
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!choice) {
      setError("Let us know if you can make it.");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await respondToInvite({ token, status: choice, name: name || undefined, note });
      if ("ok" in res && res.ok) {
        setSaved(choice);
        setEditing(false);
      } else {
        setError(res.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (!editing && saved !== "PENDING") {
    const attending = saved === "ATTENDING";
    return (
      <section className={cn("rounded-[2rem] p-6 sm:p-8", attending ? "bg-mint" : "bg-surface")}>
        <IconBubble icon={attending ? CheckCircleIcon : HeartIcon} tone={attending ? "mint" : "blush"} size="lg" className={attending ? "bg-surface" : ""} />
        <h2 className="mt-5 text-3xl font-semibold">{attending ? "You're on the list!" : "Thanks for letting us know"}</h2>
        <p className="mt-2 text-lg text-muted">
          {attending
            ? `Your seat is saved. We've emailed you the details, and ${honoreeFirstName} can't wait to see you.`
            : `We've let ${honoreeFirstName} know. You'll be missed!`}
        </p>
        {!closed && (
          <Button variant="secondary" className="mt-6 bg-surface" onClick={() => setEditing(true)}>
            Change my answer
          </Button>
        )}
      </section>
    );
  }

  if (closed) {
    return (
      <section className="rounded-[2rem] bg-surface p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">RSVPs are closed</h2>
        <p className="mt-2 text-lg text-muted">Reply to your invitation email to reach {honoreeFirstName}.</p>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] bg-surface p-6 sm:p-8">
      <h2 className="text-3xl font-semibold">{guestName ? `Will you be there, ${guestName.split(/\s+/)[0]}?` : "Will you be there?"}</h2>
      {deadline && <p className="mt-2 text-lg text-muted">Please reply by {deadline}.</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Your answer">
        <ChoiceButton
          selected={choice === "ATTENDING"}
          disabled={full}
          onClick={() => setChoice("ATTENDING")}
          tone="mint"
          icon={<CheckCircleIcon size={24} weight="duotone" aria-hidden />}
        >
          {full ? "Event is full" : "I'll be there"}
        </ChoiceButton>
        <ChoiceButton
          selected={choice === "DECLINED"}
          onClick={() => setChoice("DECLINED")}
          tone="blush"
          icon={<SmileySadIcon size={24} weight="duotone" aria-hidden />}
        >
          Can&apos;t make it
        </ChoiceButton>
      </div>

      <div className="mt-8 space-y-8">
        {!guestName && (
          <Field label="Your name" htmlFor="rsvp-name">
            <Input id="rsvp-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <Field label={`A note for ${honoreeFirstName}`} htmlFor="rsvp-note" hint="Optional.">
          <Textarea id="rsvp-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>

      {error && (
        <p role="alert" className="mt-6 flex items-start gap-3 rounded-2xl bg-danger-soft px-5 py-4 text-base text-danger">
          <WarningCircleIcon size={22} weight="duotone" className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Button type="submit" size="lg" block className="mt-8" disabled={pending}>
        {pending ? "Sending…" : "Send my RSVP"}
      </Button>
    </form>
  );
}

function ChoiceButton({
  selected,
  disabled,
  onClick,
  tone,
  icon,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  tone: "mint" | "blush";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const selectedClass = tone === "mint" ? "bg-mint text-mint-ink ring-2 ring-mint-ink/40" : "bg-blush text-blush-ink ring-2 ring-blush-ink/40";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-16 items-center justify-center gap-2.5 rounded-full text-lg font-medium transition-all",
        "focus-visible:ring-4 focus-visible:ring-accent/25 focus-visible:outline-none disabled:opacity-50",
        selected ? selectedClass : "bg-field text-ink hover:bg-field-hover",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
