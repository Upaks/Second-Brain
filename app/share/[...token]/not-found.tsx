import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function ShareNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 py-16 text-center text-slate-100">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Link unavailable</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">This flashcard deck is no longer available</h1>
        <p className="mx-auto max-w-xl text-sm text-slate-400">
          The link you followed may have expired or been revoked by its owner. Ask them to generate a fresh share link or
          sign in to create your own flashcard decks.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="gap-2">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}
