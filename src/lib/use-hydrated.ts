import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False in the server-rendered HTML, true once React has taken over the page.
 *
 * Submit buttons of forms on partially prerendered pages stay disabled until then. Before
 * hydration the browser posts the form natively, and unless the action redirects, `next start`
 * (Next.js 16.4) answers with only the dynamic part of the page and no shell, so the save works
 * but the page goes blank.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
