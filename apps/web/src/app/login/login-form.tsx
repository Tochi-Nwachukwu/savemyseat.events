"use client";

import { EnvelopeSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button, Field, IconBubble, Input } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ callbackURL, linkExpired }: { callbackURL: string; linkExpired: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState(linkExpired ? "That link has expired or was already used. Send yourself a new one." : "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL,
      newUserCallbackURL: "/new",
      errorCallbackURL: "/login?error=link",
    });
    if (error) {
      setStatus("idle");
      setError(error.message ?? "We couldn't send your link. Please try again.");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div>
        <IconBubble icon={EnvelopeSimpleIcon} tone="mint" size="lg" />
        <h1 className="mt-8 text-5xl font-semibold">Check your inbox</h1>
        <p className="mt-4 text-xl leading-relaxed text-muted">
          We sent a sign-in link to <span className="font-medium text-ink">{email}</span>. It expires in 15 minutes.
        </p>
        <Button variant="secondary" size="lg" block className="mt-10" onClick={() => setStatus("idle")}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <h1 className="text-5xl font-semibold">Sign in</h1>
      <p className="mt-4 text-xl leading-relaxed text-muted">
        New here? Same thing. We&apos;ll email you a link, no password needed.
      </p>

      {error && (
        <p className="mt-8 flex items-start gap-3 rounded-2xl bg-danger-soft px-5 py-4 text-base text-danger">
          <WarningCircleIcon size={22} weight="duotone" className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Field label="Email" htmlFor="email" className="mt-10">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Button type="submit" size="lg" block className="mt-10" disabled={status === "sending"}>
        {status === "sending" ? "Sending your link…" : "Email me a link"}
      </Button>
    </form>
  );
}
