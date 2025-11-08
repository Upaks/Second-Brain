import { NextRequest, NextResponse } from "next/server"

import { createPasswordResetToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const tokenData = await createPasswordResetToken(email)

    if (tokenData) {
      const baseUrl =
        process.env.NEXTAUTH_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : request.nextUrl.origin)
      const resetUrl = `${baseUrl}/auth/reset?token=${tokenData.token}&email=${encodeURIComponent(email)}`

      console.info(`[auth] Password reset link for ${email}: ${resetUrl}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[auth] Password reset request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

