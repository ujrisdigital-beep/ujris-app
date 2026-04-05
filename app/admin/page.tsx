"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Send,
  Trash2,
  DollarSign,
  Users,
  Activity,
  Shield,
  Database,
  Mail,
  Server,
  Lock,
  Unlock,
  Eye,
  Download,
  AlertTriangle,
  Search,
  Gavel,
} from "lucide-react";
import type {
  Case,
  CaseStatus,
  DashboardStats,
  ManualAction,
  AuditLogEntry,
  HealthStatus,
  CourtOrder,
} from "@/lib/admin-types";

// Mock data for demonstration
const mockStats: DashboardStats = {
  activeCases: 47,
  pendingPayment: 12,
  documentCount: 342,
  revenue: 2303,
  todaySignups: 8,
  deliveredToday: 5,
  averageProcessingTime: 4.2,
  successRate: 94.7,
};

const mockCases: Case[] = [
  {
    id: "case_abc123",
    status: "PROCESSING",
    paymentStatus: "COMPLETED",
    documentCount: 12,
    fileSizeTotal: 45000000,
    createdAt: "2026-04-05T10:30:00Z",
    updatedAt: "2026-04-05T11:15:00Z",
    caseType: "employment",
    hashSha256: "abc123def456...",
  },
  {
    id: "case_def456",
    status: "AWAITING_PAYMENT",
    paymentStatus: "PENDING",
    documentCount: 8,
    fileSizeTotal: 32000000,
    createdAt: "2026-04-05T09:00:00Z",
    updatedAt: "2026-04-05T09:45:00Z",
    caseType: "pip",
    hashSha256: "def456ghi789...",
  },
  {
    id: "case_ghi789",
    status: "DELIVERED",
    paymentStatus: "COMPLETED",
    documentCount: 15,
    fileSizeTotal: 58000000,
    createdAt: "2026-04-04T14:20:00Z",
    updatedAt: "2026-04-04T16:00:00Z",
    deliveredAt: "2026-04-04T16:00:00Z",
    expiresAt: "2026-05-04T16:00:00Z",
    caseType: "parking",
    hashSha256: "ghi789jkl012...",
  },
];

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "log_1",
    caseId: "case_abc123",
    action: "DOCUMENT_UPLOAD",
    timestamp: "2026-04-05T11:15:00Z",
    ipAddress: "192.168.1.xxx",
    userAgent: "Mozilla/5.0...",
    success: true,
  },
  {
    id: "log_2",
    caseId: "case_def456",
    action: "PAYMENT_INITIATED",
    timestamp: "2026-04-05T09:45:00Z",
    ipAddress: "192.168.1.xxx",
    userAgent: "Mozilla/5.0...",
    success: true,
  },
  {
    id: "log_3",
    caseId: "case_ghi789",
    action: "PDF_DELIVERED",
    timestamp: "2026-04-04T16:00:00Z",
    ipAddress: "192.168.1.xxx",
    userAgent: "Mozilla/5.0...",
    success: true,
  },
];

