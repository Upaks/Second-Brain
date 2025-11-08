import { NextRequest, NextResponse } from "next/server"

import {
  consumePasswordResetToken,
  updateUserPassword,
  verifyPasswordResetToken,
} from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const token = typeof body?.token === "string" ? body.token.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Email, token, and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const tokenRecord = await verifyPasswordResetToken(email, token)

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    await updateUserPassword(email, password)
    await consumePasswordResetToken(email, token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[auth] Password reset error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

