import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === "activate") {
    // Dummy payment - just activate membership
    await prisma.user.update({
      where: { id: session.user.id },
      data: { membershipActive: true },
    });

    return NextResponse.json({ success: true, membershipActive: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
