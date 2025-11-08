import { randomBytes, createHash } from "crypto"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"
import { compare, hash } from "bcryptjs"

export async function hashPassword(password: string) {
  return await hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await compare(password, hashedPassword)
}

export async function createUser(email: string, password: string, name?: string) {
  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  })

  return user
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  })
}

export async function validateCredentials(email: string, password: string) {
  const user = await getUserByEmail(email)

  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    return null
  }

  return user
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createPasswordResetToken(email: string) {
  const user = await getUserByEmail(email)

  if (!user) {
    return null
  }

  const token = randomBytes(32).toString("hex")
  const hashedToken = hashToken(token)
  const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires,
    },
  })

  return { token, expires }
}

export async function verifyPasswordResetToken(email: string, token: string) {
  const hashed = hashToken(token)

  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: hashed,
      expires: {
        gt: new Date(),
      },
    },
  })

  return record
}

export async function consumePasswordResetToken(email: string, token: string) {
  const hashed = hashToken(token)

  try {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: hashed,
        },
      },
    })
  } catch (error) {
    // Ignore if already deleted
  }
}

export async function updateUserPassword(email: string, password: string) {
  const hashedPassword = await hashPassword(password)

  return prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  })
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const user = await validateCredentials(credentials.email, credentials.password)

        if (!user) {
          throw new Error("Invalid email or password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
