"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createVenueProfile } from "@/actions/venue";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface VenueOnboardingProps {
  genres: Genre[];
}

const STEPS = ["Basics", "Venue Details", "Genres", "Links"] as const;

export function VenueOnboarding({ genres }: VenueOnboardingProps) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  // Step 2: Venue Details
  const [capacity, setCapacity] = useState<string>("");
  const [hasPa, setHasPa] = useState(false);
  const [hasBackline, setHasBackline] = useState(false);
  const [stageSize, setStageSize] = useState("");
  const [ageRestriction, setAgeRestriction] = useState<string>("ALL_AGES");

  // Step 3: Genres
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);

  // Step 4: Links
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  function toggleGenre(genreId: string) {
    setSelectedGenreIds((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      }
      return [...prev, genreId];
    });
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return (
          name.trim().length > 0 &&
          address.trim().length > 0 &&
          city.trim().length > 0
        );
      case 1:
        return capacity !== "" && parseInt(capacity) >= 1;
      case 2:
        return selectedGenreIds.length >= 1;
      case 3:
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const result = await createVenueProfile({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        capacity: parseInt(capacity),
        hasPa,
        hasBackline,
        stageSize: stageSize || undefined,
        ageRestriction: ageRestriction as
          | "ALL_AGES"
          | "EIGHTEEN_PLUS"
          | "TWENTY_ONE_PLUS",
        genreIds: selectedGenreIds,
        websiteUrl: websiteUrl || "",
        instagramUrl: instagramUrl || "",
      });

      if (result && !result.success) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "Please check your inputs and try again.",
        );
      }
    });
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Set Up Your Venue Profile
        </CardTitle>
        <div className="flex items-center justify-center gap-2 pt-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  i <= step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-6 ${i < step ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Venue Name</Label>
              <Input
                id="name"
                placeholder="Your venue name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <PlacesAutocomplete
                id="address"
                type="address"
                placeholder="123 Main St"
                value={address}
                onValueChange={setAddress}
                onPlaceSelect={(details) => setCity(details.city)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City name"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                placeholder="Maximum number of people"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="hasPa"
                type="checkbox"
                checked={hasPa}
                onChange={(e) => setHasPa(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="hasPa">Has PA System</Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="hasBackline"
                type="checkbox"
                checked={hasBackline}
                onChange={(e) => setHasBackline(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="hasBackline">Has Backline Gear</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stageSize">Stage Size (optional)</Label>
              <Input
                id="stageSize"
                placeholder="e.g. 12x8 ft"
                value={stageSize}
                onChange={(e) => setStageSize(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageRestriction">Age Restriction</Label>
              <Select value={ageRestriction} onValueChange={setAgeRestriction}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select restriction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_AGES">All Ages</SelectItem>
                  <SelectItem value="EIGHTEEN_PLUS">18+</SelectItem>
                  <SelectItem value="TWENTY_ONE_PLUS">21+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Your Preferred Genres</Label>
              <Badge variant="secondary">
                {selectedGenreIds.length} selected
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {genres.map((genre) => {
                const isSelected = selectedGenreIds.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => toggleGenre(genre.id)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL (optional)</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://yourvenue.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL (optional)</Label>
              <Input
                id="instagramUrl"
                type="url"
                placeholder="https://instagram.com/yourvenue"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !canProceed()}
            >
              {isPending ? "Creating Profile..." : "Complete Profile"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
