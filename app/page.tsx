import { Navigation } from "@/components/landing/navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { StatsStrip } from "@/components/landing/stats-strip"
import { PainPoints } from "@/components/landing/pain-points"
import { ThreeClickSection } from "@/components/landing/three-click-section"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { CaseTypes } from "@/components/landing/case-types"
import { PricingSection } from "@/components/landing/pricing-section"
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
      <PricingSection />
      <TestimonialsSection />
      <PhilosophyStrip />
      <EmailSignup />
      <Footer />
    </main>
  )
}
