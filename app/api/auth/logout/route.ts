import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Use next-auth/react signOut to terminate sessions",
    },
    { status: 405 },
  )
}
