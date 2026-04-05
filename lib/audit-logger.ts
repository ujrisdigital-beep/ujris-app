import { createHash } from "crypto";

export type AuditAction =
  | "CASE_CREATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_PROCESSED"
  | "PAYMENT_INITIATED"
  | "PAYMENT_COMPLETED"
  | "PAYMENT_FAILED"
  | "PDF_GENERATED"
  | "PDF_DELIVERED"
  | "PDF_DOWNLOADED"
  | "CASE_VIEWED"
  | "GDPR_DATA_REQUEST"
  | "GDPR_DATA_EXPORTED"
  | "GDPR_DELETE_REQUESTED"
  | "GDPR_AUTO_DELETE"
  | "GDPR_DELETE_COMPLETE"
  | "ADMIN_ACTION"
  | "COURT_ORDER_SUBMITTED"
  | "COURT_ORDER_VERIFIED"
  | "COURT_ORDER_REJECTED"
  | "DATA_RELEASED"
  | "LOGIN_ATTEMPT"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "ACCESS_DENIED";

export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  caseId?: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  success: boolean;
  reason?: string;
  courtOrderId?: string;
  hashSha256?: string;
}

/**
 * Create an audit log entry with integrity hash
 */
export function createAuditLogEntry(
  action: AuditAction,
  details: Omit<AuditLogEntry, "action" | "timestamp" | "hashSha256">
): AuditLogEntry {
  const entry: AuditLogEntry = {
    action,
    timestamp: new Date(),
    ...details,
  };

  // Generate integrity hash
  entry.hashSha256 = createHash("sha256")
    .update(JSON.stringify(entry))
    .digest("hex");

  return entry;
}

/**
 * Log an audit entry to console (in production, this would write to database)
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  // In production with Prisma:
  // await prisma.auditLog.create({
  //   data: {
  //     action: entry.action,
  //     caseId: entry.caseId,
  //     userId: entry.userId,
  //     ipAddress: entry.ipAddress,
  //     userAgent: entry.userAgent,
  //     timestamp: entry.timestamp,
  //     metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
  //     success: entry.success,
  //     reason: entry.reason,
  //     courtOrderId: entry.courtOrderId,
  //     hashSha256: entry.hashSha256,
  //   }
  // });

  // Log to console for now
  console.log("[AUDIT]", JSON.stringify(entry, null, 2));
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(headers: Headers): string {
  // Check various headers for real IP (behind proxies/load balancers)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

/**
 * Sanitize user agent for logging
 */
export function sanitizeUserAgent(userAgent: string | null): string {
  if (!userAgent) return "unknown";
  // Truncate to reasonable length
  return userAgent.substring(0, 256);
}

/**
 * Create middleware-style audit logger
 */
export function auditMiddleware(action: AuditAction) {
  return async (
    request: Request,
    caseId?: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ) => {
    const entry = createAuditLogEntry(action, {
      caseId,
      userId,
      ipAddress: getClientIP(new Headers(request.headers)),
      userAgent: sanitizeUserAgent(request.headers.get("user-agent")),
      metadata,
      success: true,
    });

    await logAuditEntry(entry);
    return entry;
  };
}

/**
 * Log a failed action
 */
export async function logFailedAction(
  action: AuditAction,
  request: Request,
  reason: string,
  caseId?: string,
  userId?: string
): Promise<AuditLogEntry> {
  const entry = createAuditLogEntry(action, {
    caseId,
    userId,
    ipAddress: getClientIP(new Headers(request.headers)),
    userAgent: sanitizeUserAgent(request.headers.get("user-agent")),
    success: false,
    reason,
  });

  await logAuditEntry(entry);
  return entry;
}
