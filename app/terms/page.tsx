import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ChevronLeft, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Terms of Service | UJRIS - Justice Intelligence",
  description: "UJRIS terms of service and conditions of use.",
};

const termsSection = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using UJRIS services, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services. These terms constitute a legally binding agreement between you and UJRIS Ltd.",
  },
  {
    title: "2. Service Description",
    content:
      "UJRIS provides AI-powered document analysis and case preparation tools for self-represented litigants. Our service analyzes uploaded documents, identifies patterns and contradictions, generates timelines, and produces case summaries. We do not provide legal advice, and our output should not be considered a substitute for professional legal counsel.",
  },
  {
    title: "3. User Responsibilities",
    content:
      "You are responsible for: (a) ensuring you have the right to upload documents you submit; (b) the accuracy of information you provide; (c) maintaining the confidentiality of your account credentials; (d) all activities that occur under your account; (e) complying with all applicable laws and regulations.",
  },
  {
    title: "4. Prohibited Uses",
    content:
      "You may not use UJRIS to: (a) upload documents you do not own or have permission to use; (b) submit fraudulent or misleading information; (c) attempt to reverse engineer or extract our AI models; (d) use the service for any illegal purpose; (e) harass, abuse, or harm others; (f) interfere with the proper functioning of the service.",
  },
  {
    title: "5. Payment and Refunds",
    content:
      "Payment is required before your case pack is delivered. All payments are processed securely through Stripe. Refunds are available within 14 days if our service fails to deliver as promised. Refund requests should be directed to support@ujris.co.uk.",
  },
  {
    title: "6. Intellectual Property",
    content:
      "UJRIS retains all intellectual property rights in our service, including our AI models, algorithms, and software. Documents you upload remain your property. By using our service, you grant us a limited license to process your documents solely for the purpose of providing our service.",
  },
  {
    title: "7. Limitation of Liability",
    content:
      "UJRIS is not a law firm and does not provide legal advice. Our service is a document analysis tool only. We are not liable for: (a) the outcome of any legal proceedings; (b) any decisions made based on our output; (c) indirect, incidental, or consequential damages; (d) loss of data beyond our control. Our total liability is limited to the amount you paid for the service.",
  },
  {
    title: "8. Data Protection",
    content:
      "We process personal data in accordance with UK GDPR and the Data Protection Act 2018. Please see our Privacy Policy for full details on how we collect, use, and protect your data. Your data is encrypted and automatically deleted after 30 days.",
  },
  {
    title: "9. Termination",
    content:
      "We may terminate or suspend your access to our service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the service ceases immediately.",
  },
  {
    title: "10. Changes to Terms",
    content:
      "We may modify these Terms at any time. We will notify users of any material changes via email or through our service. Your continued use of UJRIS after changes constitutes acceptance of the modified Terms.",
  },
  {
    title: "11. Governing Law",
    content:
      "These Terms are governed by the laws of England and Wales. Any disputes arising from these Terms or your use of our service shall be subject to the exclusive jurisdiction of the courts of England and Wales.",
  },
  {
    title: "12. Contact Information",
    content:
      "For questions about these Terms of Service, please contact us at: legal@ujris.co.uk or write to: UJRIS Ltd, [Address], United Kingdom.",
  },
];

export default function TermsPage() {
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
            <FileText className="w-8 h-8 text-[#c9a84c]" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-[#0f172a] mb-2">Terms of Service</h1>
          <p className="text-slate-600">Last updated: April 1, 2026</p>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Important Notice</p>
                <p className="text-sm text-amber-800">
                  UJRIS is not a law firm and does not provide legal advice. Our AI-powered tools
                  are designed to assist self-represented litigants but should not be considered a
                  substitute for professional legal counsel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-6">
          {termsSection.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Agreement Notice */}
        <div className="mt-12 p-6 bg-[#0f172a] rounded-lg text-center">
          <p className="text-white mb-4">
            By using UJRIS, you acknowledge that you have read, understood, and agree to be bound by
            these Terms of Service.
          </p>
          <Button asChild className="bg-[#c9a84c] hover:bg-[#b8973f] text-[#0f172a]">
            <a href="https://tally.so/r/YOUR_TALLY_FORM_ID" target="_blank" rel="noopener noreferrer">
              Start Your Case
            </a>
          </Button>
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
            <Link href="/disclaimer" className="text-slate-400 hover:text-white transition-colors">
              Legal Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
