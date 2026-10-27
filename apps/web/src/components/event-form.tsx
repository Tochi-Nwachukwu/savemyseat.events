"use client";

import { CheckCircleIcon, ImageSquareIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Button,
  ChoicePill,
  Field,
  IconBubble,
  Input,
  PrefixInput,
  Select,
  Stepper,
  Textarea,
} from "@/components/ui";
import { compressImage } from "@/lib/compress-image";
import { cn } from "@/lib/cn";
import { slugify, slugProblem } from "@/lib/slug";
import { TIME_ZONES } from "@/lib/timezones";
import { checkSlug, createEvent, updateEvent } from "@/server/events";

export type EventFormValues = {
  honoreeName: string;
  title: string;
  subtitle: string;
  slug: string;
  date: string;
  time: string;
  timezone: string;
  venueName: string;
  venueAddress: string;
  message: string;
  rsvpDeadline: string;
  capacity: string;
};

const EMPTY: EventFormValues = {
  honoreeName: "",
  title: "",
  subtitle: "",
  slug: "",
  date: "",
  time: "",
  timezone: "America/New_York",
  venueName: "",
  venueAddress: "",
  message: "",
  rsvpDeadline: "",
  capacity: "",
};

const OCCASIONS = [
  { value: "Graduation", title: (n: string) => `${n}'s Graduation` },
  { value: "Birthday", title: (n: string) => `${n}'s Birthday` },
  { value: "Wedding", title: (n: string) => `${n}'s Wedding` },
  { value: "Party", title: (n: string) => `${n}'s Party` },
  { value: "Other", title: (n: string) => `Celebrating ${n}` },
];

const STEPS = [
  { title: "Who's celebrating?", fields: ["honoreeName", "title", "slug"] },
  { title: "When and where?", fields: ["date", "time", "timezone", "venueName"] },
  { title: "Your invitation", fields: [] },
  { title: "RSVP settings", fields: [] },
] as const;

type SlugStatus = { state: "idle" | "checking" | "ok" | "error"; message?: string };

