// UJRIS Content Data - Videos, Guides, and Features
// This file contains all educational content for the learning hub

export interface Video {
  id: string
  title: string
  url: string
  embedUrl: string
  source: string
  duration?: string
  category: "pip" | "employment" | "parking" | "insurance" | "general"
  description: string
}

export interface Guide {
  id: string
  title: string
  description: string
  url: string
  type: "pdf" | "template" | "checklist"
  category: "pip" | "employment" | "parking" | "insurance" | "general"
  downloadable: boolean
}

export interface Feature {
  id: string
  title: string
  description: string
  icon: string
  category: string
}

export const videos: Video[] = [
  {
    id: "video-pip-1",
    title: "Challenging a PIP Decision",
    url: "https://www.youtube.com/watch?v=BVqMktWiQaQ",
    embedUrl: "https://www.youtube.com/embed/BVqMktWiQaQ",
    source: "YouTube",
    category: "pip",
    description: "Official guidance on Mandatory Reconsideration and the full appeal process to tribunal",
  },
  {
    id: "video-pip-2",
    title: "Easy Guide: Logging A DWP Tribunal",
    url: "https://www.youtube.com/watch?v=OdgCtn3QYLM",
    embedUrl: "https://www.youtube.com/embed/OdgCtn3QYLM",
    source: "YouTube",
    category: "pip",
    description: "Step-by-step walkthrough on how to log your appeal with DWP tribunal service",
  },
  {
    id: "video-pip-3",
    title: "How to appeal a Work Capability Assessment",
    url: "https://www.youtube.com/watch?v=G2tOqIW9p7s",
    embedUrl: "https://www.youtube.com/embed/G2tOqIW9p7s",
    source: "YouTube",
    category: "pip",
    description: "Advicenow official guide - Mandatory Reconsideration, appeal form, evidence and descriptors",
  },
  {
    id: "video-pip-4",
    title: "How to Appeal a PIP Decision: Step Three - Preparing For The Hearing",
    url: "https://www.youtube.com/watch?v=tIHjSpNNbQo",
    embedUrl: "https://www.youtube.com/embed/tIHjSpNNbQo",
    source: "YouTube",
    category: "pip",
    description: "Scope official video - what to expect and how to prepare for your PIP tribunal hearing",
  },
  {
    id: "video-employment-1",
    title: "Unpacking Employment Tribunal [Part 1]: Your Guide",
    url: "https://www.youtube.com/watch?v=UpXPqAYPOOI",
    embedUrl: "https://www.youtube.com/embed/UpXPqAYPOOI",
    source: "YouTube",
    category: "employment",
    description: "Full guide to employment tribunal process, time limits and preparing your claim",
  },
  {
    id: "video-employment-2",
    title: "Employment Tribunal help",
    url: "https://www.youtube.com/watch?v=5FwMw3N21M8",
    embedUrl: "https://www.youtube.com/embed/5FwMw3N21M8",
    source: "YouTube",
    category: "employment",
    description: "Practical help for claimants going to employment tribunal",
  },
  {
    id: "video-general-1",
    title: "What is small claims mediation?",
    url: "https://www.youtube.com/watch?v=Fm4hjpA72vA",
    embedUrl: "https://www.youtube.com/embed/Fm4hjpA72vA",
    source: "YouTube",
    category: "general",
    description: "HMCTS official video explaining the free small claims mediation service",
  },
  {
    id: "video-general-2",
    title: "Small Claims Mediation Service",
    url: "https://www.youtube.com/watch?v=tKesfMqSOfQ",
    embedUrl: "https://www.youtube.com/embed/tKesfMqSOfQ",
    source: "YouTube",
    category: "general",
    description: "HMCTS presentation on how the mediation service works and how to use it",
  },
  {
    id: "video-general-3",
    title: "How do the courts treat litigants-in-person?",
    url: "https://www.youtube.com/watch?v=KaVffu5BiYc",
    embedUrl: "https://www.youtube.com/embed/KaVffu5BiYc",
    source: "YouTube",
    category: "general",
    description: "Clear guidance on how UK courts handle self-represented litigants",
  },
  {
    id: "video-general-4",
    title: "Should I represent myself in Court? UK General Litigation",
    url: "https://www.youtube.com/watch?v=AwE5ZDF6Wa8",
    embedUrl: "https://www.youtube.com/embed/AwE5ZDF6Wa8",
    source: "YouTube",
    category: "general",
    description: "Key advice for anyone considering going to court without a solicitor",
  },
]

