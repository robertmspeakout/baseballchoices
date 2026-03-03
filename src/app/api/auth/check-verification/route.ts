import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ verified: true });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { emailVerified: true },
  });

  if (user && !user.emailVerified) {
    return NextResponse.json({ verified: false });
  }

  return NextResponse.json({ verified: true });
}
