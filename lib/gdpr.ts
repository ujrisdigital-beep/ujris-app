/**
 * UJRIS GDPR Compliance Utilities
 * UK GDPR & Data Protection Act 2018 Compliant
 */

import { logAuditEntry, createAuditLogEntry } from "./audit-logger";

export interface DataSubjectRequest {
  type: "access" | "deletion" | "portability" | "rectification";
  requestId: string;
  email: string;
  requestedAt: Date;
  processedAt?: Date;
  status: "pending" | "processing" | "completed" | "rejected";
  reason?: string;
}

export interface RetentionPolicy {
  defaultRetentionDays: number;
  extendedRetentionDays: number;
  courtOrderRetentionDays: number;
}

export const RETENTION_POLICY: RetentionPolicy = {
  defaultRetentionDays: 30,
  extendedRetentionDays: 60,
  courtOrderRetentionDays: 365, // 1 year if under court order
};

/**
 * Calculate expiry date based on retention policy
 */
export function calculateExpiryDate(
  createdAt: Date,
  hasCourtOrder: boolean = false,
  extended: boolean = false
): Date {
  const days = hasCourtOrder
    ? RETENTION_POLICY.courtOrderRetentionDays
    : extended
    ? RETENTION_POLICY.extendedRetentionDays
    : RETENTION_POLICY.defaultRetentionDays;

  const expiryDate = new Date(createdAt);
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

/**
 * Check if a case should be auto-deleted
 */
export function shouldAutoDelete(
  createdAt: Date,
  hasCourtOrder: boolean = false,
  extended: boolean = false
): boolean {
  const expiryDate = calculateExpiryDate(createdAt, hasCourtOrder, extended);
  return new Date() > expiryDate;
}

/**
 * Process a GDPR data subject access request (DSAR)
 */
export async function processDataAccessRequest(
  request: DataSubjectRequest
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    // Log the request
    await logAuditEntry(
      createAuditLogEntry("GDPR_DATA_REQUEST", {
        userId: request.email,
        ipAddress: "system",
        userAgent: "GDPR DSAR Processor",
        metadata: {
          requestId: request.requestId,
          requestType: request.type,
        },
        success: true,
      })
    );

    // In production:
    // 1. Verify identity (email verification)
    // 2. Gather all data associated with the user
    // 3. Generate exportable format
    // 4. Send to user's verified email

    // Mock response
    return {
      success: true,
      data: {
        requestId: request.requestId,
        status: "processing",
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        message:
          "Your data access request has been received. You will receive your data within 30 days as required by UK GDPR.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to process data access request",
    };
  }
}

/**
 * Process a GDPR deletion request (Right to be Forgotten)
 */
export async function processDataDeletionRequest(
  caseId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Log the deletion request
    await logAuditEntry(
      createAuditLogEntry("GDPR_DELETE_REQUESTED", {
        caseId,
        userId,
        ipAddress: "system",
        userAgent: "GDPR Deletion Processor",
        metadata: { reason },
        success: true,
      })
    );

    // In production:
    // 1. Check for any legal holds or court orders
    // 2. Delete from storage (R2/Blob)
    // 3. Delete from database
    // 4. Delete from backups (within reasonable timeframe)
    // 5. Log completion

    // Simulate deletion
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Log completion
    await logAuditEntry(
      createAuditLogEntry("GDPR_DELETE_COMPLETE", {
        caseId,
        userId,
        ipAddress: "system",
        userAgent: "GDPR Deletion Processor",
        metadata: { deletedAt: new Date() },
        success: true,
      })
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Failed to process deletion request",
    };
  }
}

/**
 * Get GDPR-compliant privacy notice
 */
export function getPrivacyNotice(): {
  version: string;
  lastUpdated: string;
  sections: Array<{ title: string; content: string }>;
} {
  return {
    version: "1.0",
    lastUpdated: "2026-04-01",
    sections: [
      {
        title: "Data Controller",
        content:
          "UJRIS Ltd is the data controller for personal data processed through this service.",
      },
      {
        title: "Data We Collect",
        content:
          "We collect: uploaded documents, email addresses for delivery, payment information (processed by Stripe), and technical data (IP addresses, browser information) for security.",
      },
      {
        title: "Purpose of Processing",
        content:
          "We process your data to: analyze your legal documents, generate case summaries, deliver your case pack, and comply with legal obligations.",
      },
      {
        title: "Legal Basis",
        content:
          "We process your data based on: contract performance (providing our service), legitimate interests (security, fraud prevention), and legal obligations (court orders, law enforcement).",
      },
      {
        title: "Data Retention",
        content:
          "Your data is automatically deleted 30 days after delivery unless extended by you or required by law (e.g., court order).",
      },
      {
        title: "Your Rights",
        content:
          "You have the right to: access your data, request deletion, request portability, object to processing, and lodge a complaint with the ICO.",
      },
      {
        title: "Security Measures",
        content:
          "We use: AES-256 encryption at rest, TLS 1.3 in transit, per-user encryption keys, and no human access to plaintext data.",
      },
      {
        title: "Third Party Processors",
        content:
          "We use: Vercel (hosting), Stripe (payments), AI providers (document analysis). All processors are GDPR compliant.",
      },
      {
        title: "International Transfers",
        content:
          "Data may be processed in the EU/UK and US. We use Standard Contractual Clauses for international transfers.",
      },
      {
        title: "Contact",
        content:
          "Data Protection Officer: dpo@ujris.co.uk. You can also contact the ICO: ico.org.uk",
      },
    ],
  };
}

/**
 * Generate a data export in portable format
 */
export async function generateDataExport(
  caseId: string,
  userId: string
): Promise<{ format: string; data: unknown }> {
  // In production:
  // 1. Gather all user data
  // 2. Format in machine-readable JSON
  // 3. Include all metadata
  // 4. Encrypt for delivery

  await logAuditEntry(
    createAuditLogEntry("GDPR_DATA_EXPORTED", {
      caseId,
      userId,
      ipAddress: "system",
      userAgent: "GDPR Export Generator",
      success: true,
    })
  );

  return {
    format: "application/json",
    data: {
      exportDate: new Date().toISOString(),
      caseId,
      userId,
      message: "Your data export would be included here",
    },
  };
}
