#!/usr/bin/env bash
# Spam GET /matches to trigger Arcjet 429 rate limit
# Arcjet rule: slidingWindow max=50 per 10s
#
# NOTE: Must spoof a browser User-Agent — Arcjet's detectBot blocks curl's
# default agent (curl/x.x) with 403 before it ever reaches the rate limiter.

BASE_URL="${1:-http://localhost:8000}"
ENDPOINT="$BASE_URL/matches"
TOTAL=70       # send more than the 50-request limit
DELAY=0.05     # ~20 req/s → 70 requests well within 10s window
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

echo "Spamming: GET $ENDPOINT"
echo "Sending $TOTAL requests (limit is 50 per 10s)..."
echo "----------------------------------------"

pass=0
rate_limited=0
other=0

for i in $(seq 1 "$TOTAL"); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -A "$UA" "$ENDPOINT")

  case "$STATUS" in
    200)
      echo "Request $i → 200 OK"
      pass=$((pass + 1))
      ;;
    429)
      echo "Request $i → 429 Too Many Requests  <-- RATE LIMITED by Arcjet"
      rate_limited=$((rate_limited + 1))
      ;;
    403)
      echo "Request $i → 403 Forbidden (bot/shield block)"
      other=$((other + 1))
      ;;
    000)
      echo "Request $i → 000 Connection refused (is the server running?)"
      other=$((other + 1))
      ;;
    *)
      echo "Request $i → $STATUS"
      other=$((other + 1))
      ;;
  esac

  sleep "$DELAY"
done

echo "----------------------------------------"
echo "Results: $pass OK | $rate_limited rate-limited (429) | $other other"
