import type { Icon } from "@phosphor-icons/react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CakeIcon,
  ChampagneIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  GraduationCapIcon,
  HeartIcon,
  LinkSimpleIcon,
  ListChecksIcon,
  PaperPlaneTiltIcon,
  SparkleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import balloons from "@/assets/home/balloons.jpg";
import confetti from "@/assets/home/confetti.jpg";
import graduation from "@/assets/home/graduation.jpg";
import inviteCard from "@/assets/home/invite-card.jpg";
import saveTheDate from "@/assets/home/save-the-date.jpg";
import sprinkles from "@/assets/home/sprinkles.jpg";
import { Logo } from "@/components/logo";
import { DotsDoodle, LoopDoodle, SparkleDoodle, SquiggleDoodle, StarDoodle, UnderlineDoodle } from "@/components/doodles";
import { buttonClass, Chip, IconBubble, type PastelTone } from "@/components/ui";
import { cn } from "@/lib/cn";

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Occasions />
        <TablePreview />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
      <Logo />
      <Link href="/login" className={buttonClass({ variant: "ghost", size: "sm" })}>
        Sign in
      </Link>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
      <div>
        <Chip tone="accent" className="gap-1.5">
          <SparkleIcon size={14} weight="fill" aria-hidden /> Invitations, RSVPs, done
        </Chip>
        <h1 className="mt-6 text-5xl leading-[1.04] font-semibold sm:text-6xl lg:text-7xl">
          Save the date.{" "}
          <span className="relative isolate inline-block whitespace-nowrap">
            Save their seat.
            <UnderlineDoodle className="absolute -bottom-1 left-0 -z-10 text-blush-ink/30" />
          </span>
        </h1>
        <p className="mt-7 max-w-lg text-xl leading-relaxed text-muted">
          Create a beautiful invitation, email it to your guests, and watch the RSVPs roll in, all from one simple
          table.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/new" className={buttonClass({ size: "lg" })}>
            Create your event <ArrowRightIcon size={20} weight="bold" aria-hidden />
          </Link>
          <Link href="/joseph" className={buttonClass({ variant: "secondary", size: "lg" })}>
            See an example
          </Link>
        </div>
        <p className="mt-6 flex items-center gap-2 text-base text-muted">
          <CheckCircleIcon size={20} weight="duotone" className="text-mint-ink" aria-hidden />
          Free to start. Guests don&apos;t need an account.
        </p>
      </div>

      <HeroCollage />
    </section>
  );
}

function HeroCollage() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[460px] sm:h-[480px]">
      {/* Soft pastel blobs behind the cards */}
      <div className="absolute top-6 left-4 size-56 rounded-full bg-lilac blur-2xl" />
      <div className="absolute right-0 bottom-10 size-48 rounded-full bg-peach blur-2xl" />

      <PhotoCard
        src={inviteCard}
        alt="Pink invitation card that reads You're invited to celebrate"
        className="absolute top-0 left-0 w-[58%] -rotate-6"
        priority
      />
      <PhotoCard
        src={saveTheDate}
        alt="Save the date card with matching RSVP card"
        className="absolute top-16 right-0 w-[54%] rotate-6"
        priority
      />

      {/* Little product moment: an RSVP card */}
      <div className="animate-float absolute bottom-2 left-1/2 w-[78%] max-w-[320px] -translate-x-1/2 rounded-3xl bg-surface p-4 shadow-[0_20px_50px_-20px_rgb(31_29_51/0.35)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted">Joseph&apos;s Graduation</p>
          <Chip tone="success" className="h-6 px-2.5 text-xs">
            24 seats saved
          </Chip>
        </div>
        <ul className="mt-3 space-y-2">
          <GuestRow initials="AO" name="Ada Obi" tone="blush" status="Attending" />
          <GuestRow initials="GK" name="Grace Kim" tone="sky" status="Awaiting" />
        </ul>
      </div>

      <SparkleDoodle className="animate-float-slow absolute -top-3 right-10 size-9 text-butter-ink/60" />
      <StarDoodle className="absolute top-1/2 -left-4 size-8 -rotate-12 text-sky-ink/50" />
      <LoopDoodle className="absolute right-2 bottom-28 text-blush-ink/50" />
      <DotsDoodle className="absolute -bottom-2 -left-2 size-12 text-lilac-ink/25" />
    </div>
  );
}

