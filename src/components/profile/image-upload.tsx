"use client";

import { useState, useCallback } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  endpoint: "profileImage" | "bannerImage";
  variant: "avatar" | "banner";
}

export function ImageUpload({
  value,
  onChange,
  endpoint,
  variant,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        onChange(res[0].ufsUrl);
      }
      setIsUploading(false);
    },
    onUploadError: () => {
      setIsUploading(false);
    },
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      startUpload([file]);
    },
    [startUpload],
  );

  if (variant === "avatar") {
    return (
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {value ? (
              <img
                src={value}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <Camera className="h-8 w-8 text-muted-foreground" />
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <span className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
              {value ? "Change Photo" : "Upload Photo"}
            </span>
          </label>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onChange("")}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Banner variant
  return (
    <div className="space-y-2">
      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-dashed border-border">
        {value ? (
          <img
            src={value}
            alt="Banner"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-center text-muted-foreground">
            <Camera className="h-8 w-8 mx-auto mb-1" />
            <p className="text-xs">Recommended: 1200 x 300px</p>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <span className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
            {value ? "Change Banner" : "Upload Banner"}
          </span>
        </label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
