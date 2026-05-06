import { useEffect, useRef, useState } from 'react'
import type { SortDir, SortField } from '../workers/sort.worker'

/**
 * Offloads array sorting to a Web Worker.
 * The worker is created once and terminated on unmount — no memory leak.
 *
 * @example
 *   const { sorted, sort } = useSortWorker(invoices)
 *   sort('dateEmission', 'desc')
 */
export function useSortWorker<T extends Record<string, unknown>>(items: T[]) {
  const [sorted, setSorted] = useState<T[]>(items)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/sort.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current.onmessage = (e: MessageEvent<T[]>) => setSorted(e.data)

    // Cleanup: terminate the worker thread when the component unmounts
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  // Reset when source data changes
  useEffect(() => { setSorted(items) }, [items])

  const sort = (field: SortField, dir: SortDir = 'asc') => {
    workerRef.current?.postMessage({ items, field, dir })
  }

  return { sorted, sort }
}