export const guides: Guide[] = [
  {
    id: "guide-pip-1",
    title: "PIP Appeal Complete Guide",
    description: "Comprehensive guide covering every stage of the PIP appeal process",
    url: "/guides/pip-appeal-guide.pdf",
    type: "pdf",
    category: "pip",
    downloadable: true,
  },
  {
    id: "guide-pip-2",
    title: "PIP Descriptors Checklist",
    description: "Printable checklist of all PIP descriptors with scoring guide",
    url: "/guides/pip-descriptors-checklist.pdf",
    type: "checklist",
    category: "pip",
    downloadable: true,
  },
  {
    id: "guide-pip-3",
    title: "Evidence Gathering Template",
    description: "Template for organizing medical and other evidence for PIP",
    url: "/templates/pip-evidence-template.xlsx",
    type: "template",
    category: "pip",
    downloadable: true,
  },
  {
    id: "guide-emp-1",
    title: "Employment Tribunal Guide",
    description: "Complete guide to employment tribunal from ET1 to hearing",
    url: "/guides/employment-tribunal-guide.pdf",
    type: "pdf",
    category: "employment",
    downloadable: true,
  },
  {
    id: "guide-emp-2",
    title: "Witness Statement Template",
    description: "Professional template for witness statements",
    url: "/templates/witness-statement-template.docx",
    type: "template",
    category: "employment",
    downloadable: true,
  },
  {
    id: "guide-emp-3",
    title: "Schedule of Loss Calculator",
    description: "Excel template for calculating employment losses",
    url: "/templates/schedule-of-loss.xlsx",
    type: "template",
    category: "employment",
    downloadable: true,
  },
  {
    id: "guide-emp-4",
    title: "Evidence Timeline Template",
    description: "Template for creating chronological evidence timelines",
    url: "/templates/evidence-timeline.xlsx",
    type: "template",
    category: "employment",
    downloadable: true,
  },
  {
    id: "guide-emp-5",
    title: "Bundle Index Template",
    description: "Template for organizing hearing bundle contents",
    url: "/templates/bundle-index.docx",
    type: "template",
    category: "employment",
    downloadable: true,
  },
  {
    id: "guide-park-1",
    title: "Parking Ticket Appeal Guide",
    description: "Step-by-step guide to appealing parking tickets",
    url: "/guides/parking-ticket-appeal.pdf",
    type: "pdf",
    category: "parking",
    downloadable: true,
  },
  {
    id: "guide-park-2",
    title: "POPLA Appeal Template",
    description: "Template letter for POPLA appeals",
    url: "/templates/popla-appeal-template.docx",
    type: "template",
    category: "parking",
    downloadable: true,
  },
  {
    id: "guide-ins-1",
    title: "Insurance Complaint Guide",
    description: "How to make effective insurance complaints",
    url: "/guides/insurance-complaint-guide.pdf",
    type: "pdf",
    category: "insurance",
    downloadable: true,
  },
  {
    id: "guide-ins-2",
    title: "FOS Complaint Template",
    description: "Template for Financial Ombudsman complaints",
    url: "/templates/fos-complaint-template.docx",
    type: "template",
    category: "insurance",
    downloadable: true,
  },
  {
    id: "guide-gen-1",
    title: "Self-Represented Litigant Handbook",
    description: "Essential guide for anyone representing themselves",
    url: "/guides/litigant-handbook.pdf",
    type: "pdf",
    category: "general",
    downloadable: true,
  },
  {
    id: "guide-gen-2",
    title: "Subject Access Request Template",
    description: "GDPR SAR request letter template",
    url: "/templates/sar-template.docx",
    type: "template",
    category: "general",
    downloadable: true,
  },
  {
    id: "guide-gen-3",
    title: "FOI Request Template",
    description: "Freedom of Information request letter template",
    url: "/templates/foi-template.docx",
    type: "template",
    category: "general",
    downloadable: true,
  },
]

export const features: Feature[] = [
  {
    id: "feat-1",
    title: "Unlimited Document Uploads",
    description: "Upload any number of documents with no size limits. We process everything.",
    icon: "Upload",
    category: "core",
  },
  {
    id: "feat-2",
    title: "Forensic AI Analysis",
    description: "Our AI examines every document for contradictions, timeline inconsistencies, and hidden patterns.",
    icon: "Search",
    category: "ai",
  },
  {
    id: "feat-3",
    title: "Anchor Lie Detection",
    description: "Proprietary technology that identifies false statements and evidential anchors in opponent documents.",
    icon: "Target",
    category: "ai",
  },
  {
    id: "feat-4",
    title: "Automatic Timeline Generation",
    description: "AI creates a chronological timeline of all events from your documents.",
    icon: "Clock",
    category: "ai",
  },
  {
    id: "feat-5",
    title: "Legal Summary Report",
    description: "Plain English breakdown of your case strengths, weaknesses, and strategy recommendations.",
    icon: "FileText",
    category: "output",
  },
  {
    id: "feat-6",
    title: "Ready-to-Send Appeal Letter",
    description: "Professionally drafted appeal letter customized to your specific case.",
    icon: "Mail",
    category: "output",
  },
  {
    id: "feat-7",
    title: "Password-Protected Delivery",
    description: "Your complete case pack delivered securely with encryption.",
    icon: "Lock",
    category: "security",
  },
  {
    id: "feat-8",
    title: "30-Day Auto-Delete",
    description: "All data automatically deleted after 30 days for your privacy.",
    icon: "Trash2",
    category: "security",
  },
  {
    id: "feat-9",
    title: "UK GDPR Compliant",
    description: "Full compliance with UK data protection law. Your data is never shared.",
    icon: "Shield",
    category: "security",
  },
  {
    id: "feat-10",
    title: "Evidence Matrix",
    description: "Visual mapping of evidence to claims for clear case presentation.",
    icon: "Grid",
    category: "output",
  },
  {
    id: "feat-11",
    title: "Contradiction Highlighter",
    description: "Automatically highlights contradictions between documents.",
    icon: "AlertTriangle",
    category: "ai",
  },
  {
    id: "feat-12",
    title: "Citation Generator",
    description: "Properly formatted legal citations for your documents.",
    icon: "Quote",
    category: "output",
  },
]

export const categories = [
  { id: "all", label: "All Resources" },
  { id: "pip", label: "PIP Appeals" },
  { id: "employment", label: "Employment" },
  { id: "parking", label: "Parking Tickets" },
  { id: "insurance", label: "Insurance" },
  { id: "general", label: "General Legal" },
] as const

export type Category = typeof categories[number]["id"]
