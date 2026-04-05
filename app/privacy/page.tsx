import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Trash2, Eye, FileText, Mail, ChevronLeft } from "lucide-react";
import { getPrivacyNotice, RETENTION_POLICY } from "@/lib/gdpr";

export const metadata = {
  title: "Privacy Policy | UJRIS - Justice Intelligence",
  description: "UJRIS privacy policy and data protection information. UK GDPR compliant.",
};

export default function PrivacyPage() {
  const privacyNotice = getPrivacyNotice();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-[#0f172a] text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UJRIS%203D%20LOGO_TRANSPARENT%20BACKGROUND%202-WOnejyAsEuSSKBlOi6k8nTXsGT3mAr.jpg"
              alt="UJRIS"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="font-serif font-bold text-xl">UJRIS</span>
          </Link>
          <Button asChild variant="ghost" className="text-slate-300 hover:text-white">
            <Link href="/">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0f172a] mb-4">
            <Shield className="w-8 h-8 text-[#c9a84c]" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-[#0f172a] mb-2">Privacy Policy</h1>
          <p className="text-slate-600">
            Version {privacyNotice.version} | Last updated: {privacyNotice.lastUpdated}
          </p>
        </div>

        {/* Quick Summary */}
        <Card className="mb-8 border-[#c9a84c]/30 bg-[#c9a84c]/5">
          <CardHeader>
            <CardTitle className="text-lg">Summary: Your Data Rights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#c9a84c] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Encrypted at Rest</p>
                  <p className="text-sm text-slate-600">AES-256 encryption for all data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-[#c9a84c] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Auto-Delete</p>
                  <p className="text-sm text-slate-600">
                    {RETENTION_POLICY.defaultRetentionDays} days after delivery
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-[#c9a84c] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">No Human Access</p>
                  <p className="text-sm text-slate-600">Only AI processes your documents</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-[#c9a84c] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Data Portability</p>
                  <p className="text-sm text-slate-600">Request your data anytime</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Sections */}
        <div className="space-y-6">
          {privacyNotice.sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0f172a] text-white text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Request Section */}
        <Card className="mt-12 border-[#0f172a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#c9a84c]" />
              Exercise Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              To exercise any of your data protection rights (access, deletion, portability,
              rectification), please contact our Data Protection Officer:
            </p>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="font-medium text-slate-900">Data Protection Officer</p>
              <p className="text-slate-600">Email: dpo@ujris.co.uk</p>
              <p className="text-sm text-slate-500 mt-2">
                We will respond to your request within 30 days as required by UK GDPR.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ICO Notice */}
        <div className="mt-8 p-4 bg-slate-100 rounded-lg">
          <p className="text-sm text-slate-600 text-center">
            If you are not satisfied with our response, you have the right to lodge a complaint
            with the Information Commissioner&apos;s Office (ICO) at{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c9a84c] hover:underline"
            >
              ico.org.uk
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-white py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} UJRIS. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/disclaimer" className="text-slate-400 hover:text-white transition-colors">
              Legal Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
