import { cache } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "./auth"

export type CurrentUser = {
  id: string
  email: string
  name: string | null
  image: string | null
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || !session.user.id) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  }
})

export async function requireCurrentUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}