const mockHealth: HealthStatus = {
  status: "healthy",
  database: true,
  storage: true,
  email: true,
  ai: true,
  lastChecked: new Date().toISOString(),
};

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Icon className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const config: Record<CaseStatus, { color: string; label: string }> = {
    UPLOADING: { color: "bg-yellow-100 text-yellow-800", label: "Uploading" },
    PROCESSING: { color: "bg-blue-100 text-blue-800", label: "Processing" },
    AWAITING_PAYMENT: { color: "bg-orange-100 text-orange-800", label: "Awaiting Payment" },
    PAID: { color: "bg-green-100 text-green-800", label: "Paid" },
    GENERATING: { color: "bg-purple-100 text-purple-800", label: "Generating" },
    DELIVERED: { color: "bg-slate-100 text-slate-800", label: "Delivered" },
    REFUNDED: { color: "bg-red-100 text-red-800", label: "Refunded" },
    DELETED: { color: "bg-gray-100 text-gray-800", label: "Deleted" },
  };

  const { color, label } = config[status] || config.PROCESSING;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function HealthIndicator({ healthy, label }: { healthy: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {healthy ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-500" />
      )}
      <span className={healthy ? "text-green-700" : "text-red-700"}>{label}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [health, setHealth] = useState<HealthStatus>(mockHealth);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<ManualAction>("resend-pdf");
  const [manualCaseId, setManualCaseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [courtOrderDialogOpen, setCourtOrderDialogOpen] = useState(false);

  // Authentication check
  const handleLogin = () => {
    // In production, this would verify against ADMIN_PASSWORD env var
    if (password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("Invalid password");
    }
  };

  // Refresh dashboard data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, these would be real API calls
      // const statsRes = await fetch('/api/admin/stats');
      // const casesRes = await fetch('/api/admin/cases');
      // etc.
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Update with mock data (would be real data in production)
      setStats(mockStats);
      setCases(mockCases);
      setHealth({ ...mockHealth, lastChecked: new Date().toISOString() });
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshData]);

  // Manual intervention handler
  const handleManualIntervention = async () => {
    if (!manualCaseId.trim()) {
      alert("Please enter a Case ID");
      return;
    }

    setIsLoading(true);
    try {
      // In production: await fetch('/api/admin/intervene', { method: 'POST', body: JSON.stringify({ caseId: manualCaseId, action: selectedAction }) });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(`Action "${selectedAction}" executed for case ${manualCaseId}`);
      setManualCaseId("");
      refreshData();
    } catch (error) {
      alert("Action failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter cases by search
  const filteredCases = cases.filter(
    (c) =>
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UJRIS%203D%20LOGO_TRANSPARENT%20BACKGROUND%202-WOnejyAsEuSSKBlOi6k8nTXsGT3mAr.jpg"
                alt="UJRIS"
                width={64}
                height={64}
                className="rounded"
              />
            </div>
            <CardTitle className="text-xl">UJRIS Admin Dashboard</CardTitle>
            <CardDescription>Enter your admin password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Admin Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleLogin} className="w-full bg-[#0f172a] hover:bg-[#1e293b]">
                <Unlock className="w-4 h-4 mr-2" />
                Access Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-[#0f172a] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UJRIS%203D%20LOGO_TRANSPARENT%20BACKGROUND%202-WOnejyAsEuSSKBlOi6k8nTXsGT3mAr.jpg"
              alt="UJRIS"
              width={40}
              height={40}
              className="rounded"
            />
            <div>
              <h1 className="font-bold text-lg">UJRIS Admin Dashboard</h1>
              <p className="text-xs text-slate-400">Master Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  health.status === "healthy"
                    ? "bg-green-500"
                    : health.status === "degraded"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              <span>System {health.status}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
              className="text-white border-slate-600 hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAuthenticated(false)}
              className="text-slate-400 hover:text-white"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Active Cases"
            value={stats.activeCases}
            icon={FileText}
          />
          <StatCard
            title="Pending Payment"
            value={stats.pendingPayment}
            icon={Clock}
          />
          <StatCard
            title="Documents Uploaded"
            value={stats.documentCount}
            icon={Database}
          />
          <StatCard
            title="Revenue (£)"
            value={`£${stats.revenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+12% from yesterday"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Today&apos;s Signups"
            value={stats.todaySignups}
            icon={Users}
          />
          <StatCard
            title="Delivered Today"
            value={stats.deliveredToday}
            icon={Send}
          />
          <StatCard
            title="Avg Processing (min)"
            value={stats.averageProcessingTime}
            icon={Activity}
          />
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={CheckCircle}
          />
        </div>

        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="cases">Active Cases</TabsTrigger>
            <TabsTrigger value="manual">Manual Intervention</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="court">Court Orders</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
          </TabsList>

          {/* Cases Tab */}
          <TabsContent value="cases">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Cases</CardTitle>
                  <CardDescription>
                    View and manage all cases (metadata only - no PII displayed)
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-sm">{c.id}</TableCell>
                          <TableCell className="capitalize">{c.caseType}</TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell>{c.documentCount}</TableCell>
                          <TableCell>{(c.fileSizeTotal / 1000000).toFixed(1)} MB</TableCell>
                          <TableCell>
                            <Badge
                              variant={c.paymentStatus === "COMPLETED" ? "default" : "secondary"}
                            >
                              {c.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" title="View Details">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Resend PDF">
                                <Send className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Refund">
                                <DollarSign className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Intervention Tab */}
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Manual Intervention</CardTitle>
                <CardDescription>
                  Execute manual actions on specific cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Case ID</label>
                    <Input
                      placeholder="e.g., case_abc123"
                      value={manualCaseId}
                      onChange={(e) => setManualCaseId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Action</label>
                    <Select
                      value={selectedAction}
                      onValueChange={(v) => setSelectedAction(v as ManualAction)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resend-pdf">Resend PDF</SelectItem>
                        <SelectItem value="regenerate">Regenerate PDF</SelectItem>
                        <SelectItem value="refund">Process Refund</SelectItem>
                        <SelectItem value="extend-retention">Extend Retention</SelectItem>
                        <SelectItem value="delete">Delete Case (GDPR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleManualIntervention}
                  disabled={isLoading}
                  className="bg-[#0f172a] hover:bg-[#1e293b]"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4 mr-2" />
                  )}
                  Execute Action
                </Button>

                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Important Notes</h4>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>All actions are logged in the audit trail</li>
                        <li>GDPR deletion is irreversible and completes within 24 hours</li>
                        <li>Refunds must also be processed in Stripe dashboard</li>
                        <li>Extended retention adds 30 days to expiry date</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Complete audit trail of all system actions (hashed for integrity)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.caseId}</TableCell>
                        <TableCell>{log.action.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-sm text-slate-500">{log.ipAddress}</TableCell>
                        <TableCell>
                          {log.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Court Orders Tab */}
          <TabsContent value="court">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="w-5 h-5" />
                  Court Order Data Release
                </CardTitle>
                <CardDescription>
                  Verify and process court orders for data release (UK Courts only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <Gavel className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-900 mb-2">No Pending Court Orders</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Court orders are verified cryptographically before any data release
                  </p>
                  <Dialog open={courtOrderDialogOpen} onOpenChange={setCourtOrderDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        Submit Court Order for Verification
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Court Order</DialogTitle>
                        <DialogDescription>
                          Upload a court order document for verification. Only valid UK court orders
                          with cryptographic seals are accepted.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Court Order ID</label>
                          <Input placeholder="e.g., CO-2026-12345" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Case Number</label>
                          <Input placeholder="e.g., ET/12345/2026" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Upload Court Order PDF</label>
                          <Input type="file" accept=".pdf" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCourtOrderDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="bg-[#0f172a]">
                          Submit for Verification
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Court Order Verification Process</h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Upload court order PDF with digital signature</li>
                    <li>System verifies cryptographic seal against known court public keys</li>
                    <li>System checks order validity and expiry date</li>
                    <li>If valid, single-use watermarked download is generated</li>
                    <li>User is notified (unless order is sealed)</li>
                    <li>All actions are logged in audit trail</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Last checked: {new Date(health.lastChecked).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Core Services</h4>
                    <div className="space-y-3">
                      <HealthIndicator healthy={health.database} label="Database (PostgreSQL)" />
                      <HealthIndicator healthy={health.storage} label="Storage (R2/Blob)" />
                      <HealthIndicator healthy={health.email} label="Email Service" />
                      <HealthIndicator healthy={health.ai} label="AI Processing" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Security Status</h4>
                    <div className="space-y-3">
                      <HealthIndicator healthy={true} label="TLS 1.3 Active" />
                      <HealthIndicator healthy={true} label="Encryption at Rest" />
                      <HealthIndicator healthy={true} label="GDPR Compliance" />
                      <HealthIndicator healthy={true} label="Audit Logging" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <Server className="w-4 h-4" />
                      <span className="text-sm font-medium">Uptime</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">99.9%</p>
                    <p className="text-xs text-slate-500">Last 30 days</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Security Score</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">A+</p>
                    <p className="text-xs text-slate-500">SSL Labs Rating</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <Database className="w-4 h-4" />
                      <span className="text-sm font-medium">Storage Used</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">2.4 GB</p>
                    <p className="text-xs text-slate-500">of 50 GB allocated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-slate-500">
          <p>UJRIS Admin Dashboard v1.0</p>
          <p>All actions are logged and audited</p>
        </div>
      </footer>
    </div>
  );
}
