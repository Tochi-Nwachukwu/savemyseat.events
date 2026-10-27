import type { Metadata } from "next";
import { Button, Card, Chip, ChoicePill, Field, Input, PrefixInput, Select, Stepper } from "@/components/ui";

export const metadata: Metadata = { title: "Style preview", robots: { index: false } };

// Temporary style preview; the real wizard lives at /new (phase 4).
export default function StylePreview() {
  return (
    <main className="mx-auto max-w-[600px] px-4 py-10 sm:px-6">
      <Stepper step={1} total={4} />

      <h1 className="mt-12 text-5xl font-semibold">Create your event</h1>
      <p className="mt-4 text-xl leading-relaxed text-muted">
        Four short steps. Your event gets its own page, like savemyseat.events/joseph.
      </p>

      <form className="mt-12 space-y-10">
        <Field label="Who are we celebrating?" htmlFor="honoree">
          <Input id="honoree" placeholder="Joseph Ashipa" />
        </Field>

        <Field label="What's the occasion?" hint="Shown under the name on the invitation.">
          <div className="flex flex-wrap gap-3">
            {["Graduation", "Birthday", "Wedding", "Other"].map((o, i) => (
              <ChoicePill key={o} name="kind" value={o} label={o} defaultChecked={i === 0} />
            ))}
          </div>
        </Field>

        <Field label="Your page address" htmlFor="slug" hint="Guests can open this link to see the invitation.">
          <PrefixInput id="slug" prefix="savemyseat.events/" placeholder="joseph" />
        </Field>

        <Field label="Time zone" htmlFor="tz">
          <Select id="tz" defaultValue="America/New_York">
            <option value="America/New_York">Eastern (EST)</option>
            <option value="America/Chicago">Central (CST)</option>
            <option value="America/Los_Angeles">Pacific (PST)</option>
            <option value="Africa/Lagos">West Africa (WAT)</option>
          </Select>
        </Field>

        <Button size="lg" block>
          Continue
        </Button>
      </form>

      <Card className="mt-16 space-y-4">
        <h2 className="text-2xl font-semibold">Status chips</h2>
        <div className="flex flex-wrap gap-2">
          <Chip>Not sent</Chip>
          <Chip tone="accent">Sent</Chip>
          <Chip tone="success">Attending</Chip>
          <Chip tone="danger">Declined</Chip>
          <Chip tone="warning">Awaiting</Chip>
        </div>
      </Card>
    </main>
  );
}
