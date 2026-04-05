// UJRIS Content Data - Videos, Guides, and Features
// This file contains all educational content for the learning hub

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  category: "pip" | "employment" | "parking" | "insurance" | "general";
  duration?: string;
  source: string;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "pdf" | "template" | "checklist";
  category: "pip" | "employment" | "parking" | "insurance" | "general";
  downloadable: boolean;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

export const videos: Video[] = [
  // PIP Appeals
  {
    id: "pip-1",
    title: "How to prepare for a PIP tribunal",
    description: "Step-by-step guide to preparing your evidence and presentation for a PIP tribunal hearing",
    url: "https://www.youtube.com/watch?v=PIP_TRIBUNAL_PREP",
    category: "pip",
    duration: "12:30",
    source: "GOV.UK"
  },
  {
    id: "pip-2",
    title: "Understanding PIP descriptors",
    description: "Detailed explanation of all PIP activity descriptors and how they are assessed",
    url: "https://www.youtube.com/watch?v=PIP_DESCRIPTORS",
    category: "pip",
    duration: "18:45",
    source: "GOV.UK"
  },
  {
    id: "pip-3",
    title: "Evidence for PIP claims",
    description: "What evidence you need and how to present it effectively",
    url: "https://www.youtube.com/watch?v=PIP_EVIDENCE",
    category: "pip",
    duration: "15:20",
    source: "GOV.UK"
  },
  {
    id: "pip-4",
    title: "PIP Mandatory Reconsideration",
    description: "How to request and prepare for a mandatory reconsideration",
    url: "https://www.youtube.com/watch?v=PIP_MR",
    category: "pip",
    duration: "10:15",
    source: "GOV.UK"
  },
  {
    id: "pip-5",
    title: "Daily Living Activities Explained",
    description: "Understanding the 10 daily living activities in PIP assessment",
    url: "https://www.youtube.com/watch?v=PIP_DAILY_LIVING",
    category: "pip",
    duration: "22:00",
    source: "GOV.UK"
  },
  {
    id: "pip-6",
    title: "Mobility Component Guide",
    description: "How the mobility component is assessed and scored",
    url: "https://www.youtube.com/watch?v=PIP_MOBILITY",
    category: "pip",
    duration: "14:30",
    source: "GOV.UK"
  },
  {
    id: "pip-7",
    title: "What happens at a PIP assessment",
    description: "Walk-through of the face-to-face assessment process",
    url: "https://www.youtube.com/watch?v=PIP_ASSESSMENT",
    category: "pip",
    duration: "16:45",
    source: "GOV.UK"
  },
  {
    id: "pip-8",
    title: "Challenging a PIP decision",
    description: "Your rights and options when you disagree with a PIP decision",
    url: "https://www.youtube.com/watch?v=PIP_CHALLENGE",
    category: "pip",
    duration: "11:20",
    source: "GOV.UK"
  },
  // Employment Tribunals
  {
    id: "emp-1",
    title: "ACAS Early Conciliation",
    description: "Understanding the mandatory early conciliation process before tribunal",
    url: "https://www.youtube.com/watch?v=ACAS_CONCILIATION",
    category: "employment",
    duration: "13:15",
    source: "GOV.UK"
  },
  {
    id: "emp-2",
    title: "Employment Tribunal Process",
    description: "Complete guide to the employment tribunal process from start to finish",
    url: "https://www.youtube.com/watch?v=ET_PROCESS",
    category: "employment",
    duration: "25:30",
    source: "GOV.UK"
  },
  {
    id: "emp-3",
    title: "Unfair Dismissal Claims",
    description: "How to build and present an unfair dismissal case",
    url: "https://www.youtube.com/watch?v=UNFAIR_DISMISSAL",
    category: "employment",
    duration: "19:45",
    source: "GOV.UK"
  },
  {
    id: "emp-4",
    title: "Discrimination Claims Explained",
    description: "Understanding protected characteristics and discrimination law",
    url: "https://www.youtube.com/watch?v=DISCRIMINATION",
    category: "employment",
    duration: "21:00",
    source: "GOV.UK"
  },
  {
    id: "emp-5",
    title: "Preparing Your ET1 Form",
    description: "Step-by-step guide to completing the ET1 claim form",
    url: "https://www.youtube.com/watch?v=ET1_FORM",
    category: "employment",
    duration: "17:30",
    source: "GOV.UK"
  },
  {
    id: "emp-6",
    title: "Witness Statements Guide",
    description: "How to write effective witness statements for tribunal",
    url: "https://www.youtube.com/watch?v=WITNESS_STATEMENTS",
    category: "employment",
    duration: "14:20",
    source: "GOV.UK"
  },
  {
    id: "emp-7",
    title: "Bundle Preparation",
    description: "How to organize and prepare your hearing bundle",
    url: "https://www.youtube.com/watch?v=BUNDLE_PREP",
    category: "employment",
    duration: "16:00",
    source: "GOV.UK"
  },
  {
    id: "emp-8",
    title: "Schedule of Loss Calculation",
    description: "How to calculate and present your financial losses",
    url: "https://www.youtube.com/watch?v=SCHEDULE_OF_LOSS",
    category: "employment",
    duration: "12:45",
    source: "GOV.UK"
  },
  {
    id: "emp-9",
    title: "Cross-examination Techniques",
    description: "How to cross-examine witnesses effectively as a litigant in person",
    url: "https://www.youtube.com/watch?v=CROSS_EXAMINATION",
    category: "employment",
    duration: "20:15",
    source: "GOV.UK"
  },
  {
    id: "emp-10",
    title: "Settlement Negotiations",
    description: "Understanding settlement offers and without prejudice discussions",
    url: "https://www.youtube.com/watch?v=SETTLEMENT",
    category: "employment",
    duration: "11:30",
    source: "GOV.UK"
  },
  // Parking Tickets
  {
    id: "park-1",
    title: "Challenge a Parking Ticket",
    description: "Step-by-step guide to challenging council parking tickets",
    url: "https://www.youtube.com/watch?v=PARKING_CHALLENGE",
    category: "parking",
    duration: "9:45",
    source: "GOV.UK"
  },
  {
    id: "park-2",
    title: "POPLA Appeals Process",
    description: "How to appeal private parking tickets through POPLA",
    url: "https://www.youtube.com/watch?v=POPLA_APPEALS",
    category: "parking",
    duration: "11:20",
    source: "GOV.UK"
  },
  {
    id: "park-3",
    title: "Traffic Penalty Tribunal",
    description: "Taking your parking appeal to the Traffic Penalty Tribunal",
    url: "https://www.youtube.com/watch?v=TPT_APPEALS",
    category: "parking",
    duration: "13:00",
    source: "GOV.UK"
  },
  {
    id: "park-4",
    title: "Common Parking Ticket Defences",
    description: "Proven defences that work for parking ticket appeals",
    url: "https://www.youtube.com/watch?v=PARKING_DEFENCES",
    category: "parking",
    duration: "15:30",
    source: "GOV.UK"
  },
  {
    id: "park-5",
    title: "Signage Requirements",
    description: "Legal requirements for parking signage and how to challenge",
    url: "https://www.youtube.com/watch?v=SIGNAGE_REQUIREMENTS",
    category: "parking",
    duration: "10:15",
    source: "GOV.UK"
  },
  {
    id: "park-6",
    title: "Keeper Liability Explained",
    description: "Understanding keeper liability and how to challenge it",
    url: "https://www.youtube.com/watch?v=KEEPER_LIABILITY",
    category: "parking",
    duration: "8:45",
    source: "GOV.UK"
  },
  // Insurance Claims
  {
    id: "ins-1",
    title: "Financial Ombudsman Service",
    description: "How to escalate insurance disputes to the FOS",
    url: "https://www.youtube.com/watch?v=FOS_COMPLAINTS",
    category: "insurance",
    duration: "14:00",
    source: "GOV.UK"
  },
  {
    id: "ins-2",
    title: "Making an Insurance Complaint",
    description: "Step-by-step guide to formal insurance complaints",
    url: "https://www.youtube.com/watch?v=INSURANCE_COMPLAINT",
    category: "insurance",
    duration: "12:30",
    source: "GOV.UK"
  },
  {
    id: "ins-3",
    title: "Understanding Policy Terms",
    description: "How to interpret insurance policy language",
    url: "https://www.youtube.com/watch?v=POLICY_TERMS",
    category: "insurance",
    duration: "16:45",
    source: "GOV.UK"
  },
  {
    id: "ins-4",
    title: "Claim Denial Appeals",
    description: "How to appeal when your insurance claim is denied",
    url: "https://www.youtube.com/watch?v=CLAIM_DENIAL",
    category: "insurance",
    duration: "18:20",
    source: "GOV.UK"
  },
  // General Legal
  {
    id: "gen-1",
    title: "Access to Justice Overview",
    description: "Understanding your rights as a self-represented litigant",
    url: "https://www.youtube.com/watch?v=ACCESS_TO_JUSTICE",
    category: "general",
    duration: "20:00",
    source: "GOV.UK"
  },
  {
    id: "gen-2",
    title: "Court Fees and Exemptions",
    description: "Understanding court fees and how to apply for Help with Fees",
    url: "https://www.youtube.com/watch?v=COURT_FEES",
    category: "general",
    duration: "11:15",
    source: "GOV.UK"
  },
  {
    id: "gen-3",
    title: "Legal Aid Eligibility",
    description: "Check if you qualify for legal aid",
    url: "https://www.youtube.com/watch?v=LEGAL_AID",
    category: "general",
    duration: "13:30",
    source: "GOV.UK"
  },
  {
    id: "gen-4",
    title: "Subject Access Requests",
    description: "How to request your data under GDPR",
    url: "https://www.youtube.com/watch?v=SAR_REQUESTS",
    category: "general",
    duration: "9:00",
    source: "GOV.UK"
  },
  {
    id: "gen-5",
    title: "Freedom of Information Requests",
    description: "Using FOI requests to support your case",
    url: "https://www.youtube.com/watch?v=FOI_REQUESTS",
    category: "general",
    duration: "10:45",
    source: "GOV.UK"
  },
];