function PhotoCard({
  src,
  alt,
  className,
  priority,
}: {
  src: StaticImageData;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.75rem] bg-surface p-2 shadow-[0_24px_60px_-24px_rgb(31_29_51/0.4)]",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        placeholder="blur"
        priority={priority}
        sizes="(min-width: 1024px) 280px, 55vw"
        className="aspect-[4/5] w-full rounded-[1.35rem] object-cover"
      />
    </div>
  );
}

function GuestRow({
  initials,
  name,
  tone,
  status,
}: {
  initials: string;
  name: string;
  tone: PastelTone;
  status: "Attending" | "Awaiting";
}) {
  const toneClass = { blush: "bg-blush text-blush-ink", sky: "bg-sky text-sky-ink" }[tone as "blush" | "sky"];
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-page px-3 py-2">
      <span className={cn("grid size-8 place-items-center rounded-full text-xs font-semibold", toneClass)}>
        {initials}
      </span>
      <span className="flex-1 text-sm font-medium">{name}</span>
      <Chip tone={status === "Attending" ? "success" : "warning"} className="h-6 px-2.5 text-xs">
        {status}
      </Chip>
    </li>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

const steps: { icon: Icon; tone: PastelTone; title: string; body: string }[] = [
  {
    icon: SparkleIcon,
    tone: "lilac",
    title: "Create your event",
    body: "Add the who, when and where, upload your invitation, and get your own page in four short steps.",
  },
  {
    icon: PaperPlaneTiltIcon,
    tone: "peach",
    title: "Send the invites",
    body: "Paste in your guests' emails. Each person gets a lovely email with their own RSVP link.",
  },
  {
    icon: ListChecksIcon,
    tone: "mint",
    title: "Watch RSVPs roll in",
    body: "See who's coming at a glance, nudge anyone who hasn't replied, and know your exact headcount.",
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="How it works" title="Three steps to a full room" />
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="relative rounded-[2rem] bg-surface p-7">
            <span className="absolute top-7 right-7 text-5xl font-semibold text-field">{i + 1}</span>
            <IconBubble icon={step.icon} tone={step.tone} size="lg" />
            <h3 className="mt-6 text-2xl font-semibold">{step.title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─── Occasions ───────────────────────────────────────────────────────────────

const occasions: { label: string; icon: Icon; tone: PastelTone; src: StaticImageData; alt: string }[] = [
  { label: "Graduations", icon: GraduationCapIcon, tone: "sky", src: graduation, alt: "Graduates tossing their caps" },
  { label: "Birthdays", icon: CakeIcon, tone: "butter", src: balloons, alt: "Gold balloons and ribbons" },
  { label: "Weddings", icon: HeartIcon, tone: "blush", src: saveTheDate, alt: "Wedding save the date stationery" },
  { label: "Parties", icon: ChampagneIcon, tone: "mint", src: confetti, alt: "Pastel paper confetti" },
];

function Occasions() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="For every occasion" title="Big days, small gatherings, all of it" />
      <ul className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {occasions.map((o, i) => (
          <li
            key={o.label}
            className={cn(
              "group relative overflow-hidden rounded-[2rem] bg-surface p-2 transition-transform duration-300 hover:-translate-y-1",
              i % 2 === 1 && "lg:translate-y-8 lg:hover:translate-y-7",
            )}
          >
            <Image
              src={o.src}
              alt={o.alt}
              placeholder="blur"
              sizes="(min-width: 1024px) 270px, 45vw"
              className="aspect-[4/5] w-full rounded-[1.6rem] object-cover"
            />
            <span className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-surface/95 py-1.5 pr-4 pl-1.5 text-base font-medium shadow-sm backdrop-blur">
              <IconBubble icon={o.icon} tone={o.tone} size="sm" className="rounded-full" />
              {o.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Dashboard preview ───────────────────────────────────────────────────────

const features: { icon: Icon; tone: PastelTone; title: string; body: string }[] = [
  { icon: LinkSimpleIcon, tone: "lilac", title: "Personal RSVP links", body: "One tap to reply. No accounts, no passwords." },
  { icon: EnvelopeSimpleIcon, tone: "peach", title: "Beautiful emails", body: "Your invitation image, front and centre." },
  { icon: UsersThreeIcon, tone: "mint", title: "Live headcount", body: "Know exactly how many seats to save." },
];

const previewGuests = [
  { name: "Ada Obi", email: "ada@…", invite: "Opened", rsvp: "Attending" },
  { name: "Tunde Bello", email: "tunde@…", invite: "Delivered", rsvp: "Declined" },
  { name: "Grace Kim", email: "grace@…", invite: "Sent", rsvp: "Awaiting" },
  { name: "Chidi Okafor", email: "chidi@…", invite: "Opened", rsvp: "Attending" },
] as const;

const rsvpTone = { Attending: "success", Declined: "danger", Awaiting: "warning" } as const;

function TablePreview() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <SectionHeading eyebrow="Your dashboard" title="Everyone, in one simple table" align="left" />
        <ul className="mt-10 space-y-6">
          {features.map((f) => (
            <li key={f.title} className="flex gap-4">
              <IconBubble icon={f.icon} tone={f.tone} />
              <div>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="mt-1 text-lg text-muted">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative">
        <SquiggleDoodle className="absolute -top-8 right-6 text-mint-ink/40" />
        <div className="rounded-[2rem] bg-surface p-5 shadow-[0_30px_70px_-30px_rgb(31_29_51/0.35)] sm:p-6">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Invited" value="32" tone="bg-lilac" />
            <Stat label="Attending" value="24" tone="bg-mint" />
            <Stat label="Awaiting" value="6" tone="bg-butter" />
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-page text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Invite</th>
                  <th className="px-4 py-3 font-medium">RSVP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {previewGuests.map((g) => (
                  <tr key={g.name}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{g.name}</p>
                      <p className="text-subtle">{g.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">{g.invite}</td>
                    <td className="px-4 py-3">
                      <Chip tone={rsvpTone[g.rsvp]}>{g.rsvp}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cn("rounded-2xl p-4", tone)}>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm font-medium text-muted">{label}</p>
    </div>
  );
}

// ─── Closing CTA & footer ────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-lilac px-6 py-16 text-center sm:px-12 sm:py-20">
        <Image src={sprinkles} alt="" fill sizes="100vw" className="object-cover opacity-25 mix-blend-multiply" />
        <SparkleDoodle className="absolute top-8 left-10 size-10 text-lilac-ink/40" />
        <StarDoodle className="absolute right-12 bottom-10 size-10 rotate-12 text-blush-ink/40" />
        <div className="relative">
          <h2 className="mx-auto max-w-xl text-4xl font-semibold sm:text-5xl">Ready to send your invites?</h2>
          <p className="mx-auto mt-4 max-w-md text-xl text-muted">Your event page can be live in a few minutes.</p>
          <Link href="/new" className={buttonClass({ size: "lg", className: "mt-9" })}>
            Create your event <ArrowRightIcon size={20} weight="bold" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

const credits = [
  { name: "Shamblen Studios", href: "https://unsplash.com/photos/N7zyWI9F0tU" },
  { name: "Micah & Sammie Chaffin", href: "https://unsplash.com/photos/v7nmJ1vBZwI" },
  { name: "Kier in Sight Archives", href: "https://unsplash.com/photos/p7iaoHjWDbI" },
  { name: "Md. Sabbir Sikder", href: "https://unsplash.com/photos/pf-o0xEBkt4" },
  { name: "Mockaroon", href: "https://unsplash.com/photos/lgi3W65lmvA" },
];

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6">
      <div className="flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p className="text-sm text-subtle">
          Photos on{" "}
          <a href="https://unsplash.com" className="underline-offset-2 hover:underline">
            Unsplash
          </a>{" "}
          by{" "}
          {credits.map((c, i) => (
            <span key={c.name}>
              <a href={c.href} className="underline-offset-2 hover:underline">
                {c.name}
              </a>
              {i < credits.length - 2 ? ", " : i === credits.length - 2 ? " and " : ""}
            </span>
          ))}
          .
        </p>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn(align === "center" && "text-center")}>
      <p className="text-base font-medium text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">{title}</h2>
    </div>
  );
}
