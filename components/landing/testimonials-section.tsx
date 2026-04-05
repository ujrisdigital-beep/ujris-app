"use client"

import { Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "UJRIS helped me identify contradictions in my employer&apos;s response that I would never have spotted. The Anchor Lie Detection feature was a game-changer for my race discrimination case.",
    author: "M.O.",
    role: "Employment Tribunal Claimant",
    case: "Race Discrimination",
  },
  {
    quote:
      "As someone with a disability fighting PIP denials, I felt powerless. UJRIS gave me the tools to organize my evidence and present my case clearly. I won my appeal.",
    author: "A.K.",
    role: "Self-Represented Litigant",
    case: "Disability Discrimination",
  },
  {
    quote:
      "I recommend UJRIS to everyone who comes to us feeling overwhelmed. It does what we wish we could do for every client - gives them real, actionable guidance.",
    author: "C.A.",
    role: "Citizens Advice Volunteer",
    case: "Advisory Role",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-[#0f172a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            Real People. Real <span className="text-[#c9a84c]">Justice.</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Join thousands fighting back with UJRIS
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[#1e293b] rounded-xl p-8 border border-white/10 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Quote className="h-10 w-10 text-[#c9a84c] mb-6" />
              <p className="text-white/80 mb-6 leading-relaxed italic">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="border-t border-white/10 pt-4">
                <p className="text-white font-semibold">{testimonial.author}</p>
                <p className="text-white/60 text-sm">{testimonial.role}</p>
                <p className="text-[#c9a84c] text-sm mt-1">{testimonial.case}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
