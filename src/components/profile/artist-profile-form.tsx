"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { updateArtistProfile } from "@/actions/profile";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface ArtistProfileData {
  name: string;
  bio: string;
  location: string;
  artistType: string;
  memberCount: number;
  genreIds: string[];
  spotifyUrl: string;
  bandcampUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  availabilityPreference: string;
  typicalSetLength?: number;
  drawEstimate?: number;
}

interface ArtistProfileFormProps {
  profile: ArtistProfileData;
  genres: Genre[];
}

const MAX_GENRES = 5;

export function ArtistProfileForm({ profile, genres }: ArtistProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state — initialized from existing profile
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [artistType, setArtistType] = useState(profile.artistType);
  const [memberCount, setMemberCount] = useState(String(profile.memberCount));
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(profile.genreIds);
  const [location, setLocation] = useState(profile.location);
  const [drawEstimate, setDrawEstimate] = useState(
    profile.drawEstimate !== undefined ? String(profile.drawEstimate) : ""
  );
  const [typicalSetLength, setTypicalSetLength] = useState(
    profile.typicalSetLength !== undefined ? String(profile.typicalSetLength) : ""
  );
  const [availabilityPreference, setAvailabilityPreference] = useState(
    profile.availabilityPreference
  );
  const [spotifyUrl, setSpotifyUrl] = useState(profile.spotifyUrl);
  const [bandcampUrl, setBandcampUrl] = useState(profile.bandcampUrl);
  const [instagramUrl, setInstagramUrl] = useState(profile.instagramUrl);
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl);

  function toggleGenre(genreId: string) {
    setSelectedGenreIds((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      }
      if (prev.length >= MAX_GENRES) return prev;
      return [...prev, genreId];
    });
  }

  function handleSubmit() {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateArtistProfile({
        name: name.trim(),
        bio: bio.trim() || undefined,
        artistType: artistType as "SOLO" | "DUO" | "FULL_BAND",
        memberCount: parseInt(memberCount),
        genreIds: selectedGenreIds,
        location: location.trim(),
        drawEstimate: drawEstimate ? parseInt(drawEstimate) : undefined,
        typicalSetLength: typicalSetLength ? parseInt(typicalSetLength) : undefined,
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
    artistType !== "" &&
    parseInt(memberCount) >= 1 &&
    selectedGenreIds.length >= 1 &&
    location.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artist Profile</CardTitle>
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
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell venues about your music..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
        </div>

        <Separator />

        {/* Genres */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Genres
            </h3>
            <Badge variant={selectedGenreIds.length >= MAX_GENRES ? "destructive" : "secondary"}>
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

        <Separator />

        {/* Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Details
          </h3>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="City, State"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="drawEstimate">Draw Estimate</Label>
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
              <Label htmlFor="typicalSetLength">Set Length (min)</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="availabilityPreference">Availability Preference</Label>
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

        <Separator />

        {/* Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Links
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spotifyUrl">Spotify URL</Label>
              <Input
                id="spotifyUrl"
                type="url"
                placeholder="https://open.spotify.com/artist/..."
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bandcampUrl">Bandcamp URL</Label>
              <Input
                id="bandcampUrl"
                type="url"
                placeholder="https://yourband.bandcamp.com"
                value={bandcampUrl}
                onChange={(e) => setBandcampUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                type="url"
                placeholder="https://instagram.com/yourband"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://yourband.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
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
