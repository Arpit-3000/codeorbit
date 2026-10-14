import { useSyncExternalStore } from 'react'

/** Subscribes to a CSS media query. Server render assumes `false`; the client corrects on hydrate. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', notify)
      return () => mql.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