export function EventForm({
  mode,
  eventId,
  initial,
  initialImageUrl,
  appHost,
}: {
  mode: "create" | "edit";
  eventId?: string;
  initial?: Partial<EventFormValues>;
  initialImageUrl?: string | null;
  /** "savemyseat.events", shown before the slug */
  appHost: string;
}) {
  const [values, setValues] = useState<EventFormValues>({ ...EMPTY, ...initial });
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState("Graduation");
  const [titleTouched, setTitleTouched] = useState(mode === "edit");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ state: "idle" });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialImageUrl ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  // Default to the browser's time zone for new events.
  useEffect(() => {
    if (mode === "create" && !initial?.timezone) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) set("timezone", tz);
    }
  }, [mode, initial?.timezone]);

  // Suggest a title and address from the honoree's first name.
  function onHonoreeChange(name: string) {
    const first = name.trim().split(/\s+/)[0] ?? "";
    setValues((v) => ({
      ...v,
      honoreeName: name,
      title: titleTouched || !first ? v.title : OCCASIONS.find((o) => o.value === occasion)!.title(first),
      slug: slugTouched ? v.slug : slugify(first),
    }));
  }

  function onOccasionChange(value: string) {
    setOccasion(value);
    const first = values.honoreeName.trim().split(/\s+/)[0];
    if (!titleTouched && first) set("title", OCCASIONS.find((o) => o.value === value)!.title(first));
  }

  // Live availability check for the page address.
  useEffect(() => {
    const slug = values.slug;
    if (!slug || (mode === "edit" && slug === initial?.slug)) {
      setSlugStatus({ state: "idle" });
      return;
    }
    const problem = slugProblem(slug);
    if (problem) {
      setSlugStatus({ state: "error", message: problem });
      return;
    }
    setSlugStatus({ state: "checking" });
    const timer = setTimeout(async () => {
      const res = await checkSlug(slug, eventId);
      setSlugStatus({ state: res.available ? "ok" : "error", message: res.message });
    }, 350);
    return () => clearTimeout(timer);
  }, [values.slug, mode, initial?.slug, eventId]);

  const timeZones = useMemo(
    () =>
      TIME_ZONES.some((t) => t.value === values.timezone)
        ? TIME_ZONES
        : [{ value: values.timezone, label: values.timezone.replace(/_/g, " ") }, ...TIME_ZONES],
    [values.timezone],
  );

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setImageBusy(true);
    setError("");
    try {
      const compressed = await compressImage(file);
      setImage(compressed);
      setPreview(URL.createObjectURL(compressed));
      setRemoveImage(false);
    } catch {
      setError("We couldn't read that image. Try a JPG or PNG.");
    } finally {
      setImageBusy(false);
    }
  }

  function clearImage() {
    setImage(null);
    setPreview(null);
    setRemoveImage(true);
  }

  function validateStep(index: number) {
    const v = values;
    if (index === 0) {
      if (!v.honoreeName.trim()) return "Who are we celebrating?";
      if (!v.title.trim()) return "Give your event a name.";
      const problem = slugProblem(v.slug);
      if (problem) return problem;
      if (slugStatus.state === "error") return slugStatus.message ?? "Pick another page address.";
    }
    if (index === 1) {
      if (!v.date) return "Pick a date.";
      if (!v.time) return "Pick a time.";
      if (!v.venueName.trim()) return "Where is it happening?";
    }
    if (index === 3) {
      if (v.capacity && !(Number(v.capacity) >= 1)) return "Capacity should be a number above zero.";
      if (v.rsvpDeadline && v.date && v.rsvpDeadline > v.date) return "The RSVP deadline should be before the event.";
    }
    return null;
  }

  function goTo(next: number) {
    setStep(next);
    setError("");
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }
    const fd = new FormData();
    for (const [key, value] of Object.entries(values)) fd.set(key, value);
    fd.set("removeImage", String(removeImage));
    if (image) fd.set("image", image);
    startTransition(async () => {
      const result = mode === "create" ? await createEvent(fd) : await updateEvent(eventId!, fd);
      if (result?.error) setError(result.error);
    });
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div ref={topRef} className="scroll-mt-6">
      <Stepper step={step + 1} total={STEPS.length} />

      <h1 className="mt-12 text-5xl font-semibold">
        {step === 0 ? (mode === "create" ? "Create your event" : "Edit your event") : STEPS[step]!.title}
      </h1>
      {step === 0 && (
        <p className="mt-4 text-xl leading-relaxed text-muted">
          Four short steps. Your event gets its own page, like {appHost}/joseph.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-12 space-y-10" noValidate>
        {step === 0 && (
          <>
            <Field label="Who are we celebrating?" htmlFor="honoreeName">
              <Input
                id="honoreeName"
                autoComplete="off"
                placeholder="Joseph Ashipa"
                value={values.honoreeName}
                onChange={(e) => onHonoreeChange(e.target.value)}
                autoFocus={mode === "create"}
              />
            </Field>

            {mode === "create" && (
              <Field label="What's the occasion?">
                <div className="flex flex-wrap gap-3">
                  {OCCASIONS.map((o) => (
                    <ChoicePill
                      key={o.value}
                      name="occasion"
                      value={o.value}
                      label={o.value}
                      checked={occasion === o.value}
                      onChange={() => onOccasionChange(o.value)}
                    />
                  ))}
                </div>
              </Field>
            )}

            <Field label="Event name" htmlFor="title" hint="The headline on your invitation.">
              <Input
                id="title"
                placeholder="Joseph's Graduation"
                value={values.title}
                onChange={(e) => {
                  setTitleTouched(true);
                  set("title", e.target.value);
                }}
              />
            </Field>

            <Field
              label="Details line"
              htmlFor="subtitle"
              hint="Optional. Shown under the name, e.g. Georgia Southern University (Graduate) · Fall 2026."
            >
              <Input
                id="subtitle"
                placeholder="Georgia Southern University · Fall 2026"
                value={values.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
              />
            </Field>

            <Field
              label="Your page address"
              htmlFor="slug"
              hint={
                slugStatus.state === "ok" ? (
                  <span className="flex items-center gap-1.5 text-success">
                    <CheckCircleIcon size={18} weight="duotone" aria-hidden /> {slugStatus.message}
                  </span>
                ) : slugStatus.state === "error" ? (
                  <span className="flex items-center gap-1.5 text-danger">
                    <WarningCircleIcon size={18} weight="duotone" aria-hidden /> {slugStatus.message}
                  </span>
                ) : slugStatus.state === "checking" ? (
                  "Checking…"
                ) : mode === "edit" ? (
                  "Changing this breaks links you've already shared."
                ) : (
                  "Guests can open this link to see your invitation."
                )
              }
            >
              <PrefixInput
                id="slug"
                prefix={`${appHost}/`}
                placeholder="joseph"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40));
                }}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
              <Field label="Date" htmlFor="date">
                <Input id="date" type="date" value={values.date} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field label="Time" htmlFor="time">
                <Input id="time" type="time" value={values.time} onChange={(e) => set("time", e.target.value)} />
              </Field>
            </div>

            <Field label="Time zone" htmlFor="timezone" hint="Guests see the time in this zone, e.g. 1:00 PM EST.">
              <Select id="timezone" value={values.timezone} onChange={(e) => set("timezone", e.target.value)}>
                {timeZones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Venue" htmlFor="venueName">
              <Input
                id="venueName"
                placeholder="Jack & Ruth Ann Hill Convocation Center"
                value={values.venueName}
                onChange={(e) => set("venueName", e.target.value)}
              />
            </Field>

            <Field label="Address" htmlFor="venueAddress" hint="Optional. Used for the map link.">
              <Input
                id="venueAddress"
                placeholder="Statesboro, GA"
                value={values.venueAddress}
                onChange={(e) => set("venueAddress", e.target.value)}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Invitation image" hint="JPG or PNG. We'll resize it so it looks sharp in every inbox.">
              {preview ? (
                <div className="relative overflow-hidden rounded-[1.75rem] bg-surface p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={preview} alt="Invitation preview" className="w-full rounded-[1.35rem]" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <label className="inline-flex h-10 cursor-pointer items-center rounded-full bg-surface/95 px-4 text-sm font-medium shadow-sm backdrop-blur hover:bg-surface">
                      Replace
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPickImage(e.target.files?.[0])} />
                    </label>
                    <Button variant="secondary" size="sm" className="bg-surface/95 shadow-sm" onClick={clearImage} aria-label="Remove image">
                      <TrashIcon size={18} weight="duotone" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    onPickImage(e.dataTransfer.files[0]);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[1.75rem] border-2 border-dashed border-line bg-field px-6 py-14 text-center transition-colors hover:bg-field-hover",
                    imageBusy && "pointer-events-none opacity-60",
                  )}
                >
                  <IconBubble icon={ImageSquareIcon} tone="lilac" size="lg" />
                  <span className="text-lg font-medium">{imageBusy ? "Preparing your image…" : "Drop your invitation here"}</span>
                  <span className="text-base text-muted">or click to choose a file</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPickImage(e.target.files?.[0])} />
                </label>
              )}
            </Field>

            <Field label="A note to your guests" htmlFor="message" hint="Optional. Shown on the invitation and in the email.">
              <Textarea
                id="message"
                rows={4}
                placeholder="I'd love for you to celebrate this milestone with me."
                value={values.message}
                onChange={(e) => set("message", e.target.value)}
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="RSVP by" htmlFor="rsvpDeadline" hint="Optional. Guests can reply until the end of this day.">
              <Input
                id="rsvpDeadline"
                type="date"
                value={values.rsvpDeadline}
                max={values.date || undefined}
                onChange={(e) => set("rsvpDeadline", e.target.value)}
              />
            </Field>

            <Field label="How many seats?" htmlFor="capacity" hint="Optional. When it's full, guests can't accept. Leave blank for no limit.">
              <Input
                id="capacity"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="No limit"
                value={values.capacity}
                onChange={(e) => set("capacity", e.target.value)}
              />
            </Field>

            <div className="rounded-[1.75rem] bg-surface p-6">
              <p className="text-base font-medium text-muted">Quick check</p>
              <dl className="mt-4 space-y-3 text-lg">
                <ReviewRow label="Event" value={values.title} />
                <ReviewRow label="Page" value={`${appHost}/${values.slug}`} />
                <ReviewRow label="When" value={formatWallClock(values.date, values.time)} />
                <ReviewRow label="Where" value={values.venueName} />
                <ReviewRow label="Image" value={preview ? "Added" : "None"} />
              </dl>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="flex items-start gap-3 rounded-2xl bg-danger-soft px-5 py-4 text-base text-danger">
            <WarningCircleIcon size={22} weight="duotone" className="mt-0.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {step > 0 && (
            <Button variant="secondary" size="lg" className="sm:w-40" onClick={() => goTo(step - 1)} disabled={pending}>
              Back
            </Button>
          )}
          <Button type="submit" size="lg" block disabled={pending || imageBusy}>
            {isLast
              ? pending
                ? mode === "create"
                  ? "Creating your event…"
                  : "Saving…"
                : mode === "create"
                  ? "Create event"
                  : "Save changes"
              : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** "Wed, Dec 9, 2026 at 1:00 PM" from the raw date/time inputs (no zone math needed). */
function formatWallClock(date: string, time: string) {
  if (!date || !time) return "Not set";
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(Date.UTC(y, m - 1, d, hh, mm)));
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-20 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 font-medium break-words">{value}</dd>
    </div>
  );
}
