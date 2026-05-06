/**
 * Web Worker for heavy client-side sorting.
 * Runs in a separate thread — does not block the main UI thread.
 *
 * Usage in a component:
 *
 *   const workerRef = useRef<Worker | null>(null)
 *
 *   useEffect(() => {
 *     workerRef.current = new Worker(
 *       new URL('./workers/sort.worker.ts', import.meta.url),
 *       { type: 'module' }
 *     )
 *     workerRef.current.onmessage = (e) => setSortedData(e.data)
 *     return () => workerRef.current?.terminate()   // ← cleanup on unmount
 *   }, [])
 *
 *   // Trigger a sort:
 *   workerRef.current?.postMessage({ items: invoices, field: 'dateEmission', dir: 'desc' })
 */

export type SortField = string
export type SortDir   = 'asc' | 'desc'

export interface SortMessage<T = Record<string, unknown>> {
  items: T[]
  field: SortField
  dir:   SortDir
}

self.onmessage = <T extends Record<string, unknown>>(e: MessageEvent<SortMessage<T>>) => {
  const { items, field, dir } = e.data

  const sorted = [...items].sort((a, b) => {
    const av = a[field]
    const bv = b[field]

    // Numeric comparison
    if (typeof av === 'number' && typeof bv === 'number') {
      return dir === 'asc' ? av - bv : bv - av
    }

    // String / date-string comparison
    const as = String(av ?? '')
    const bs = String(bv ?? '')
    const cmp = as.localeCompare(bs, 'fr', { sensitivity: 'base', numeric: true })
    return dir === 'asc' ? cmp : -cmp
  })

  self.postMessage(sorted)
}
