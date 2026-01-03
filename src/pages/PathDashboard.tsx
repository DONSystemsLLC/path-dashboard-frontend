import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

const PATH_API_BASE = import.meta.env.VITE_PATH_API_BASE || "https://codex-engine-backend.onrender.com"
const API_KEY = import.meta.env.VITE_PATH_API_KEY

export default function PathDashboard() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 60000) // every 60s
    return () => clearInterval(interval)
  }, [])

  async function fetchHealth() {
    try {
      const res = await axios.get(`${PATH_API_BASE}/api/path/dashboard/overview`, {
        headers: {
          "X-API-Key": API_KEY
        }
      })
      setHealth(res.data)
      setLoading(false)
    } catch (err) {
      console.error("Failed to fetch PATH health:", err)
      setLoading(false)
    }
  }

  if (loading) return <div className="p-4 text-muted">Loading dashboard...</div>
  if (!health) return <div className="p-4 text-red-500">Failed to load data.</div>

  const coherenceColor =
    health.coherence_score >= 0.8
      ? "green"
      : health.coherence_score >= 0.5
      ? "yellow"
      : "red"

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
            <span className={`ml-2 font-bold text-${coherenceColor}-500`}>
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
    </div>
  )
}
