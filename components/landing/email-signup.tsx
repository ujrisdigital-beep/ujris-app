"use client"

import { useState, useEffect } from "react"
import { ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmailSignup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [signupCount, setSignupCount] = useState(0)

  useEffect(() => {
    // Load signup count from localStorage
    const count = localStorage.getItem("ujris_signup_count")
    setSignupCount(count ? parseInt(count, 10) : 1247) // Start with a base number
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate saving to localStorage
    const signups = JSON.parse(localStorage.getItem("ujris_signups") || "[]")
    signups.push({ name, email, date: new Date().toISOString() })
    localStorage.setItem("ujris_signups", JSON.stringify(signups))

    // Increment count
    const newCount = signupCount + 1
    localStorage.setItem("ujris_signup_count", newCount.toString())
    setSignupCount(newCount)

    setIsSubmitted(true)
    setName("")
    setEmail("")

    // Reset after 3 seconds
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  return (
    <section className="py-20 bg-[#0f172a] relative overflow-hidden">
      {/* Gold gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
          Join the <span className="text-[#c9a84c]">Justice Movement</span>
        </h2>
        <p className="text-lg text-white/70 mb-8">
          Get instant access to UJRIS — free forever
        </p>

        {/* Signup Counter */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 mb-8">
          <span className="text-[#c9a84c] font-bold">{signupCount.toLocaleString()}</span>
          <span className="text-white/70 text-sm">people have joined</span>
        </div>

        {isSubmitted ? (
          <div className="flex items-center justify-center gap-3 p-6 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-xl animate-in fade-in duration-300">
            <CheckCircle className="h-6 w-6 text-[#c9a84c]" />
            <span className="text-white text-lg">Welcome to the movement! Check your inbox.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[#c9a84c] transition-colors"
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[#c9a84c] transition-colors"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto bg-[#c9a84c] text-[#0f172a] hover:bg-[#d4b85c] font-semibold px-8 py-6 text-lg group"
            >
              Get Free Access
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        )}

        <p className="text-white/50 text-sm mt-6">
          No spam. No selling your data. Unsubscribe anytime.
        </p>
      </div>
    </section>
  )
}
