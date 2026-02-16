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
import { createArtistProfile } from "@/actions/artist";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface ArtistOnboardingProps {
  genres: Genre[];
}

const STEPS = ["Basics", "Genres", "Details", "Links"] as const;
const MAX_GENRES = 5;

export function ArtistOnboarding({ genres }: ArtistOnboardingProps) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [artistType, setArtistType] = useState<string>("");
  const [memberCount, setMemberCount] = useState<string>("1");

  // Step 2: Genres
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);

  // Step 3: Details
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [drawEstimate, setDrawEstimate] = useState<string>("");
  const [typicalSetLength, setTypicalSetLength] = useState<string>("");
  const [availabilityPreference, setAvailabilityPreference] =
    useState<string>("ANY_NIGHT");

  // Step 4: Links
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [bandcampUrl, setBandcampUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  function toggleGenre(genreId: string) {
    setSelectedGenreIds((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      }
      if (prev.length >= MAX_GENRES) return prev;
      return [...prev, genreId];
    });
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return (
          name.trim().length > 0 &&
          artistType !== "" &&
          parseInt(memberCount) >= 1
        );
      case 1:
        return selectedGenreIds.length >= 1;
      case 2:
        return location.trim().length > 0;
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
      const result = await createArtistProfile({
        name: name.trim(),
        artistType: artistType as "SOLO" | "DUO" | "FULL_BAND",
        memberCount: parseInt(memberCount),
        genreIds: selectedGenreIds,
        location: location.trim(),
        latitude,
        longitude,
        drawEstimate: drawEstimate ? parseInt(drawEstimate) : undefined,
        typicalSetLength: typicalSetLength
          ? parseInt(typicalSetLength)
          : undefined,
        availabilityPreference: availabilityPreference as
          | "WEEKENDS"
          | "WEEKNIGHTS"
          | "ANY_NIGHT"
          | "SPECIFIC_DATES",
        spotifyUrl: spotifyUrl || "",
        bandcampUrl: bandcampUrl || "",
        instagramUrl: instagramUrl || "",
        websiteUrl: websiteUrl || "",
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
          Set Up Your Artist Profile
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
              <Label htmlFor="name">Artist / Band Name</Label>
              <Input
                id="name"
                placeholder="Your artist or band name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artistType">Artist Type</Label>
              <Select value={artistType} onValueChange={setArtistType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOLO">Solo</SelectItem>
                  <SelectItem value="DUO">Duo</SelectItem>
                  <SelectItem value="FULL_BAND">Full Band</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberCount">Member Count</Label>
              <Input
                id="memberCount"
                type="number"
                min={1}
                max={50}
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Your Genres</Label>
              <Badge
                variant={
                  selectedGenreIds.length >= MAX_GENRES
                    ? "destructive"
                    : "secondary"
                }
              >
                {selectedGenreIds.length}/{MAX_GENRES} selected
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {genres.map((genre) => {
                const isSelected = selectedGenreIds.includes(genre.id);
                const isDisabled =
                  !isSelected && selectedGenreIds.length >= MAX_GENRES;
                return (
                  <button
                    key={genre.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleGenre(genre.id)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : isDisabled
                          ? "border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50"
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

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <PlacesAutocomplete
                id="location"
                type="(cities)"
                placeholder="City, State"
                value={location}
                onValueChange={setLocation}
                onPlaceSelect={(details) => {
                  setLatitude(details.latitude);
                  setLongitude(details.longitude);
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawEstimate">Draw Estimate (optional)</Label>
              <Input
                id="drawEstimate"
                type="number"
                min={0}
                placeholder="Typical audience size"
                value={drawEstimate}
                onChange={(e) => setDrawEstimate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="typicalSetLength">
                Typical Set Length in Minutes (optional)
              </Label>
              <Input
                id="typicalSetLength"
                type="number"
                min={5}
                max={240}
                placeholder="e.g. 45"
                value={typicalSetLength}
                onChange={(e) => setTypicalSetLength(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="availabilityPreference">
                Availability Preference
              </Label>
              <Select
                value={availabilityPreference}
                onValueChange={setAvailabilityPreference}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKENDS">Weekends</SelectItem>
                  <SelectItem value="WEEKNIGHTS">Weeknights</SelectItem>
                  <SelectItem value="ANY_NIGHT">Any Night</SelectItem>
                  <SelectItem value="SPECIFIC_DATES">Specific Dates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spotifyUrl">Spotify URL (optional)</Label>
              <Input
                id="spotifyUrl"
                type="url"
                placeholder="https://open.spotify.com/artist/..."
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bandcampUrl">Bandcamp URL (optional)</Label>
              <Input
                id="bandcampUrl"
                type="url"
                placeholder="https://yourband.bandcamp.com"
                value={bandcampUrl}
                onChange={(e) => setBandcampUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL (optional)</Label>
              <Input
                id="instagramUrl"
                type="url"
                placeholder="https://instagram.com/yourband"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL (optional)</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://yourband.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
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
