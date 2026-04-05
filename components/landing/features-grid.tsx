"use client"

import {
  Search,
  FileCheck,
  Calendar,
  Mail,
  Shield,
  Brain,
  FileEdit,
  Video,
  Timer,
} from "lucide-react"

const features = [
  {
    icon: Search,
    title: "Anchor Lie Detection",
    description: "15 forensic detectors that expose contradictions and foundational falsehoods",
    highlight: true,
  },
  {
    icon: FileCheck,
    title: "Truth-Layer Reports",
    description: "Court-ready PDF documents that present your evidence professionally",
    highlight: false,
  },
  {
    icon: Calendar,
    title: "Evidence Timeline",
    description: "Drag-and-drop timeline builder to organize your case chronologically",
    highlight: false,
  },
  {
    icon: Mail,
    title: "SAR Intelligence",
    description: "Auto-generate Subject Access Requests to gather evidence legally",
    highlight: false,
  },
  {
    icon: Shield,
    title: "Sovereign Shield",
    description: "Specialized pathways for domestic abuse and coercive control cases",
    highlight: false,
  },
  {
    icon: Brain,
    title: "Case Intelligence",
    description: "AI-powered strength scoring to assess your chances of success",
    highlight: false,
  },
  {
    icon: FileEdit,
    title: "AI Document Drafting",
    description: "Generate grievance letters, ET1 guidance, and legal correspondence",
    highlight: false,
  },
  {
    icon: Video,
    title: "CCTV Analyser",
    description: "Challenge video evidence and identify inconsistencies",
    highlight: false,
  },
  {
    icon: Timer,
    title: "Deadlines Centre",
    description: "Live countdown timers so you never miss a filing deadline",
    highlight: false,
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0f172a] mb-4">
            Your Complete <span className="text-[#c9a84c]">Legal Arsenal</span>
          </h2>
          <p className="text-lg text-[#64748b] max-w-2xl mx-auto">
            Every tool you need to build, analyze, and win your case
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group p-6 rounded-xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
                feature.highlight
                  ? "bg-[#0f172a] border-[#c9a84c] shadow-lg shadow-[#c9a84c]/10"
                  : "bg-white border-[#e2e8f0] hover:border-[#c9a84c]/50 hover:shadow-md"
              }`}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  feature.highlight
                    ? "bg-[#c9a84c]"
                    : "bg-[#0f172a] group-hover:bg-[#c9a84c] transition-colors"
                }`}
              >
                <feature.icon
                  className={`h-6 w-6 ${
                    feature.highlight
                      ? "text-[#0f172a]"
                      : "text-[#c9a84c] group-hover:text-[#0f172a] transition-colors"
                  }`}
                />
              </div>
              <h3
                className={`text-lg font-semibold mb-2 ${
                  feature.highlight ? "text-white" : "text-[#0f172a]"
                }`}
              >
                {feature.title}
              </h3>
              <p className={feature.highlight ? "text-white/70" : "text-[#64748b]"}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
