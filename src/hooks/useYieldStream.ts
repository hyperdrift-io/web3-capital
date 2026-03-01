'use client'

import { useEffect, useRef, useState } from 'react'
import type { Pool } from '@/types/protocol'

export type StreamStatus = 'connecting' | 'live' | 'error'

type YieldStreamState = {
  pools: Pool[]
  updatedIds: ReadonlySet<string>
  status: StreamStatus
  updateCount: number // how many batches of updates have been received
}

/** How long the pulse animation stays on an updated cell (ms). */
const ANIMATION_DURATION_MS = 2_500

/**
 * Subscribes to the /api/yields SSE endpoint and returns live pool data.
 *
 * Initialises with `initialPools` (server-rendered ISR snapshot) so the UI
 * is never empty — the stream upgrades it to live data seamlessly.
 *
 * EventSource handles reconnection automatically. We track status to drive
 * the live/connecting/error indicator in the UI.
 */
export function useYieldStream(initialPools: Pool[]): YieldStreamState {
  const [pools,       setPools]       = useState<Pool[]>(initialPools)
  const [updatedIds,  setUpdatedIds]  = useState<ReadonlySet<string>>(new Set())
  const [status,      setStatus]      = useState<StreamStatus>('connecting')
  const [updateCount, setUpdateCount] = useState(0)

  // Keep a ref to the clear-animation timeout so we can cancel it if a
  // new update arrives before the previous animation finishes.
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // EventSource is browser-only — guard against SSR
    if (typeof EventSource === 'undefined') {
      setStatus('error')
      return
    }

    const es = new EventSource('/api/yields')

    es.addEventListener('snapshot', (e: MessageEvent) => {
      try {
        const { pools: fresh } = JSON.parse(e.data) as { pools: Pool[] }
        setPools(fresh)
        setStatus('live')
      } catch { /* malformed event — ignore */ }
    })

    es.addEventListener('update', (e: MessageEvent) => {
      try {
        const { pools: fresh, changed } = JSON.parse(e.data) as {
          pools: Pool[]
          changed: string[]
        }

        setPools(fresh)
        setUpdateCount(n => n + 1)

        const ids = new Set(changed)
        setUpdatedIds(ids)

        // Cancel any pending clear from a previous update
        if (clearTimer.current) clearTimeout(clearTimer.current)

        // Clear animation after duration
        clearTimer.current = setTimeout(() => {
          setUpdatedIds(new Set())
        }, ANIMATION_DURATION_MS)
      } catch { /* malformed event — ignore */ }
    })

    es.onerror = () => {
      // EventSource will auto-reconnect; we just update status
      setStatus(es.readyState === EventSource.CLOSED ? 'error' : 'connecting')
    }

    es.onopen = () => setStatus('live')

    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
      es.close()
    }
  }, []) // intentionally empty — we never need to re-subscribe

  return { pools, updatedIds, status, updateCount }
}
