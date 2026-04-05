"use client"

import Link from "next/link"
import { Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Free Forever",
    price: "£0",
    period: "",
    description: "Everything you need to get started",
    features: [
      "Guided 4-step assessment",
      "Evidence vault (unlimited)",
      "AI rights Q&A",
      "Action plan generator",
      "Helpline directory",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium Case",
    price: "£29",
    period: "one-time",
    description: "Full power for a single case",
    badge: "Most Popular",
    features: [
      "Everything in Free",
      "Anchor Lie Detection (15 detectors)",
      "Truth-Layer Report PDF export",
      "Full document pack",
      "SAR Intelligence suite",
      "CCTV Analyser",
      "Case strength scoring",
    ],
    cta: "Get Premium",
    highlighted: true,
  },
  {
    name: "Subscription",
    price: "£9.99",
    period: "/month",
    description: "For ongoing legal battles",
    features: [
      "Everything in Premium",
      "Unlimited cases",
      "Priority AI processing",
      "Advanced forensics",
      "Client portal access",
    ],
    cta: "Subscribe",
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0f172a] mb-4">
            Simple, <span className="text-[#c9a84c]">Transparent</span> Pricing
          </h2>
          <p className="text-lg text-[#64748b] max-w-2xl mx-auto">
            No hidden fees. No subscriptions required. Pay only for what you need.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4 ${
                plan.highlighted
                  ? "bg-[#0f172a] border-2 border-[#c9a84c] shadow-xl shadow-[#c9a84c]/20 scale-105"
                  : "bg-white border border-[#e2e8f0]"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-1 bg-[#c9a84c] text-[#0f172a] text-sm font-semibold rounded-full">
                    <Star className="h-4 w-4 fill-current" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3
                  className={`text-xl font-bold mb-2 ${
                    plan.highlighted ? "text-white" : "text-[#0f172a]"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span
                    className={`text-4xl font-bold ${
                      plan.highlighted ? "text-[#c9a84c]" : "text-[#0f172a]"
                    }`}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.highlighted ? "text-white/60" : "text-[#64748b]"}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-white/70" : "text-[#64748b]"}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? "text-[#c9a84c]" : "text-[#c9a84c]"
                      }`}
                    />
                    <span className={plan.highlighted ? "text-white/80" : "text-[#64748b]"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full ${
                  plan.highlighted
                    ? "bg-[#c9a84c] text-[#0f172a] hover:bg-[#d4b85c]"
                    : "bg-[#0f172a] text-white hover:bg-[#1e293b]"
                }`}
              >
                <Link href="https://tally.so/r/eq2Pqe" target="_blank">
                  {plan.cta}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
