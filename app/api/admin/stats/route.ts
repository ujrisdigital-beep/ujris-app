import { NextRequest, NextResponse } from "next/server";

// Admin API Key check middleware
function verifyAdminKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-admin-key");
  return apiKey === process.env.ADMIN_API_KEY;
}

export async function GET(request: NextRequest) {
  // Verify admin authentication
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // In production, these would be real database queries
    // Example with Prisma:
    // const [activeCases, pendingPayment, documentCount, revenueData] = await prisma.$transaction([
    //   prisma.case.count({ where: { status: { not: 'DELIVERED' } } }),
    //   prisma.case.count({ where: { paymentStatus: 'PENDING' } }),
    //   prisma.document.count(),
    //   prisma.payment.aggregate({ _sum: { amount: true } })
    // ]);

    // Mock data for demonstration
    const stats = {
      activeCases: 47,
      pendingPayment: 12,
      documentCount: 342,
      revenue: 2303,
      todaySignups: 8,
      deliveredToday: 5,
      averageProcessingTime: 4.2,
      successRate: 94.7,
    };

    const cases = [
      {
        id: "case_abc123",
        status: "PROCESSING",
        paymentStatus: "COMPLETED",
        documentCount: 12,
        fileSizeTotal: 45000000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        caseType: "employment",
      },
      {
        id: "case_def456",
        status: "AWAITING_PAYMENT",
        paymentStatus: "PENDING",
        documentCount: 8,
        fileSizeTotal: 32000000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        caseType: "pip",
      },
    ];

    return NextResponse.json({
      ...stats,
      cases,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
