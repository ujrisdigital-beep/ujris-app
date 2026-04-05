"use client"

import Link from "next/link"
import { ArrowRight, FileWarning, Car, ShieldX, Briefcase } from "lucide-react"

const caseTypes = [
  {
    icon: FileWarning,
    title: "PIP Appeal",
    subtitle: "DWP",
    description: "Challenge Personal Independence Payment decisions with evidence-based arguments",
  },
  {
    icon: Car,
    title: "Parking Ticket / PCN",
    subtitle: "Council",
    description: "Fight unfair Penalty Charge Notices with procedural and substantive defenses",
  },
  {
    icon: ShieldX,
    title: "Insurance Claim Denial",
    subtitle: "Insurers",
    description: "Challenge rejected claims and bad faith insurance practices",
  },
  {
    icon: Briefcase,
    title: "Employment Dispute",
    subtitle: "Employer",
    description: "Discrimination, unfair dismissal, harassment, and whistleblowing cases",
  },
]

export function CaseTypes() {
  return (
    <section className="py-20 bg-[#1e293b]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            What Are You <span className="text-[#c9a84c]">Fighting?</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Select your case type to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {caseTypes.map((caseType, index) => (
            <Link
              key={index}
              href="https://tally.so/r/eq2Pqe"
              target="_blank"
              className="group bg-[#0f172a] rounded-xl p-6 border border-white/10 hover:border-[#c9a84c]/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center mb-4 group-hover:bg-[#c9a84c] transition-colors">
                <caseType.icon className="h-7 w-7 text-[#c9a84c] group-hover:text-[#0f172a] transition-colors" />
              </div>
              <div className="mb-2">
                <span className="text-xs font-medium text-[#c9a84c] uppercase tracking-wider">
                  {caseType.subtitle}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#c9a84c] transition-colors">
                {caseType.title}
              </h3>
              <p className="text-white/60 text-sm mb-4">{caseType.description}</p>
              <div className="flex items-center text-[#c9a84c] text-sm font-medium">
                Start Case
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
