"use client";

import { useEffect, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export function useGoogleMapsLoaded(): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;

    loadGoogleMaps()
      .then(() => setLoaded(true))
      .catch((err) => console.error("Failed to load Google Maps:", err));
  }, []);

  return loaded;
}
