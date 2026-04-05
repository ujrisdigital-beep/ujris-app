import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ChevronLeft, Scale, MessageSquare, Shield } from "lucide-react";

export const metadata = {
  title: "Legal Disclaimer | UJRIS - Justice Intelligence",
  description: "Important legal disclaimer for UJRIS services. Not legal advice.",
};

export default function DisclaimerPage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-[#0f172a] mb-2">Legal Disclaimer</h1>
          <p className="text-slate-600">Please read this disclaimer carefully before using UJRIS</p>
        </div>

        {/* Main Disclaimer */}
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Scale className="w-5 h-5" />
              UJRIS IS NOT A LAW FIRM
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-800">
            <p className="mb-4">
              <strong>UJRIS does not provide legal advice.</strong> Our AI-powered tools are
              designed to assist self-represented litigants in organizing and analyzing their
              documents, but the output should never be considered as legal advice.
            </p>
            <p>
              No solicitor-client relationship is formed by using UJRIS. If you require legal
              advice, please consult a qualified solicitor or barrister.
            </p>
          </CardContent>
        </Card>

        {/* Detailed Disclaimers */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What UJRIS Does</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                  <span>
                    Analyzes documents you upload using artificial intelligence
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                  <span>
                    Identifies potential contradictions and patterns in evidence
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                  <span>Generates chronological timelines of events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                  <span>Produces summaries and draft letters for your review</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                  <span>Provides educational resources about legal processes</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What UJRIS Does NOT Do</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>
                    <strong>Does NOT provide legal advice</strong> - our output is analysis, not
                    advice
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>
                    <strong>Does NOT guarantee outcomes</strong> - legal proceedings are
                    unpredictable
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>
                    <strong>Does NOT replace solicitors</strong> - complex cases need professional
                    help
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>
                    <strong>Does NOT represent you</strong> - you represent yourself
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>
                    <strong>Does NOT verify facts</strong> - we analyze what you provide
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#c9a84c]" />
                AI Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p className="mb-4">
                UJRIS uses artificial intelligence to analyze documents. While we strive for
                accuracy, AI systems have limitations:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <span>AI may misinterpret context or nuance in documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <span>AI cannot understand verbal agreements or unwritten context</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <span>AI analysis may contain errors and should be verified</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <span>
                    AI does not have access to all relevant laws, cases, or precedents
                  </span>
                </li>
              </ul>
              <p className="mt-4 font-medium">
                Always review AI output carefully and use your own judgment.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#c9a84c]" />
                Your Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p className="mb-4">By using UJRIS, you acknowledge and accept that:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f172a] mt-2 flex-shrink-0" />
                  <span>You are responsible for all decisions made in your case</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f172a] mt-2 flex-shrink-0" />
                  <span>You should verify all AI-generated content before using it</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f172a] mt-2 flex-shrink-0" />
                  <span>You understand that case outcomes are not guaranteed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f172a] mt-2 flex-shrink-0" />
                  <span>You should seek legal advice if you are unsure about anything</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f172a] mt-2 flex-shrink-0" />
                  <span>You have read and understood our Terms of Service</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">When to Seek Professional Help</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p className="mb-4">
                We strongly recommend seeking professional legal advice if:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                  <span>Your case involves significant financial amounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                  <span>You face potential criminal consequences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                  <span>Complex legal issues are involved</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                  <span>The opposing party has legal representation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                  <span>You are unsure about any aspect of your case</span>
                </li>
              </ul>
              <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                <p className="text-sm">
                  <strong>Free legal advice resources:</strong>
                  <br />
                  Citizens Advice Bureau: citizensadvice.org.uk
                  <br />
                  Law Society Find a Solicitor: solicitors.lawsociety.org.uk
                  <br />
                  Legal Aid: gov.uk/legal-aid
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acknowledgment */}
        <div className="mt-12 p-6 bg-[#0f172a] rounded-lg text-center">
          <p className="text-white mb-4">
            By using UJRIS, you acknowledge that you have read, understood, and agree to this Legal
            Disclaimer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-[#c9a84c] hover:bg-[#b8973f] text-[#0f172a]">
              <a
                href="https://tally.so/r/eq2Pqe"
                target="_blank"
                rel="noopener noreferrer"
              >
                I Understand - Start My Case
              </a>
            </Button>
            <Button asChild variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-white py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} UJRIS. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
