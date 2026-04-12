import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Accessibility | UJRIS",
  description:
    "Accessibility information for the UJRIS website, including support contact details and our current accessibility commitments.",
}

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#c9a84c]">
            Accessibility
          </p>
          <h1 className="mt-4 font-serif text-4xl font-bold text-[#0f172a]">
            UJRIS accessibility statement
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            We want UJRIS to be usable for as many people as possible. We are continuing to
            improve the site before and after launch, and we welcome feedback on anything that
            creates friction.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#0f172a]">Current support</h2>
            <p className="mt-4 leading-7 text-slate-600">
              We aim to support keyboard navigation, readable color contrast, clear headings, and
              responsive layouts across desktop and mobile devices.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#0f172a]">Need help using the site?</h2>
            <p className="mt-4 leading-7 text-slate-600">
              If you hit an accessibility issue, email{" "}
              <a
                className="text-[#0f172a] underline underline-offset-4"
                href="mailto:support@ujris.co.uk"
              >
                support@ujris.co.uk
              </a>{" "}
              with a short description of the problem, the page you were on, and the device or
              browser you were using.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#0f172a]">Useful links</h2>
            <div className="mt-4 flex flex-col gap-3 text-slate-600">
              <Link className="text-[#0f172a] underline underline-offset-4" href="/">
                Return to homepage
              </Link>
              <Link className="text-[#0f172a] underline underline-offset-4" href="/learn">
                Visit the learning hub
              </Link>
              <Link className="text-[#0f172a] underline underline-offset-4" href="/privacy">
                Read the privacy policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
