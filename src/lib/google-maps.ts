"use client";

import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let initialized = false;
let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise;

  if (!initialized) {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    });
    initialized = true;
  }

  loadPromise = importLibrary("places").then(() => undefined);
  return loadPromise;
}
