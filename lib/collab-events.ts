/**
 * Tiny in-page event bus. StreamProvider (mounted once, app-wide) hears about pings and rooms from
 * Stream; the Collab Space sections subscribe here to refetch instantly instead of waiting for a refresh.
 */
export type CollabEvent = 'pings-changed' | 'rooms-changed' | 'friends-changed' | 'notifications-changed'

const NAME = 'codeorbit:collab'

export function emitCollab(type: CollabEvent, detail?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(NAME, { detail: { type, ...detail } }))
}

export function onCollab(type: CollabEvent, handler: (detail: any) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail?.type === type) handler(detail)
  }
  window.addEventListener(NAME, listener)
  return () => window.removeEventListener(NAME, listener)
}