export const guides: Guide[] = [
  // PIP Guides
  {
    id: "guide-pip-1",
    title: "PIP Appeal Complete Guide",
    description: "Comprehensive guide covering every stage of the PIP appeal process",
    url: "/guides/pip-appeal-guide.pdf",
    type: "pdf",
    category: "pip",
    downloadable: true
  },
  {
    id: "guide-pip-2",
    title: "PIP Descriptors Checklist",
    description: "Printable checklist of all PIP descriptors with scoring guide",
    url: "/guides/pip-descriptors-checklist.pdf",
    type: "checklist",
    category: "pip",
    downloadable: true
  },
  {
    id: "guide-pip-3",
    title: "Evidence Gathering Template",
    description: "Template for organizing medical and other evidence for PIP",
    url: "/templates/pip-evidence-template.xlsx",
    type: "template",
    category: "pip",
    downloadable: true
  },
  // Employment Guides
  {
    id: "guide-emp-1",
    title: "Employment Tribunal Guide",
    description: "Complete guide to employment tribunal from ET1 to hearing",
    url: "/guides/employment-tribunal-guide.pdf",
    type: "pdf",
    category: "employment",
    downloadable: true
  },
  {
    id: "guide-emp-2",
    title: "Witness Statement Template",
    description: "Professional template for witness statements",
    url: "/templates/witness-statement-template.docx",
    type: "template",
    category: "employment",
    downloadable: true
  },
  {
    id: "guide-emp-3",
    title: "Schedule of Loss Calculator",
    description: "Excel template for calculating employment losses",
    url: "/templates/schedule-of-loss.xlsx",
    type: "template",
    category: "employment",
    downloadable: true
  },
  {
    id: "guide-emp-4",
    title: "Evidence Timeline Template",
    description: "Template for creating chronological evidence timelines",
    url: "/templates/evidence-timeline.xlsx",
    type: "template",
    category: "employment",
    downloadable: true
  },
  {
    id: "guide-emp-5",
    title: "Bundle Index Template",
    description: "Template for organizing hearing bundle contents",
    url: "/templates/bundle-index.docx",
    type: "template",
    category: "employment",
    downloadable: true
  },
  // Parking Guides
  {
    id: "guide-park-1",
    title: "Parking Ticket Appeal Guide",
    description: "Step-by-step guide to appealing parking tickets",
    url: "/guides/parking-ticket-appeal.pdf",
    type: "pdf",
    category: "parking",
    downloadable: true
  },
  {
    id: "guide-park-2",
    title: "POPLA Appeal Template",
    description: "Template letter for POPLA appeals",
    url: "/templates/popla-appeal-template.docx",
    type: "template",
    category: "parking",
    downloadable: true
  },
  // Insurance Guides
  {
    id: "guide-ins-1",
    title: "Insurance Complaint Guide",
    description: "How to make effective insurance complaints",
    url: "/guides/insurance-complaint-guide.pdf",
    type: "pdf",
    category: "insurance",
    downloadable: true
  },
  {
    id: "guide-ins-2",
    title: "FOS Complaint Template",
    description: "Template for Financial Ombudsman complaints",
    url: "/templates/fos-complaint-template.docx",
    type: "template",
    category: "insurance",
    downloadable: true
  },
  // General Guides
  {
    id: "guide-gen-1",
    title: "Self-Represented Litigant Handbook",
    description: "Essential guide for anyone representing themselves",
    url: "/guides/litigant-handbook.pdf",
    type: "pdf",
    category: "general",
    downloadable: true
  },
  {
    id: "guide-gen-2",
    title: "Subject Access Request Template",
    description: "GDPR SAR request letter template",
    url: "/templates/sar-template.docx",
    type: "template",
    category: "general",
    downloadable: true
  },
  {
    id: "guide-gen-3",
    title: "FOI Request Template",
    description: "Freedom of Information request letter template",
    url: "/templates/foi-template.docx",
    type: "template",
    category: "general",
    downloadable: true
  },
];

