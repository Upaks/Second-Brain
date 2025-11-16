"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function ResetStuckItemsButton() {
  const [isResetting, setIsResetting] = useState(false)
  const router = useRouter()

  const handleReset = async () => {
    if (isResetting) return

    setIsResetting(true)
    try {
      const response = await fetch("/api/ingest/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resetAll: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset items")
      }

      toast.success(`Reset ${data.resetCount || 0} stuck items. Refreshing...`)
      
      // Refresh the page to show updated status
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      console.error("Failed to reset stuck items:", error)
      toast.error(error instanceof Error ? error.message : "Failed to reset stuck items")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Button
      onClick={handleReset}
      disabled={isResetting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isResetting ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Resetting...
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4" />
          Reset Stuck Items
        </>
      )}
    </Button>
  )
}

