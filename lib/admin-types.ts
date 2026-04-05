// Admin Dashboard Types

export type CaseStatus =
  | "UPLOADING"
  | "PROCESSING"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "GENERATING"
  | "DELIVERED"
  | "REFUNDED"
  | "DELETED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "REFUNDED" | "FAILED";

export type ManualAction =
  | "resend-pdf"
  | "regenerate"
  | "refund"
  | "delete"
  | "extend-retention";

export interface Case {
  id: string;
  status: CaseStatus;
  paymentStatus: PaymentStatus;
  documentCount: number;
  fileSizeTotal: number;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  expiresAt?: string;
  // Metadata only - no PII
  caseType: "pip" | "employment" | "parking" | "insurance" | "general";
  hashSha256: string;
}

export interface DashboardStats {
  activeCases: number;
  pendingPayment: number;
  documentCount: number;
  revenue: number;
  todaySignups: number;
  deliveredToday: number;
  averageProcessingTime: number;
  successRate: number;
}

export interface AuditLogEntry {
  id: string;
  caseId: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  reason?: string;
  courtOrderId?: string;
}

export interface CourtOrder {
  orderId: string;
  courtName: string;
  caseNumber: string;
  judgeName: string;
  issueDate: string;
  expiryDate: string;
  requestedData: string[];
  status: "pending" | "verified" | "rejected" | "expired";
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  database: boolean;
  storage: boolean;
  email: boolean;
  ai: boolean;
  lastChecked: string;
}
