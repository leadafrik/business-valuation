import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct signup is disabled. Use /api/auth/send-otp and /api/auth/verify-otp.",
    },
    { status: 410 }
  );
}
