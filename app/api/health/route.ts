import { NextResponse } from "next/server";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  database: boolean;
  storage: boolean;
  email: boolean;
  ai: boolean;
  lastChecked: string;
  version: string;
  uptime: number;
}

// Track server start time for uptime calculation
const serverStartTime = Date.now();

async function checkDatabase(): Promise<boolean> {
  try {
    // In production with Prisma:
    // await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkStorage(): Promise<boolean> {
  try {
    // In production with Vercel Blob or R2:
    // await blob.head('health-check');
    return true;
  } catch {
    return false;
  }
}

async function checkEmail(): Promise<boolean> {
  try {
    // In production with email service:
    // Check SMTP connection or API health
    return true;
  } catch {
    return false;
  }
}

async function checkAI(): Promise<boolean> {
  try {
    // In production with AI provider:
    // Test API connectivity
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    // Run all health checks in parallel
    const [database, storage, email, ai] = await Promise.all([
      checkDatabase(),
      checkStorage(),
      checkEmail(),
      checkAI(),
    ]);

    // Determine overall status
    const allHealthy = database && storage && email && ai;
    const criticalHealthy = database && storage;
    
    let status: HealthCheck["status"];
    if (allHealthy) {
      status = "healthy";
    } else if (criticalHealthy) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }

    const healthCheck: HealthCheck = {
      status,
      database,
      storage,
      email,
      ai,
      lastChecked: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    };

    // Return appropriate status code
    const statusCode = status === "healthy" ? 200 : status === "degraded" ? 200 : 503;

    return NextResponse.json(healthCheck, { status: statusCode });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        lastChecked: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
