"use client";

import { CheckCircleIcon, HeartIcon, SmileySadIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { ChoiceButton } from "@/components/rsvp-choice";
import { Button, Field, IconBubble, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { respondViaLink } from "@/server/rsvp";

export function PublicRsvpForm({
  slug,
  honoreeFirstName,
  deadline,
  full,
}: {
  slug: string;
  honoreeFirstName: string;
  deadline: string | null;
  full: boolean;
}) {
  const [choice, setChoice] = useState<"ATTENDING" | "DECLINED" | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "", website: "" });
  const [done, setDone] = useState<"ATTENDING" | "DECLINED" | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!choice) return setError("Let us know if you can make it.");
    if (!form.name.trim()) return setError("Please add your name.");
    if (!form.email.trim()) return setError("Please add your email so we can confirm your RSVP.");
    setError("");
    startTransition(async () => {
      const res = await respondViaLink({ slug, status: choice, ...form });
      if ("ok" in res && res.ok) setDone(choice);
      else setError(res.error ?? "Something went wrong. Please try again.");
    });
  }

  if (done) {
    const attending = done === "ATTENDING";
    return (
      <section className={cn("rounded-[2rem] p-6 sm:p-8", attending ? "bg-mint" : "bg-surface")}>
        <IconBubble icon={attending ? CheckCircleIcon : HeartIcon} tone={attending ? "mint" : "blush"} size="lg" className={attending ? "bg-surface" : ""} />
        <h2 className="mt-5 text-3xl font-semibold">{attending ? "You're on the list!" : "Thanks for letting us know"}</h2>
        <p className="mt-2 text-lg text-muted">
          {attending
            ? `Your seat is saved and ${honoreeFirstName} can see you're coming. We've emailed you the details, with a link to change your answer if plans change.`
            : `We've let ${honoreeFirstName} know. We've emailed you a link in case plans change.`}
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] bg-surface p-6 sm:p-8" noValidate>
      <h2 className="text-3xl font-semibold">Will you be there?</h2>
      <p className="mt-2 text-lg text-muted">
        {deadline ? `Please RSVP by ${deadline}.` : `Let ${honoreeFirstName} know you're coming.`}
      </p>

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
        <Field label="Your name" htmlFor="rsvp-name">
          <Input id="rsvp-name" autoComplete="name" value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Email" htmlFor="rsvp-email" hint="We'll send your confirmation here.">
          <Input id="rsvp-email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Phone number" htmlFor="rsvp-phone" hint="Optional.">
          <Input id="rsvp-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label={`A note for ${honoreeFirstName}`} htmlFor="rsvp-note" hint="Optional.">
          <Textarea id="rsvp-note" rows={3} maxLength={500} value={form.note} onChange={set("note")} />
        </Field>
        {/* Honeypot for bots; hidden from people and screen readers. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          value={form.website}
          onChange={set("website")}
        />
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
