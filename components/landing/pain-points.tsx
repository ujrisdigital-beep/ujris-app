"use client"

import { HelpCircle, ShieldX, Banknote, Clock, Zap, Heart } from "lucide-react"

const painPoints = [
  {
    icon: HelpCircle,
    problem: "I don't know where to start",
    solution: "Guided 4-step assessment gives you clarity in 10 minutes",
  },
  {
    icon: ShieldX,
    problem: "They're denying everything",
    solution: "Forensic Analyser exposes contradictions line by line",
  },
  {
    icon: Banknote,
    problem: "Solicitors cost £250/hour",
    solution: "What costs £500 takes £29 here",
  },
  {
    icon: Clock,
    problem: "I don't know my deadlines",
    solution: "Live countdown to tribunal filing deadlines",
  },
  {
    icon: Zap,
    problem: "The system is designed to crush me",
    solution: "Anchor Lie Detection exposes foundational falsehoods",
  },
  {
    icon: Heart,
    problem: "I'm facing abuse AND discrimination",
    solution: "Covers domestic abuse, IOPC complaints, ICO breaches",
  },
]

export function PainPoints() {
  return (
    <section className="py-20 bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0f172a] mb-4">
            We Understand Your <span className="text-[#c9a84c]">Struggle</span>
          </h2>
          <p className="text-lg text-[#64748b] max-w-2xl mx-auto">
            Every problem you face has a solution in UJRIS
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {painPoints.map((item, index) => (
            <div
              key={index}
              className="group bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0] hover:shadow-lg hover:border-[#c9a84c]/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#0f172a] flex items-center justify-center group-hover:bg-[#c9a84c] transition-colors">
                  <item.icon className="h-6 w-6 text-[#c9a84c] group-hover:text-[#0f172a] transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-[#0f172a] font-medium mb-2 italic">
                    &ldquo;{item.problem}&rdquo;
                  </p>
                  <div className="w-12 h-0.5 bg-[#c9a84c] mb-2" />
                  <p className="text-[#64748b] text-sm">{item.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
