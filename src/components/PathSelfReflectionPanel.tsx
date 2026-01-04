// components/PathSelfReflectionPanel.tsx
// View PATH's autonomous learning reflection on collapse performance + glyph sync
// Uses Read-only Sync pattern - backend is source of truth for all metrics

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const PATH_API_BASE = import.meta.env.VITE_PATH_API_BASE
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN

interface CollapseHistoryEntry {
  timestamp: string
  mu: number
  phi: number
  j: number
  risk_score: number
  glyph: string
  result: "success" | "fail" | "unknown"
}

interface SelfReflectionData {
  recent_collapses: number
  success_count: number
  fail_count: number
  average_risk_score: number
  dynamic_threshold: number
  success_rate: number
  recent_trend: "improving" | "declining" | "stable" | "unknown"
  history: CollapseHistoryEntry[]
}

export default function PathSelfReflectionPanel() {
  const [reflection, setReflection] = useState<SelfReflectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSelfReflection()

    // WebSocket for real-time updates on glyph collapses
    let socket: WebSocket | null = null
    try {
      const wsUrl = PATH_API_BASE?.replace("https://", "wss://").replace("http://", "ws://")
      socket = new WebSocket(`${wsUrl}/ws/path/glyph`)

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === "glyph_collapse" || msg.event_type === "path/bundle_generated") {
            // Refresh data when new collapse occurs
            fetchSelfReflection()
          }
        } catch (e) {
          console.error("WebSocket message parse error:", e)
        }
      }

      socket.onerror = (e) => {
        console.warn("WebSocket connection error (non-fatal):", e)
      }
    } catch (e) {
      console.warn("WebSocket setup failed (non-fatal):", e)
    }

    // Polling fallback - refresh every 30 seconds
    const pollInterval = setInterval(fetchSelfReflection, 30000)

    return () => {
      if (socket) socket.close()
      clearInterval(pollInterval)
    }
  }, [])

  async function fetchSelfReflection() {
    try {
      const res = await axios.get<SelfReflectionData>(
        `${PATH_API_BASE}/api/path/self-reflection`,
        {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      )
      setReflection(res.data)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch PATH self-reflection", err)
      setError("Failed to load reflection state")
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return "📈"
      case "declining":
        return "📉"
      case "stable":
        return "➡️"
      default:
        return "❓"
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "text-green-600"
      case "declining":
        return "text-red-600"
      case "stable":
        return "text-blue-600"
      default:
        return "text-gray-500"
    }
  }

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading PATH memory pulse...</div>
  }

  if (error || !reflection) {
    return (
      <div className="p-4 text-red-500">
        {error || "Failed to load reflection state."}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">🧠 PATH Self-Reflection</h2>
      <p className="text-sm text-muted-foreground">
        Analysis of PATH's autonomous collapse history and live threshold tuning.
      </p>

      {/* Stats Overview Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Recent Collapses:</span>
              <span className="ml-2 font-bold">{reflection.recent_collapses}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Success Rate:</span>
              <span className="ml-2 font-bold text-blue-600">
                {(reflection.success_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Successful:</span>
              <span className="ml-2 font-bold text-green-600">{reflection.success_count}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Failed:</span>
              <span className="ml-2 font-bold text-red-600">{reflection.fail_count}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Risk Score:</span>
              <span className="ml-2 font-mono text-yellow-700">
                {reflection.average_risk_score.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Ψ Threshold:</span>
              <span className="ml-2 font-mono text-blue-700">
                {reflection.dynamic_threshold.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <span className="text-muted-foreground">Trend:</span>
            <span className={`ml-2 font-semibold ${getTrendColor(reflection.recent_trend)}`}>
              {getTrendIcon(reflection.recent_trend)} {reflection.recent_trend}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* History Section */}
      {reflection.history.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-4">📝 Last 10 Collapses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reflection.history.map((trace, i) => (
              <Card key={`${trace.timestamp}-${i}`}>
                <CardContent className="p-3 space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-muted-foreground">
                      {new Date(trace.timestamp).toLocaleString()}
                    </div>
                    <Badge
                      variant={trace.result === "success" ? "default" : "destructive"}
                    >
                      {trace.glyph}
                    </Badge>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      trace.result === "success" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {trace.result.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    μ={trace.mu.toFixed(4)}, Φ={trace.phi.toFixed(4)}, J={trace.j.toFixed(4)}
                  </div>
                  <div className="text-sm">
                    Risk: <span className="font-mono">{trace.risk_score.toFixed(4)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {reflection.history.length === 0 && (
        <div className="text-muted-foreground text-center py-8">
          No collapse history yet. PATH is waiting for traces to process.
        </div>
      )}
    </div>
  )
}
