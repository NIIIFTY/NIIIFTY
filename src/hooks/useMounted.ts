import { useCallback, useEffect, useState } from "react";

/**
 * Hook to determine if the component is mounted on the client.
 * Using state ensures a re-render occurs after the initial mount,
 * allowing components to safely render client-only content.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return useCallback(() => mounted, [mounted]);
}