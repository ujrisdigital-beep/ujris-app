import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Flame,
  Layers3,
  Link2,
  MessageSquareShare,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

export const metadata: Metadata = {
  title: "IKENGA | Content Social Generate",
  description:
    "IKENGA is a concept page for a social content operating system with brand voice memory, OAuth-connected channels, and calendar-aware publishing.",
};

type Capability = {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

type Connection = {
  platform: string;
  status: string;
  detail: string;
};

type ScheduleItem = {
  day: string;
  title: string;
  channel: string;
  time: string;
};

const moduleStack: Capability[] = [
  {
    label: "content",
    title: "Content Engine",
    description:
      "Turn one strategy brief into a week of hooks, captions, scripts, and repurposed angles.",
    icon: Layers3,
  },
  {
    label: "social",
    title: "Channel Mapping",
    description:
      "Translate the same idea into LinkedIn authority, Instagram emotion, X velocity, and short-form video structure.",
    icon: MessageSquareShare,
  },
  {
    label: "generate",
    title: "Structured Generation",
    description:
      "Generate drafts with reusable constraints for CTA style, audience stage, offer type, and post objective.",
    icon: WandSparkles,
  },
  {
    label: "oauth",
    title: "Connected Publishing",
    description:
      "Bring channels in through OAuth so drafts are not trapped in a document before publishing.",
    icon: Link2,
  },
  {
    label: "calendar",
    title: "Schedule Intelligence",
    description:
      "Plan launches, recurring pillars, and campaign bursts against a visible publishing calendar.",
    icon: CalendarDays,
  },
  {
    label: "brand.voice",
    title: "Voice Memory",
    description:
      "Store tone rules, signature phrases, pacing, and forbidden patterns so every draft sounds like the same brand.",
    icon: Flame,
  },
];

const connections: Connection[] = [
  {
    platform: "LinkedIn",
    status: "Connected",
    detail: "Thought-leadership posts and founder updates are ready for direct publish.",
  },
  {
    platform: "Instagram",
    status: "Sandbox",
    detail: "Carousel captions, reel hooks, and CTA variants are prepared for approval.",
  },
  {
    platform: "X / Threads",
    status: "Connected",
    detail: "Thread expansion and quote-card snippets can publish from the same brief.",
  },
  {
    platform: "Google Calendar",
    status: "Synced",
    detail: "Launch windows and campaign milestones stay visible to the content team.",
  },
];

const scheduleItems: ScheduleItem[] = [
  {
    day: "Mon",
    title: "Founder insight on customer pain",
    channel: "LinkedIn",
    time: "09:00",
  },
  {
    day: "Wed",
    title: "Reel script with 3 scene beats",
    channel: "Instagram",
    time: "13:30",
  },
  {
    day: "Thu",
    title: "Launch countdown thread",
    channel: "X / Threads",
    time: "17:00",
  },
  {
    day: "Sat",
    title: "Weekly proof round-up",
    channel: "Newsletter to social cutdown",
    time: "10:15",
  },
];

const outputModes = [
  "Campaign brief -> pillar map -> post variants",
  "Long-form source -> short-form cutdowns -> CTA ladders",
  "Voice file -> reusable prompts -> reviewed publishes",
];

const selectedDates = [
  new Date(2026, 3, 7),
  new Date(2026, 3, 9),
  new Date(2026, 3, 10),
  new Date(2026, 3, 12),
  new Date(2026, 3, 16),
  new Date(2026, 3, 21),
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <Badge className="mb-4 bg-[#2b2117] text-[#f5d08c] hover:bg-[#2b2117]">
        {eyebrow}
      </Badge>
      <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#16110d] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[#5c4a39]">{description}</p>
    </div>
  );
}

