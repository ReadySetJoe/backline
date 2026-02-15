"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updateVenueProfile } from "@/actions/profile";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface VenueProfileData {
  name: string;
  bio: string;
  address: string;
  city: string;
  capacity: number;
  genreIds: string[];
  hasPa: boolean;
  hasBackline: boolean;
  stageSize: string;
  ageRestriction: string;
  websiteUrl: string;
  instagramUrl: string;
}

interface VenueProfileFormProps {
  profile: VenueProfileData;
  genres: Genre[];
}

export function VenueProfileForm({ profile, genres }: VenueProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state — initialized from existing profile
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [address, setAddress] = useState(profile.address);
  const [city, setCity] = useState(profile.city);
  const [capacity, setCapacity] = useState(String(profile.capacity));
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(profile.genreIds);
  const [hasPa, setHasPa] = useState(profile.hasPa);
  const [hasBackline, setHasBackline] = useState(profile.hasBackline);
  const [stageSize, setStageSize] = useState(profile.stageSize);
  const [ageRestriction, setAgeRestriction] = useState(profile.ageRestriction);
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl);
  const [instagramUrl, setInstagramUrl] = useState(profile.instagramUrl);

  function toggleGenre(genreId: string) {
    setSelectedGenreIds((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      }
      return [...prev, genreId];
    });
  }

  function handleSubmit() {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateVenueProfile({
        name: name.trim(),
        bio: bio.trim() || undefined,
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

      if (result.success) {
        setSuccess(true);
      } else {
        setError(
          typeof result.error === "string"
            ? result.error
            : "Please check your inputs and try again."
        );
      }
    });
  }

  const isValid =
    name.trim().length > 0 &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    capacity !== "" &&
    parseInt(capacity) >= 1 &&
    selectedGenreIds.length >= 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Venue Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            Profile updated successfully.
          </div>
        )}

        {/* Basics */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Basics
          </h3>

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
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell artists about your venue..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={1000}
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

        <Separator />

        {/* Venue Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Venue Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                placeholder="Maximum people"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stageSize">Stage Size</Label>
              <Input
                id="stageSize"
                placeholder="e.g. 12x8 ft"
                value={stageSize}
                onChange={(e) => setStageSize(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
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

        <Separator />

        {/* Genres */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Preferred Genres
            </h3>
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

        <Separator />

        {/* Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Links
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://yourvenue.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                type="url"
                placeholder="https://instagram.com/yourvenue"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !isValid}
          className="w-full"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
