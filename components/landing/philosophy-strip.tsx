"use client"

const tags = [
  "Freedom is sacred",
  "Justice is ancestral",
  "Truth is spiritual",
  "No one stands alone",
]

export function PhilosophyStrip() {
  return (
    <section id="our-story" className="py-20 bg-[#f8fafc]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative">
          {/* Decorative Elements */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#c9a84c]" />

          <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#0f172a] leading-relaxed mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            &ldquo;My resolve for justice is not a lifestyle choice. It is an inheritance. From a
            people who would rather walk into the sea than live as slaves.&rdquo;
          </blockquote>

          <cite className="not-italic text-lg text-[#64748b] block mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            — <span className="text-[#c9a84c] font-semibold">ONYEDIKA MICHAEL OJIAKU</span>, FOUNDER
          </cite>

          <div className="flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-[#0f172a] text-white text-sm font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
