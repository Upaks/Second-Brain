import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Use NextAuth credentials endpoint via next-auth/react signIn",
    },
    { status: 405 },
  )
}
