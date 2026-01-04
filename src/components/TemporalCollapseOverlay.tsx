// components/TemporalCollapseOverlay.tsx
// ΞΘ Diagnostic Overlay — View PATH temporal instability collapses
// Uses backend /api/path/xi-theta for Read-only Sync pattern

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

const PATH_API_BASE = import.meta.env.VITE_PATH_API_BASE
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN

interface XiThetaResponse {
  success: boolean
  result: {
    threshold: number
    tace_available: boolean
    analyzer_status: {
      window_size: number
      samples_recorded: number
      xi_theta_triggers: number
      xi_theta_threshold: number
      recent_deltas: number[]
    } | null
    trigger_logic: {
      primary: string
      oscillating: string
      diverging: string
    }
  }
}

interface DeltaEvent {
  trace_id: string
  text: string
  glyph: string
  delta: number
  cause?: string
  timestamp: string
}

export default function TemporalCollapseOverlay() {
  const [events, setEvents] = useState<DeltaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [reflexThreshold, setReflexThreshold] = useState<number>(0.12)
  const [triggerCount, setTriggerCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchXiThetaStatus() {
      try {
        // Use backend endpoint (Read-only Sync pattern)
        const res = await axios.get<XiThetaResponse>(
          `${PATH_API_BASE}/api/path/xi-theta`,
          {
            headers: {
              "Authorization": `Bearer ${AUTH_TOKEN}`,
              "Content-Type": "application/json"
            },
            withCredentials: true,
            signal: controller.signal
          }
        )

        if (res.data.success && res.data.result) {
          const { threshold, analyzer_status } = res.data.result

          // Set threshold from backend (single source of truth)
          setReflexThreshold(threshold)

          if (analyzer_status) {
            setTriggerCount(analyzer_status.xi_theta_triggers)

            // Convert recent deltas to display events
            const deltaEvents: DeltaEvent[] = analyzer_status.recent_deltas.map((delta, i) => ({
              trace_id: `delta_${i}_${Date.now()}`,
              text: `Δψ observation from temporal window`,
              glyph: delta > threshold ? 'ΞΘ' : 'Ψ',
              delta,
              cause: delta > threshold ? 'Threshold exceeded' : 'Within normal bounds',
              timestamp: new Date().toISOString(),
            }))

            setEvents(deltaEvents)
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to load ΞΘ status:", err)
          setError("Failed to connect to PATH backend")
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void fetchXiThetaStatus()
    return () => controller.abort()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">ΞΘ Temporal Collapse Reflex — Diagnostic Overlay</h2>

      <div className="flex gap-4 text-sm text-muted-foreground mb-4">
        <div>
          ΞΘ Threshold: <span className="font-mono text-blue-500">{reflexThreshold.toFixed(4)}</span>
        </div>
        <div>
          Triggers: <span className="font-mono text-orange-500">{triggerCount}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading ΞΘ status from backend...</p>
      ) : error ? (
        <div className="text-red-500 p-4 border border-red-300 rounded">
          {error}
        </div>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground">No Δψ observations yet. TACE analyzer needs more data.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {events.map((event) => (
            <Card key={event.trace_id}>
              <CardContent className="p-4 space-y-1">
                <div className="text-sm opacity-60">{new Date(event.timestamp).toLocaleString()}</div>
                <div className="text-md font-semibold">{event.cause || "Temporal instability observed"}</div>
                <div className="text-sm">Δψ: {event.delta.toFixed(4)}</div>
                <div className="text-sm opacity-80">{event.text}</div>
                <Badge variant={event.glyph === 'ΞΘ' ? 'destructive' : 'outline'}>{event.glyph}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
