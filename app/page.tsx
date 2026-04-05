import { Navigation } from "@/components/landing/navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { StatsStrip } from "@/components/landing/stats-strip"
import { PainPoints } from "@/components/landing/pain-points"
import { ThreeClickSection } from "@/components/landing/three-click-section"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { CaseTypes } from "@/components/landing/case-types"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { PhilosophyStrip } from "@/components/landing/philosophy-strip"
import { EmailSignup } from "@/components/landing/email-signup"
import { Footer } from "@/components/landing/footer"

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
      {/* SINGLE PRICE SECTION */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0f172a] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 text-lg">
              One payment. Your case analyzed. No hidden fees.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-[#c9a84c] p-8 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#c9a84c] text-[#0f172a] px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>

              <div className="mb-6">
                <div className="text-5xl font-bold text-[#0f172a]">£49</div>
                <div className="text-slate-500">one-time payment</div>
              </div>

              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Unlimited document uploads (any size)</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>AI legal summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Timeline generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Ready-to-send appeal letter</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Password-protected PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>7-day refund if not useful</span>
                </li>
              </ul>

              <a
                href="https://tally.so/r/eq2Pqe"
                target="_blank"
                className="block w-full bg-[#c9a84c] hover:bg-[#b8973f] text-[#0f172a] font-semibold py-3 px-6 rounded-lg transition text-center"
              >
                Start Your Case — £49 →
              </a>

              <p className="text-xs text-slate-500 mt-4">
                ⚡ 90-minute delivery • 🔒 Secure payment • 💵 7-day refund
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
