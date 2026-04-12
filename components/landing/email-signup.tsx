import Link from "next/link"
import { ArrowRight, BookOpen, FileUp } from "lucide-react"

import { Button } from "@/components/ui/button"

export function EmailSignup() {
  return (
    <section className="relative bg-[#0f172a] py-20">
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-4 font-serif text-3xl font-bold text-white md:text-4xl">
          Ready to <span className="text-[#c9a84c]">Move Your Case Forward?</span>
        </h2>
        <p className="mb-8 text-lg text-white/70">
          Start with the assessment, upload your evidence securely, or explore the free legal
          resources before you decide.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Button
            asChild
            size="lg"
            className="bg-[#c9a84c] font-semibold text-[#0f172a] hover:bg-[#d4b85c]"
          >
            <Link href="https://tally.so/r/eq2Pqe" target="_blank" rel="noopener noreferrer">
              Start Assessment
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/upload">
              Upload Evidence
              <FileUp className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/learn">
              Browse Resources
              <BookOpen className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-white/50">
          Support:{" "}
          <a className="text-[#c9a84c] hover:text-[#d4b85c]" href="mailto:support@ujris.co.uk">
            support@ujris.co.uk
          </a>
        </p>
      </div>
    </section>
  )
}
