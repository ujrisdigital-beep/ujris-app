"use client"

import Image from "next/image"
import Link from "next/link"

const platformLinks = [
  { label: "Assessment Tool", href: "https://tally.so/r/eq2Pqe" },
  { label: "Forensic Analyser", href: "https://tally.so/r/eq2Pqe" },
  { label: "SAR Generator", href: "https://tally.so/r/eq2Pqe" },
  { label: "Timeline Builder", href: "https://tally.so/r/eq2Pqe" },
]

const supportLinks = [
  { label: "Learning Hub", href: "/learn" },
  { label: "Help Centre", href: "/learn" },
  { label: "Contact Us", href: "mailto:support@ujris.co.uk" },
  { label: "Report a Bug", href: "mailto:bugs@ujris.co.uk" },
]

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Legal Disclaimer", href: "/disclaimer" },
  { label: "Accessibility", href: "/accessibility" },
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0f172a]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UJRIS%203D%20LOGO_TRANSPARENT%20BACKGROUND%202-WOnejyAsEuSSKBlOi6k8nTXsGT3mAr.jpg"
                alt="UJRIS Logo"
                width={40}
                height={40}
                className="rounded"
              />
              <span className="text-xl font-bold">
                <span className="text-[#c9a84c]">UJ</span>
                <span className="text-white">RIS</span>
              </span>
            </Link>
            <p className="mb-4 max-w-sm text-white/60">
              Justice Shouldn&apos;t Require a Lawyer to Survive. AI-powered legal tools for
              self-represented litigants.
            </p>
            <p className="text-sm font-medium text-[#c9a84c]">Justice Intelligence</p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Platform</h4>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/60 transition-colors hover:text-[#c9a84c]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-[#c9a84c]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-[#c9a84c]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="mb-8 rounded-lg bg-[#1e293b] p-4">
            <p className="text-center text-sm text-white/60">
              <strong className="text-[#c9a84c]">Important:</strong> UJRIS is a decision-support
              tool, not legal advice. For complex legal matters, please consult a qualified
              solicitor or barrister.
            </p>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-sm text-white/40">(c) {new Date().getFullYear()} UJRIS. All rights reserved.</p>
            <p className="text-sm text-white/40">Built with purpose. Powered by justice.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
