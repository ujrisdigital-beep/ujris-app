import { NextRequest, NextResponse } from "next/server";

// In-memory store for demo (use database in production)
let waitlistCount = 247; // Starting count

export async function GET() {
  return NextResponse.json({
    count: waitlistCount,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    // In production, save to database:
    // await prisma.waitlist.create({
    //   data: {
    //     email,
    //     createdAt: new Date(),
    //     source: request.headers.get('referer') || 'direct',
    //   }
    // });

    // Increment count (in production this would be from DB)
    waitlistCount++;

    // Send to email marketing service (Mailchimp, ConvertKit, etc.)
    // await addToEmailList(email);

    console.log(`[WAITLIST] New signup: ${email.substring(0, 3)}***`);

    return NextResponse.json({
      success: true,
      message: "Successfully joined the waitlist",
      count: waitlistCount,
    });
  } catch (error) {
    console.error("Waitlist signup failed:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
