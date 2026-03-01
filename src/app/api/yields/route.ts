import type { NextRequest } from 'next/server'
import { fetchTopPools } from '@/lib/defillama'
import type { Pool } from '@/types/protocol'

/**
 * SSE endpoint for live yield streaming.
 *
 * Architecture notes:
 * - Module-level cache so all connected clients share one DeFi Llama fetch,
 *   not one per client. In production you'd use a pub/sub layer (Redis, Ably)
 *   but for a single-process PM2 deployment this is correct and efficient.
 * - Sends a full snapshot on connect, then diffs every 60s and pushes updates
 *   only when at least one pool's APY has changed by >0.5%.
 * - Keepalive comment every 15s prevents Nginx / CDN / load balancer timeouts.
 * - X-Accel-Buffering: no disables Nginx proxy buffering so events are flushed
 *   immediately rather than batched.
 *
 * Nika signal: real-time architecture, SSE over WebSocket rationale —
 * data flow is strictly server→client (unidirectional), so SSE is the
 * correct protocol choice. WS bidirectionality would be wasted here and
 * would require a custom Next.js server to work with App Router.
 */

// ── Module-level cache (shared across all SSE clients in this process) ────────

type PoolCache = {
  pools: Pool[]
  fetchedAt: number
}

let cache: PoolCache | null = null
const CACHE_TTL_MS = 60_000 // re-fetch DeFi Llama at most once per minute

async function getCachedPools(): Promise<Pool[]> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.pools
  const pools = await fetchTopPools(150)
  cache = { pools, fetchedAt: now }
  return pools
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function encode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

const keepalive = ': keepalive\n\n'

/** Pool IDs where APY changed by more than the threshold since `prev` snapshot. */
function detectChanges(prev: Pool[], next: Pool[], threshold = 0.5): string[] {
  const prevMap = new Map(prev.map(p => [p.pool, p.apy]))
  return next
    .filter(p => {
      const old = prevMap.get(p.pool)
      return old === undefined || Math.abs(p.apy - old) > threshold
    })
    .map(p => p.pool)
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic' // never cache this route

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk))
      }

      // 1. Send initial snapshot immediately
      const initial = await getCachedPools()
      send(encode('snapshot', { pools: initial }))

      let lastSnapshot = initial

      // 2. Keepalive ping every 15s
      const keepaliveTimer = setInterval(() => send(keepalive), 15_000)

      // 3. Poll for APY changes every 60s
      const pollTimer = setInterval(async () => {
        try {
          const fresh = await getCachedPools()
          const changed = detectChanges(lastSnapshot, fresh)

          if (changed.length > 0) {
            send(encode('update', { pools: fresh, changed }))
            lastSnapshot = fresh
          }
        } catch {
          // Continue silently — client will retry on reconnect
        }
      }, 60_000)

      // 4. Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(keepaliveTimer)
        clearInterval(pollTimer)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':       'text/event-stream',
      'Cache-Control':      'no-cache, no-transform',
      'Connection':         'keep-alive',
      'X-Accel-Buffering':  'no', // Nginx: flush events immediately, don't buffer
    },
  })
}
