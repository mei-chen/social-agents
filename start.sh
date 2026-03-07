#!/bin/bash
# Start the multi-agent simulation

cd ~/clawd/projects/multiagent-sim

# Find an available port
PORT=18795
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; do
    PORT=$((PORT + 1))
done

echo "🌍 Starting Multi-Agent Simulation on port $PORT..."
echo ""
echo "🎨 View at: http://localhost:$PORT"
echo "🌐 Tailscale: http://100.113.17.31:$PORT"
echo ""

# Start simple HTTP server
python3 -m http.server $PORT
