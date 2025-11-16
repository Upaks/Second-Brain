"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { FileText, ImageIcon, Mic, Sparkles } from "lucide-react"

export function CaptureComposer() {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>("")

  const invalidateInsights = useCallback(async () => {
    try {
      await fetch("/api/insights/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    } catch (error) {
      console.error("[v0] Failed to trigger insights revalidation:", error)
    } finally {
      window.dispatchEvent(new Event("insights:invalidate"))
    }
  }, [])

  const waitForIngest = useCallback(
    async (ingestItemId: string) => {
      const timeoutMs = 240_000
      const intervalMs = 2_500
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
            // Mark that insights were just created so pages will refresh on navigation
            sessionStorage.setItem("insights:lastCreated", Date.now().toString())
            await invalidateInsights()
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
    [invalidateInsights],
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
        // Mark that insights were just created so pages will refresh on navigation
        sessionStorage.setItem("insights:lastCreated", Date.now().toString())
        await invalidateInsights()
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
        // Mark that insights were just created so pages will refresh on navigation
        sessionStorage.setItem("insights:lastCreated", Date.now().toString())
        await invalidateInsights()
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
    <div className="relative rounded-3xl border-2 border-white/20 bg-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
      <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10">
        <Textarea
          placeholder="Paste text, drop a link, or type your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          className="min-h-[120px] text-base resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent text-white placeholder:text-white/50"
        />

        <div className="flex flex-col gap-4 pt-2 border-t border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={() => document.getElementById("file-upload")?.click()}
              className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
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

            <Button type="button" variant="ghost" size="sm" disabled={true} className="gap-2 text-white/40">
              <ImageIcon className="h-4 w-4" />
              Image
            </Button>

            <Button type="button" variant="ghost" size="sm" disabled={true} className="gap-2 text-white/40">
              <Mic className="h-4 w-4" />
              Audio
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {status && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Spinner size="sm" />
                {status}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={!content.trim() || isLoading} 
              className="gap-2 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Capture
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
