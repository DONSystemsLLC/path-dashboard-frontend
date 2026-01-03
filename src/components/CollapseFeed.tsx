import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const PATH_API_BASE = import.meta.env.VITE_PATH_API_BASE
const API_KEY = import.meta.env.VITE_PATH_API_KEY
const GLYPH_STREAM = import.meta.env.VITE_GLYPH_STREAM || "Ψ_PATH_COLLAPSE"

interface CollapseEvent {
  label?: string
  glyph: string
  resonance_type: string
  subsystem: string
  timestamp: string
}

export default function CollapseFeed() {
  const [events, setEvents] = useState<CollapseEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchCollapseFeed()
  }, [])

  async function fetchCollapseFeed() {
    try {
      const res = await axios.get<{ events: CollapseEvent[] }>(
        `${PATH_API_BASE}/api/path/collapse-feed?topic=${encodeURIComponent(GLYPH_STREAM)}`,
        {
          headers: { "X-API-Key": API_KEY }
        }
      )
      setEvents(res.data.events || [])
      setLoading(false)
    } catch (err) {
      console.error("Error loading collapse feed:", err)
      setLoading(false)
    }
  }

  if (loading) return <div className="p-4 text-muted">Loading collapse feed...</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🧠 Collapse Feed ({GLYPH_STREAM})</h2>
      <div className="space-y-2">
        {events.map((event, i) => (
          <Card key={i}>
            <CardContent className="p-3 space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">{event.label || event.glyph}</span>
                <Badge variant="outline">{event.glyph}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{event.resonance_type} • {event.subsystem}</div>
              <div className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
