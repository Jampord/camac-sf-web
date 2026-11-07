import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { MapIcon, MessageCircleIcon } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { EventListSkeleton } from "@/components/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { ABOUT, FACEBOOK_URL, FIRST_SUNDAY, MESSENGER_URL, WELCOME } from "@/lib/church";
import { mapsUrl } from "@/lib/events/address";
import { landingAgenda } from "@/lib/events/landing";
import { getChurchAddress, getPublishedEvents, type PublicEvent } from "@/lib/events/public";
import { formatManila } from "@/lib/time";
import { cn } from "@/lib/utils";
import { AgendaRow, entryKey } from "./events/agenda";

// The landing page (UI redesign): a welcome with the service times first, for visitors who find
// the link on Facebook or a QR code; then what's coming up, about the church, and how to reach
// it. Members mostly arrive on event pages from the group chat, so this page can lead with the
// welcome. Calendar data is read per request inside <Suspense>; the rest prerenders.

const bigButton = "h-14 w-full text-lg";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-4 pt-8 pb-10">
        <Suspense fallback={<WelcomeSkeleton />}>
          <Welcome />
        </Suspense>

        <section aria-labelledby="coming-up" className="flex flex-col gap-4">
          <SectionHeading id="coming-up">Coming up</SectionHeading>
          <Suspense fallback={<EventListSkeleton label="Loading events" rows={3} />}>
            <ComingUp />
          </Suspense>
          <Link href="/events" className={cn(buttonVariants({ variant: "outline" }), bigButton)}>
            See all events
          </Link>
        </section>

        <section id="about" aria-labelledby="about-heading" className="flex scroll-mt-4 flex-col gap-4">
          <SectionHeading id="about-heading">About us</SectionHeading>
          <div className="flex flex-col gap-3 text-lg leading-relaxed">
            {ABOUT.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <h3 className="font-heading mt-2 text-xl font-semibold">Your first Sunday</h3>
          {/* On phones each label sits above its answer, so the answers get the full width. */}
          <dl className="grid gap-x-5 gap-y-4 text-lg sm:grid-cols-[auto_1fr] sm:gap-y-2">
            {FIRST_SUNDAY.map(({ label, text }) => (
              <div key={label} className="flex flex-col sm:contents">
                <dt className="font-bold">{label}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="contact" aria-labelledby="contact-heading" className="flex scroll-mt-4 flex-col gap-4">
          <SectionHeading id="contact-heading">Visit or message us</SectionHeading>
          <Suspense>
            <Address />
          </Suspense>
          {MESSENGER_URL && (
            <a href={MESSENGER_URL} className={cn(buttonVariants({ variant: "outline" }), bigButton)}>
              <MessageCircleIcon className="size-6" aria-hidden />
              Message us on Messenger
            </a>
          )}
          {FACEBOOK_URL && (
            <a href={FACEBOOK_URL} className={cn(buttonVariants({ variant: "outline" }), bigButton)}>
              Our Facebook page
            </a>
          )}
          {/* The serving schedule isn't a tab (it's for members), so this is its way in. */}
          <p className="mt-2 rounded-xl bg-accent p-4 text-lg">
            Serving this week? Members can see the{" "}
            <Link href="/schedule" className="font-semibold text-accent-foreground underline underline-offset-4">
              serving schedule
            </Link>
            .
          </p>
        </section>

        <footer className="flex gap-5 border-t pt-6 text-muted-foreground">
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy
          </Link>
          <Link href="/admin" className="underline underline-offset-4 hover:text-foreground">
            Admin sign-in
          </Link>
        </footer>
      </main>
    </>
  );
}

async function loadAgenda() {
  // The event list is cached; which services are running and what's next depend on the time.
  await connection();
  return landingAgenda(await getPublishedEvents(), new Date());
}

/** "Sundays at 9:00 AM" as the headline, then the other regular services under it. */
async function Welcome() {
  const { services } = await loadAgenda();
  const [main, ...others] = services;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-5xl leading-[1.05] font-semibold tracking-tight">
        {main ? (
          <>
            {weekdays(main)} at
            <span className="block text-primary">{time(main)}</span>
          </>
        ) : (
          "Welcome to CAMAC San Fernando"
        )}
      </h1>
      <p className="text-xl leading-relaxed">{WELCOME}</p>
      {others.map((service) => (
        // The other regular services, set in full color with a bold name so they read as part of
        // the welcome, a step below the headline.
        <p key={service.id} className="text-lg">
          <strong className="font-bold text-primary">{service.title}</strong> every{" "}
          {formatManila(service.startsAt, { weekday: "long" })} at {time(service)}
        </p>
      ))}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <a href="#contact" className={cn(buttonVariants(), bigButton)}>
          <MapIcon className="size-6" aria-hidden />
          Directions
        </a>
        <a href="#about" className={cn(buttonVariants({ variant: "outline" }), bigButton)}>
          About us
        </a>
      </div>
    </div>
  );
}

const weekdays = (event: PublicEvent) => `${formatManila(event.startsAt, { weekday: "long" })}s`;
const time = (event: PublicEvent) =>
  formatManila(event.startsAt, { hour: "numeric", minute: "2-digit" });

async function ComingUp() {
  const { comingUp } = await loadAgenda();
  const now = new Date();

  if (comingUp.length === 0) {
    return (
      <p className="text-lg text-muted-foreground">
        No special events posted yet. New ones show up here and on the church Facebook page.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {comingUp.map((entry) => (
        <AgendaRow key={entryKey(entry)} entry={entry} now={now} />
      ))}
    </ul>
  );
}

async function Address() {
  await connection();
  const address = await getChurchAddress();
  if (!address) return null;

  return (
    <>
      <p className="text-xl font-semibold whitespace-pre-line">{address}</p>
      <a
        href={mapsUrl(address)}
        className={cn(buttonVariants(), bigButton)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MapIcon className="size-6" aria-hidden />
        Get directions
      </a>
    </>
  );
}

function WelcomeSkeleton() {
  return (
    <div role="status" aria-label="Loading service times" className="flex flex-col gap-4 motion-safe:animate-pulse">
      <div className="h-12 w-3/4 rounded-md bg-foreground/10" />
      <div className="h-12 w-1/2 rounded-md bg-foreground/10" />
      <div className="h-20 w-full rounded-md bg-foreground/10" />
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="h-14 rounded-full bg-foreground/10" />
        <div className="h-14 rounded-full bg-foreground/10" />
      </div>
    </div>
  );
}
