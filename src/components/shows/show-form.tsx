"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { createShow } from "@/actions/show";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface ShowFormProps {
  genres: Genre[];
}

export function ShowForm({ genres }: ShowFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [slotsTotal, setSlotsTotal] = useState("3");
  const [note, setNote] = useState("");
  const [compensationType, setCompensationType] = useState("");
  const [compensationNote, setCompensationNote] = useState("");

  function toggleGenre(genreId: string) {
    setSelectedGenreIds((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      }
      return [...prev, genreId];
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("Please select a date");
      return;
    }

    if (selectedGenreIds.length === 0) {
      setError("Select at least 1 genre for this show");
      return;
    }

    startTransition(async () => {
      const result = await createShow({
        date: new Date(date + "T20:00:00"),
        title: title.trim() || undefined,
        genreIds: selectedGenreIds,
        slotsTotal: parseInt(slotsTotal) || 3,
        note: note.trim() || undefined,
        compensationType: compensationType || undefined,
        compensationNote: compensationNote.trim() || undefined,
      });

      if (result.success && result.data) {
        router.push(`/shows/${result.data.id}`);
      } else if (!result.success) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "Please check your inputs and try again."
        );
      }
    });
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Create a Show</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Show Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder='e.g. "Friday Night Showcase"'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Genre selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Genres</Label>
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

          {/* Slots total */}
          <div className="space-y-2">
            <Label htmlFor="slotsTotal">Number of Slots</Label>
            <Input
              id="slotsTotal"
              type="number"
              min={1}
              max={20}
              value={slotsTotal}
              onChange={(e) => setSlotsTotal(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              How many artist slots are available for this show?
            </p>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Description / Notes (optional)</Label>
            <Textarea
              id="note"
              placeholder="Any additional details about the show..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Compensation type */}
          <div className="space-y-2">
            <Label htmlFor="compensationType">Compensation Type (optional)</Label>
            <Select
              value={compensationType}
              onValueChange={setCompensationType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select compensation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Door Split">Door Split</SelectItem>
                <SelectItem value="Guarantee">Guarantee</SelectItem>
                <SelectItem value="Tip Jar">Tip Jar</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compensation note */}
          <div className="space-y-2">
            <Label htmlFor="compensationNote">
              Compensation Details (optional)
            </Label>
            <Textarea
              id="compensationNote"
              placeholder="e.g. 70/30 door split, $200 guarantee, etc."
              value={compensationNote}
              onChange={(e) => setCompensationNote(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/shows")}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Show"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
