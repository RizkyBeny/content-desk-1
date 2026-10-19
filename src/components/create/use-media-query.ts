"use client";

import { useEffect, useState } from "react";

/** SSR-safe media query hook (defaults to false until mounted). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export const DESKTOP_QUERY = "(min-width: 768px)";
