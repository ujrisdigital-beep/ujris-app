"use client"

import Link from "next/link"
import { ArrowRight, Shield, Lock, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#0f172a] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0f172a] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-[#c9a84c]/30 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-[#c9a84c] text-sm font-medium">AI-Powered</span>
            <span className="text-white/40">·</span>
            <span className="text-white/80 text-sm">UK Law</span>
            <span className="text-white/40">·</span>
            <span className="text-white/80 text-sm">Free to Start</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Justice Shouldn&apos;t Require a{" "}
            <span className="text-[#c9a84c]">Lawyer</span> to Survive
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-[#c9a84c] font-medium mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Turn evidence into action. Turn discrimination into justice.
          </p>

          {/* Description */}
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            Intelligence-driven legal power for self-represented litigants. Built for BAME
            communities — designed for everyone facing injustice.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <Button
              asChild
              size="lg"
              className="bg-[#c9a84c] text-[#0f172a] hover:bg-[#d4b85c] font-semibold px-8 py-6 text-lg group"
            >
              <Link href="https://tally.so/r/eq2Pqe" target="_blank">
                Start Your Case
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 text-lg"
            >
              <Link href="#features">See All Tools</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/5 px-8 py-6 text-lg"
            >
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#c9a84c]" />
              <span>Free to start — no card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#c9a84c]" />
              <span>Your data stays on your device</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#c9a84c]" />
              <span>Built by a discrimination survivor</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
