"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { FileText, ImageIcon, Mic, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

interface CaptureComposerProps {
  userId: string
}

export function CaptureComposer({ userId }: CaptureComposerProps) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>("")

  const waitForIngest = useCallback(
    async (ingestItemId: string) => {
      const timeoutMs = 120_000
      const intervalMs = 1_500
      const deadline = Date.now() + timeoutMs

      while (Date.now() < deadline) {
        const res = await fetch(`/api/ingest/status?id=${encodeURIComponent(ingestItemId)}`, {
          cache: "no-store",
        })

        if (!res.ok) {
          throw new Error("Failed to check ingest status")
        }

        const data: {
          items: Array<{ id: string; status: string; insightId: string | null; insightIds: string[] }>
        } = await res.json()

        const item = data.items[0]
        if (item) {
          if (item.status === "DONE") {
            setStatus("Syncing insights…")
            await new Promise((resolve) => setTimeout(resolve, 350))
            router.refresh()
            setStatus("")
            return
          }

          if (item.status === "ERROR") {
            throw new Error("Ingest failed")
          }

          setStatus(item.status === "PROCESSING" ? "Processing…" : "Queued…")
        } else {
          setStatus("Queued…")
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs))
      }

      throw new Error("Timed out waiting for ingest")
    },
    [router],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    setStatus("Capturing...")

    try {
      // Detect if it's a URL
      const urlRegex = /^https?:\/\//i
      const isUrl = urlRegex.test(content.trim())

      const endpoint = isUrl ? "/api/ingest/url" : "/api/ingest/text"
      const body = isUrl ? { url: content.trim() } : { text: content }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Failed to capture")

      const data: { ingestItemId: string; status: string } = await res.json()

      if (data.status === "COMPLETED") {
        setStatus("Syncing insights…")
        router.refresh()
        setStatus("")
        setContent("")
        return
      }

      setStatus("Processing…")
      await waitForIngest(data.ingestItemId)
      setContent("")
    } catch (error) {
      console.error("[v0] Capture error:", error)
      setStatus("")
      alert("Failed to capture. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setStatus("Uploading...")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/ingest/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to upload")

      const data: { ingestItemId: string; status: string } = await res.json()

      if (data.status === "COMPLETED") {
        setStatus("Syncing insights…")
        router.refresh()
        setStatus("")
        return
      }

      setStatus("Processing…")
      await waitForIngest(data.ingestItemId)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setStatus("")
      alert("Failed to upload. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Textarea
          placeholder="Paste text, drop a link, or type your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          className="min-h-[120px] text-base resize-none border-0 focus-visible:ring-0 shadow-none"
        />

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={() => document.getElementById("file-upload")?.click()}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              File
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md,image/*,audio/*"
              onChange={handleFileUpload}
              disabled={isLoading}
            />

            <Button type="button" variant="ghost" size="sm" disabled={true} className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Image
            </Button>

            <Button type="button" variant="ghost" size="sm" disabled={true} className="gap-2">
              <Mic className="h-4 w-4" />
              Audio
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {status && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" />
                {status}
              </div>
            )}

            <Button type="submit" disabled={!content.trim() || isLoading} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Capture
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
