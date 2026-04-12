import { CaseTypes } from "@/components/landing/case-types"
import { EmailSignup } from "@/components/landing/email-signup"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { Footer } from "@/components/landing/footer"
import { HeroSection } from "@/components/landing/hero-section"
import { Navigation } from "@/components/landing/navigation"
import { PainPoints } from "@/components/landing/pain-points"
import { PhilosophyStrip } from "@/components/landing/philosophy-strip"
import { StatsStrip } from "@/components/landing/stats-strip"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { ThreeClickSection } from "@/components/landing/three-click-section"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <StatsStrip />
      <PainPoints />
      <ThreeClickSection />
      <FeaturesGrid />
      <CaseTypes />

      <section id="pricing" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold text-[#0f172a] md:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600">One payment. Your case analyzed. No hidden fees.</p>
          </div>

          <div className="mx-auto max-w-md">
            <div className="relative rounded-2xl border-2 border-[#c9a84c] bg-white p-8 text-center shadow-xl">
              <div className="absolute left-1/2 top-[-1rem] -translate-x-1/2 transform">
                <span className="rounded-full bg-[#c9a84c] px-4 py-1 text-sm font-semibold text-[#0f172a]">
                  Most Popular
                </span>
              </div>

              <div className="mb-6">
                <div className="text-5xl font-bold text-[#0f172a]">GBP 49</div>
                <div className="text-slate-500">one-time payment</div>
              </div>

              <ul className="mb-8 space-y-3 text-left">
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited document uploads (any size)</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI legal summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Timeline generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Ready-to-send appeal letter</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Password-protected PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>7-day refund if not useful</span>
                </li>
              </ul>

              <a
                href="https://tally.so/r/eq2Pqe"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-[#c9a84c] px-6 py-3 text-center font-semibold text-[#0f172a] transition hover:bg-[#b8973f]"
              >
                Start Your Case - GBP 49 -&gt;
              </a>

              <p className="mt-4 text-xs text-slate-500">
                90-minute delivery | Secure payment | 7-day refund
              </p>
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <PhilosophyStrip />
      <EmailSignup />
      <Footer />
    </main>
  )
}
