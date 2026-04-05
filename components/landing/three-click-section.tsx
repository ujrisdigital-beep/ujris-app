"use client"

import { MousePointer, Wrench, FileText } from "lucide-react"

const steps = [
  {
    icon: MousePointer,
    step: "1",
    title: "Open UJRIS",
    description: "Select or create your case",
  },
  {
    icon: Wrench,
    step: "2",
    title: "Choose Your Tool",
    description: "Assessment, Forensic, SAR, or Timeline",
  },
  {
    icon: FileText,
    step: "3",
    title: "Generate Report",
    description: "Court-ready PDF in seconds",
  },
]

export function ThreeClickSection() {
  return (
    <section id="how-it-works" className="py-20 bg-[#0f172a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 mb-6">
            <span className="text-[#c9a84c] text-sm font-medium">The 3-Click Rule</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            Justice in <span className="text-[#c9a84c]">3 Clicks</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            No complexity. No confusion. Just results.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#c9a84c] to-[#c9a84c]/30" />
              )}

              <div className="relative z-10">
                {/* Step Number */}
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-[#1e293b] border-2 border-[#c9a84c]/50 flex items-center justify-center group hover:border-[#c9a84c] transition-colors">
                  <div className="text-center">
                    <step.icon className="h-10 w-10 text-[#c9a84c] mx-auto mb-2" />
                    <span className="text-3xl font-bold text-[#c9a84c]">{step.step}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-white/70">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
