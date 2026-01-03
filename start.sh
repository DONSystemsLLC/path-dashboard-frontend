#!/bin/sh
set -e

# ─── HEALTH CHECK ─────────────────────────────────────────────
HEALTH_URL="http://localhost/"
EXPECTED_CODE=200

# Start nginx in background for health check
nginx &
sleep 2

code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$code" -ne "$EXPECTED_CODE" ]; then
  echo "Health check failed with code $code"
  exit 1
fi

# Stop background nginx (will restart properly at end)
nginx -s stop
sleep 1

# ─── AUTO-BROADCAST ΞΔ TO QCCS ───────────────────────────────
if [ -n "$QCCS_API_URL" ] && [ -n "$QCCS_API_KEY" ]; then
  echo "Broadcasting ΞΔ anchor to QCCS..."
  curl -s -X POST "$QCCS_API_URL" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $QCCS_API_KEY" \
    -d '{
      "type": "collapse_broadcast",
      "trace_id": "auto-broadcast",
      "anchor_id": "ΞΔ-bootstrap",
      "payload": {
        "glyph": "ΞΔ",
        "trace_id": "auto-broadcast",
        "anchor_id": "ΞΔ-bootstrap",
        "collapse_topic": "Ψ_PATH_COLLAPSE",
        "tenant_id": "'"$PATH_TENANT_ID"'",
        "resonance_type": "system_boot",
        "label": "ΞΔ-AUTO-DEPLOY",
        "subsystem": "path-dashboard",
        "deployment": "render"
      }
    }' || echo "Warning: ΞΔ broadcast failed"
else
  echo "Skipping ΞΔ broadcast (QCCS_API_URL or QCCS_API_KEY not set)"
fi

# ─── COLLAPSEFEED SNAPSHOT (HTML RENDER) ─────────────────────
if [ -n "$VITE_PATH_API_BASE" ] && [ -n "$VITE_PATH_API_KEY" ]; then
  echo "Generating static CollapseFeed snapshot..."
  curl -s "$VITE_PATH_API_BASE/api/path/collapse-feed" \
    -H "X-API-Key: $VITE_PATH_API_KEY" \
    -o /usr/share/nginx/html/collapse-feed.json || echo "Warning: Failed to fetch collapse feed"

  if [ -f /usr/share/nginx/html/collapse-feed.json ]; then
    cat <<EOF > /usr/share/nginx/html/collapse-feed.html
<html>
<head><title>Collapse Snapshot</title></head>
<body>
<h1>Ξ Collapse Snapshot</h1>
<pre>
$(cat /usr/share/nginx/html/collapse-feed.json | jq . 2>/dev/null || cat /usr/share/nginx/html/collapse-feed.json)
</pre>
</body>
</html>
EOF
  fi
else
  echo "Skipping CollapseFeed snapshot (API credentials not set)"
fi

# ─── TRIGGER ΞΘ IF DRIFT > 0.035 ─────────────────────────────
if [ -n "$VITE_PATH_API_BASE" ] && [ -n "$VITE_PATH_API_KEY" ] && [ -n "$QCCS_API_URL" ]; then
  echo "Checking for temporal instability (ΞΘ)..."
  drift=$(curl -s "$VITE_PATH_API_BASE/api/path/dashboard/overview" \
    -H "X-API-Key: $VITE_PATH_API_KEY" | jq -r '.drift_score' 2>/dev/null || echo "0")

  if [ -n "$drift" ] && [ "$drift" != "null" ] && [ "$drift" != "0" ]; then
    threshold_exceeded=$(echo "$drift > 0.035" | bc 2>/dev/null || echo "0")
    if [ "$threshold_exceeded" -eq 1 ]; then
      echo "ΞΘ threshold exceeded. Broadcasting ΞΘ..."
      curl -s -X POST "$QCCS_API_URL" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $QCCS_API_KEY" \
        -d '{
          "type": "collapse_broadcast",
          "trace_id": "auto-trigger-theta",
          "anchor_id": "ΞΘ-auto",
          "payload": {
            "glyph": "ΞΘ",
            "trace_id": "auto-trigger-theta",
            "anchor_id": "ΞΘ-auto",
            "collapse_topic": "Ψ_PATH_COLLAPSE",
            "tenant_id": "'"$PATH_TENANT_ID"'",
            "resonance_type": "temporal_instability",
            "label": "ΞΘ-AUTO-TRIGGER",
            "subsystem": "path-dashboard",
            "deployment": "render"
          }
        }' || echo "Warning: ΞΘ broadcast failed"
    else
      echo "Drift below ΞΘ threshold ($drift) — no temporal collapse triggered."
    fi
  fi
fi

# ─── LAUNCH ───────────────────────────────────────────────────
echo "PATH dashboard healthy (HTTP $code). Starting NGINX."
exec nginx -g 'daemon off;'
