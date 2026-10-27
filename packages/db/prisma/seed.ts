import { config } from "dotenv";

config({ path: "../../.env", quiet: true });

const { prisma, newGuestToken } = await import("../src/index");

// Sign in with this email later to see Joseph's dashboard.
const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "joseph@example.com";

const owner = await prisma.user.upsert({
  where: { email: ownerEmail },
  update: {},
  create: { id: crypto.randomUUID(), email: ownerEmail, name: "Joseph Ashipa", emailVerified: true },
});

const event = await prisma.event.upsert({
  where: { slug: "joseph" },
  update: {},
  create: {
    ownerId: owner.id,
    slug: "joseph",
    title: "Joseph's Graduation",
    honoreeName: "Joseph Ashipa",
    subtitle: "Georgia Southern University (Graduate) · Fall 2026",
    venueName: "Jack & Ruth Ann Hill Convocation Center",
    venueAddress: "Statesboro, GA",
    // 1:00 PM EST on Dec 9, 2026 = 18:00 UTC
    startsAt: new Date("2026-12-09T18:00:00Z"),
    timezone: "America/New_York",
    message: "I'd love for you to celebrate this milestone with me.",
  },
});

// Resend test inboxes: safe to "send" to without bouncing real mail.
const sampleGuests = [
  { name: "Ada Obi", email: "delivered+ada@resend.dev", rsvpStatus: "ATTENDING" as const },
  { name: "Tunde Bello", email: "delivered+tunde@resend.dev", rsvpStatus: "DECLINED" as const },
  { name: "Grace Kim", email: "delivered+grace@resend.dev", rsvpStatus: "PENDING" as const },
];

for (const g of sampleGuests) {
  await prisma.guest.upsert({
    where: { eventId_email: { eventId: event.id, email: g.email } },
    update: {},
    create: {
      ...g,
      eventId: event.id,
      token: newGuestToken(),
      respondedAt: g.rsvpStatus === "PENDING" ? null : new Date(),
    },
  });
}

console.log(`Seeded event "${event.slug}" owned by ${owner.email}`);
await prisma.$disconnect();
