import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import axios from "axios"
import CollapseFeed from "@/components/CollapseFeed"

const PATH_API_BASE = import.meta.env.VITE_PATH_API_BASE || "https://codex-engine-backend.onrender.com"
const API_KEY = import.meta.env.VITE_PATH_API_KEY

interface HealthData {
  glyph: string
  status: string
  coherence_score: number
  drift_score: number
}

export default function PathDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchHealth() {
      try {
        const res = await axios.get<HealthData>(`${PATH_API_BASE}/api/path/dashboard/overview`, {
          headers: { "X-API-Key": API_KEY },
          signal: controller.signal
        })
        setHealth(res.data)
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch PATH health:", err)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void fetchHealth()
    const interval = setInterval(fetchHealth, 60000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [])

  if (loading) return <div className="p-4 text-muted">Loading dashboard...</div>
  if (!health) return <div className="p-4 text-red-500">Failed to load data.</div>

  const getCoherenceColorClass = (score: number): string => {
    if (score >= 0.8) return "text-green-500"
    if (score >= 0.5) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-xl font-bold">ΞΔ System Health</h2>
          <p className="text-sm text-muted-foreground">
            Monitoring baseline collapse against sealed anchor trace.
          </p>
          <div className="text-md">Glyph: <Badge>{health.glyph}</Badge></div>
          <div className="text-md">Status: <span className="font-medium">{health.status}</span></div>
          <div className="text-md">
            Coherence Score:
            <span className={`ml-2 font-bold ${getCoherenceColorClass(health.coherence_score)}`}>
              {health.coherence_score.toFixed(3)}
            </span>
          </div>
          <div className="text-md">Drift Score: {health.drift_score.toFixed(3)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-xl font-bold">Ψ Collapse Tools</h2>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Refresh Health
          </Button>
        </CardContent>
      </Card>

      <div className="col-span-2 mt-6">
        <CollapseFeed />
      </div>
    </div>
  )
}