export const features: Feature[] = [
  {
    id: "feat-1",
    title: "Unlimited Document Uploads",
    description: "Upload any number of documents with no size limits. We process everything.",
    icon: "Upload",
    category: "core"
  },
  {
    id: "feat-2",
    title: "Forensic AI Analysis",
    description: "Our AI examines every document for contradictions, timeline inconsistencies, and hidden patterns.",
    icon: "Search",
    category: "ai"
  },
  {
    id: "feat-3",
    title: "Anchor Lie Detection",
    description: "Proprietary technology that identifies false statements and evidential anchors in opponent documents.",
    icon: "Target",
    category: "ai"
  },
  {
    id: "feat-4",
    title: "Automatic Timeline Generation",
    description: "AI creates a chronological timeline of all events from your documents.",
    icon: "Clock",
    category: "ai"
  },
  {
    id: "feat-5",
    title: "Legal Summary Report",
    description: "Plain English breakdown of your case strengths, weaknesses, and strategy recommendations.",
    icon: "FileText",
    category: "output"
  },
  {
    id: "feat-6",
    title: "Ready-to-Send Appeal Letter",
    description: "Professionally drafted appeal letter customized to your specific case.",
    icon: "Mail",
    category: "output"
  },
  {
    id: "feat-7",
    title: "Password-Protected Delivery",
    description: "Your complete case pack delivered securely with encryption.",
    icon: "Lock",
    category: "security"
  },
  {
    id: "feat-8",
    title: "30-Day Auto-Delete",
    description: "All data automatically deleted after 30 days for your privacy.",
    icon: "Trash2",
    category: "security"
  },
  {
    id: "feat-9",
    title: "UK GDPR Compliant",
    description: "Full compliance with UK data protection law. Your data is never shared.",
    icon: "Shield",
    category: "security"
  },
  {
    id: "feat-10",
    title: "Evidence Matrix",
    description: "Visual mapping of evidence to claims for clear case presentation.",
    icon: "Grid",
    category: "output"
  },
  {
    id: "feat-11",
    title: "Contradiction Highlighter",
    description: "Automatically highlights contradictions between documents.",
    icon: "AlertTriangle",
    category: "ai"
  },
  {
    id: "feat-12",
    title: "Citation Generator",
    description: "Properly formatted legal citations for your documents.",
    icon: "Quote",
    category: "output"
  },
];

export const categories = [
  { id: "all", label: "All Resources" },
  { id: "pip", label: "PIP Appeals" },
  { id: "employment", label: "Employment" },
  { id: "parking", label: "Parking Tickets" },
  { id: "insurance", label: "Insurance" },
  { id: "general", label: "General Legal" },
] as const;

export type Category = typeof categories[number]["id"];
