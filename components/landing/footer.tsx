"use client"

import Link from "next/link"
import Image from "next/image"

const platformLinks = [
  { label: "Assessment Tool", href: "https://tally.so/r/eq2Pqe" },
  { label: "Forensic Analyser", href: "https://tally.so/r/eq2Pqe" },
  { label: "SAR Generator", href: "https://tally.so/r/eq2Pqe" },
  { label: "Timeline Builder", href: "https://tally.so/r/eq2Pqe" },
]

const supportLinks = [
  { label: "Learning Hub", href: "/learn" },
  { label: "Help Centre", href: "#" },
  { label: "Contact Us", href: "mailto:support@ujris.co.uk" },
  { label: "Report a Bug", href: "mailto:bugs@ujris.co.uk" },
]

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Legal Disclaimer", href: "/disclaimer" },
  { label: "Accessibility", href: "#" },
]

export function Footer() {
  return (
    <footer className="bg-[#0f172a] border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
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
            <p className="text-white/60 mb-4 max-w-sm">
              Justice Shouldn&apos;t Require a Lawyer to Survive. AI-powered legal tools for
              self-represented litigants.
            </p>
            <p className="text-[#c9a84c] text-sm font-medium">Justice Intelligence</p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target="_blank"
                    className="text-white/60 hover:text-[#c9a84c] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#c9a84c] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#c9a84c] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="bg-[#1e293b] rounded-lg p-4 mb-8">
            <p className="text-white/60 text-sm text-center">
              <strong className="text-[#c9a84c]">Important:</strong> UJRIS is a decision-support tool,
              not legal advice. For complex legal matters, please consult a qualified solicitor or
              barrister.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} UJRIS. All rights reserved. Patent pending.
            </p>
            <p className="text-white/40 text-sm">
              Built with purpose. Powered by justice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
