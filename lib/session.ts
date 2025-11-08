import { cache } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { prisma } from "./db"
import { authOptions } from "./auth"

export const getCurrentUser = cache(async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  return user
})

export async function requireCurrentUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}