function CapabilityCard({ item }: { item: Capability }) {
  const Icon = item.icon;

  return (
    <Card className="border-[#d9c8b0] bg-[#fffaf2] shadow-[0_12px_40px_rgba(48,29,12,0.08)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge
              variant="outline"
              className="border-[#d7aa55] bg-[#fff5de] text-[#7a5517]"
            >
              {item.label}
            </Badge>
            <CardTitle className="mt-3 text-xl text-[#1f1711]">{item.title}</CardTitle>
          </div>
          <div className="rounded-2xl bg-[#241810] p-3 text-[#f5d08c]">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-[#5d4d3f]">{item.description}</p>
      </CardContent>
    </Card>
  );
}

export default function IkengaPage() {
  return (
    <main className="min-h-screen bg-[#f7f0e4] text-[#1b1612]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(208,151,63,0.22),_transparent_28%),linear-gradient(135deg,_#110d0a_0%,_#1f1711_42%,_#2b2117_100%)] text-[#f8ecd3]">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute -left-20 top-14 h-72 w-72 rounded-full border border-[#d6a654]/20" />
          <div className="absolute right-[-4rem] top-20 h-56 w-56 rounded-full bg-[#d6a654]/10 blur-3xl" />
          <div className="absolute bottom-[-6rem] left-1/3 h-60 w-60 rounded-full bg-[#7d4a19]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#e3bd79]">
                Strength of the right hand
              </p>
              <h1 className="mt-3 font-serif text-2xl tracking-tight text-white sm:text-3xl">
                IKENGA
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-[#e1b15d] text-[#1a140f] hover:bg-[#edc06f]"
              >
                <Link href="/">Back to UJRIS</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/5 text-[#f8ecd3] hover:bg-white/10 hover:text-white"
              >
                <a href="#calendar">Open Calendar View</a>
              </Button>
            </div>
          </header>

          <div className="grid gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <Badge className="mb-5 bg-[#f0c36f]/15 text-[#f5d08c] hover:bg-[#f0c36f]/15">
                content.social.generate.oauth.calendar.brand.voice
              </Badge>
              <h2 className="max-w-3xl font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                A social content operating system for brands that need disciplined output.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#decfbf]">
                IKENGA frames content as aligned action: one brief, one voice model, connected
                channels, and a calendar that keeps strategy moving instead of stalling in drafts.
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur">
                <p className="font-mono text-sm leading-7 text-[#f0d7ab]">
                  ikenga | content | social | generate | oauth | calendar | brand.voice
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#e1b15d] text-[#1a140f] hover:bg-[#edc06f]"
                >
                  <a href="#stack">
                    Explore the stack
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-[#f8ecd3] hover:bg-white/10 hover:text-white"
                >
                  <a href="#voice">See brand.voice</a>
                </Button>
              </div>
            </div>

            <Card className="border-white/10 bg-white/5 text-[#f8ecd3] shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur">
              <CardHeader>
                <Badge className="w-fit bg-[#e1b15d] text-[#1a140f] hover:bg-[#e1b15d]">
                  System framing
                </Badge>
                <CardTitle className="text-2xl text-white">
                  Action, memory, distribution
                </CardTitle>
                <CardDescription className="text-[#d2c2b2]">
                  Inspired by Ikenga as disciplined, self-directed action rather than passive
                  intention.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {outputModes.map((mode) => (
                  <div
                    key={mode}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="mt-0.5 rounded-full bg-[#e1b15d]/15 p-1.5 text-[#f5d08c]">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-6 text-[#efe3d2]">{mode}</p>
                  </div>
                ))}

                <div className="rounded-2xl border border-[#e1b15d]/20 bg-[#e1b15d]/8 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#f5d08c]">
                    <Workflow className="h-4 w-4" />
                    Weekly rhythm
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#efe3d2]">
                    Monday strategy, midweek repurposing, launch-day publishing, weekend proof
                    loops.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="stack" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Module Stack"
          title="Each part of the string becomes a working part of the product."
          description="Rather than a generic dashboard, IKENGA is framed as an operating model: generate from a source brief, preserve voice fidelity, connect channels securely, and schedule with visibility."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {moduleStack.map((item) => (
            <CapabilityCard key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="border-y border-[#ddccb3] bg-[#f3e5d0]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div id="voice">
            <SectionHeading
              eyebrow="brand.voice"
              title="Voice rules become reusable memory, not a loose prompt."
              description="The strongest social systems do not just write quickly. They remember how the brand speaks, what it refuses to sound like, and how proof should be layered into every output."
            />

            <Card className="mt-8 border-[#d9c8b0] bg-[#fffaf2]">
              <CardHeader>
                <CardTitle className="text-xl text-[#1e1712]">Voice file</CardTitle>
                <CardDescription className="text-[#63503d]">
                  Example constraints for a sharp, conviction-led founder brand.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b6530]">
                    Reach for
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[#4f4033]">
                    <li>Specific proof over inflated claims</li>
                    <li>Clear verbs and commercial tension</li>
                    <li>Calm confidence with earned urgency</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b6530]">
                    Avoid
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[#4f4033]">
                    <li>Buzzword stacks and vague inspiration</li>
                    <li>Over-friendly filler intros</li>
                    <li>Claims that cannot be evidenced</li>
                  </ul>
                </div>
                <div className="sm:col-span-2 rounded-2xl bg-[#221a13] p-5 text-[#f7ebd0]">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#d9b473]">
                    Example generated line
                  </p>
                  <p className="mt-3 text-sm leading-7">
                    We do not publish to look busy. We publish to move a prospect from curiosity
                    to conviction with proof they can repeat back to their team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <SectionHeading
              eyebrow="oauth"
              title="Connected channels make generation operational."
              description="OAuth is what turns a content engine into a publishing system. Channels, posting permissions, and campaign calendars can live in the same flow instead of being copied between tools."
            />

            <div className="mt-8 grid gap-4">
              {connections.map((connection) => (
                <Card
                  key={connection.platform}
                  className="border-[#d9c8b0] bg-[#fffaf2] shadow-[0_12px_40px_rgba(48,29,12,0.06)]"
                >
                  <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-[#1e1712]">{connection.platform}</p>
                      <p className="mt-1 text-sm leading-6 text-[#5b4a3b]">{connection.detail}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-[#ecdfc6] px-4 py-2 text-sm font-medium text-[#6d4b18]">
                      <ShieldCheck className="h-4 w-4" />
                      {connection.status}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="calendar" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="calendar"
          title="A visible publishing cadence is where momentum stops leaking."
          description="The calendar is not decoration here. It is the control surface for campaign rhythm, content gaps, review windows, and launch sequences."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="border-[#d9c8b0] bg-[#fffaf2]">
            <CardHeader>
              <CardTitle className="text-xl text-[#1d1712]">Scheduled this cycle</CardTitle>
              <CardDescription className="text-[#63503d]">
                A lightweight view of how social assets line up across the week.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scheduleItems.map((item) => (
                <div
                  key={`${item.day}-${item.title}`}
                  className="rounded-2xl border border-[#eadbc3] bg-[#fffcf7] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a6331]">
                      {item.day}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-[#5b4a3b]">
                      <Clock3 className="h-4 w-4" />
                      {item.time}
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#1f1813]">{item.title}</p>
                  <p className="mt-1 text-sm text-[#5b4a3b]">{item.channel}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#d9c8b0] bg-[#fffaf2]">
            <CardHeader>
              <CardTitle className="text-xl text-[#1d1712]">April 2026 publishing map</CardTitle>
              <CardDescription className="text-[#63503d]">
                Highlighted dates show scheduled content moments and review checkpoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="multiple"
                month={new Date(2026, 3, 1)}
                selected={selectedDates}
                className="rounded-2xl border border-[#ecdcc4] bg-[#fffdf8]"
                classNames={{
                  today: "rounded-md bg-[#221a13] text-[#f5d08c]",
                }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-[#1a140f] py-20 text-[#f7ebd0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.24)] lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <Badge className="bg-[#e1b15d] text-[#1a140f] hover:bg-[#e1b15d]">generate</Badge>
              <h2 className="mt-5 font-serif text-3xl text-white sm:text-4xl">
                Generate once, then adapt with intent.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#ddd0c2]">
                IKENGA is strongest when generation is constrained by strategy. The system should
                know the offer, the channel, the proof point, and the voice before it writes.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                "Source brief carries audience, proof, CTA, and campaign goal.",
                "Generated drafts branch by platform without losing the core message.",
                "Review and publish stay attached to the calendar, not scattered across tabs.",
              ].map((line) => (
                <div
                  key={line}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/15 p-4"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 text-[#f5d08c]" />
                  <p className="text-sm leading-6 text-[#efe3d2]">{line}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#cda86a]">IKENGA concept route</p>
              <p className="mt-2 text-lg text-[#f6ead1]">
                A concrete page prototype for the module string you dropped into the repo.
              </p>
            </div>
            <Button
              asChild
              className="bg-[#e1b15d] text-[#1a140f] hover:bg-[#edc06f]"
            >
              <Link href="/">
                Return home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
