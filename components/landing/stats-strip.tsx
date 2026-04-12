"use client"

const stats = [
  {
    value: "3 months - 1 day",
    label: "ET Claim Window",
  },
  {
    value: "68%",
    label: "ACAS cases settle before tribunal",
  },
  {
    value: "GBP 56,000",
    label: "Vento upper band",
  },
  {
    value: "94%",
    label: "claimants self-represented",
  },
]

export function StatsStrip() {
  return (
    <section className="border-y border-[#c9a84c]/20 bg-[#1e293b] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="animate-in text-center fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-1 text-2xl font-bold text-[#c9a84c] md:text-3xl">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
