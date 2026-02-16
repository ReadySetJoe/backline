"use client";

import { useRef, useState } from "react";
import usePlacesAutocomplete, { getGeocode } from "use-places-autocomplete";
import { useGoogleMapsLoaded } from "@/hooks/use-google-maps-loaded";
import { cn } from "@/lib/utils";

interface PlaceDetails {
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

interface PlacesAutocompleteProps {
  id?: string;
  type: "(cities)" | "address";
  value: string;
  onValueChange: (value: string) => void;
  onPlaceSelect?: (details: PlaceDetails) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

function extractCityState(
  addressComponents: google.maps.GeocoderAddressComponent[],
): { city: string; state: string } {
  let city = "";
  let state = "";

  for (const component of addressComponents) {
    if (component.types.includes("locality")) {
      city = component.long_name;
    }
    if (component.types.includes("administrative_area_level_1")) {
      state = component.short_name;
    }
  }

  return { city, state };
}

export function PlacesAutocomplete({
  id,
  type,
  value,
  onValueChange,
  onPlaceSelect,
  placeholder,
  required,
  className,
}: PlacesAutocompleteProps) {
  const isLoaded = useGoogleMapsLoaded();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    ready,
    suggestions: { status, data },
    setValue: setAutocompleteValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: type === "(cities)" ? ["(cities)"] : ["address"],
      componentRestrictions: { country: "us" },
    },
    debounce: 300,
    initOnMount: isLoaded,
  });

  // Fallback: plain text input if Google Maps isn't loaded
  if (!isLoaded || !ready) {
    return (
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className,
        )}
      />
    );
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onValueChange(val);
    setAutocompleteValue(val);
    setShowSuggestions(true);
  }

  async function handleSelect(placeId: string, description: string) {
    setShowSuggestions(false);
    clearSuggestions();

    try {
      const results = await getGeocode({ placeId });
      const { city, state } = extractCityState(results[0].address_components);
      const location = results[0].geometry.location;
      const latitude = location.lat();
      const longitude = location.lng();

      if (type === "(cities)") {
        const formatted = state ? `${city}, ${state}` : city;
        onValueChange(formatted);
        setAutocompleteValue(formatted, false);
        onPlaceSelect?.({ city, state, latitude, longitude });
      } else {
        onValueChange(description);
        setAutocompleteValue(description, false);
        onPlaceSelect?.({ city, state, latitude, longitude });
      }
    } catch {
      // On geocode failure, just use the description as-is
      onValueChange(description);
      setAutocompleteValue(description, false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleInput}
        onFocus={() => {
          if (data.length > 0) setShowSuggestions(true);
        }}
        onBlur={() => setShowSuggestions(false)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className,
        )}
      />
      {showSuggestions && status === "OK" && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {data.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(suggestion.place_id, suggestion.description);
              }}
              className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <span className="font-medium">
                {suggestion.structured_formatting.main_text}
              </span>{" "}
              <span className="text-muted-foreground">
                {suggestion.structured_formatting.secondary_text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
