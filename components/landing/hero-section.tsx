"use client"

import Link from "next/link"
import { ArrowRight, Heart, Lock, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0f172a]">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0f172a] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/30 bg-white/5 px-4 py-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-sm font-medium text-[#c9a84c]">AI-Powered</span>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/80">UK Law</span>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/80">Free to Start</span>
          </div>

          <h1 className="mb-6 font-serif text-4xl font-bold leading-tight text-white animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 sm:text-5xl md:text-6xl lg:text-7xl">
            Justice Shouldn&apos;t Require a{" "}
            <span className="text-[#c9a84c]">Lawyer</span> to Survive
          </h1>

          <p className="mb-4 text-xl font-medium text-[#c9a84c] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 md:text-2xl">
            Turn evidence into action. Turn discrimination into justice.
          </p>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/70 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            Intelligence-driven legal support for self-represented litigants. Built with racial
            justice in mind, and designed for anyone facing institutional injustice.
          </p>

          <div className="mb-12 flex flex-col items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group bg-[#c9a84c] px-8 py-6 text-lg font-semibold text-[#0f172a] hover:bg-[#d4b85c]"
            >
              <Link href="https://tally.so/r/eq2Pqe" target="_blank" rel="noopener noreferrer">
                Start Your Case
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 px-8 py-6 text-lg text-white hover:border-white/50 hover:bg-white/10"
            >
              <Link href="#features">See All Tools</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="px-8 py-6 text-lg text-white/80 hover:bg-white/5 hover:text-white"
            >
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#c9a84c]" />
              <span>Free to start - no card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#c9a84c]" />
              <span>Processed by the system, not handled manually</span>
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
