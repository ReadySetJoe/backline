"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/actions/auth";

export function SignUpForm() {
  const [role, setRole] = useState<"ARTIST" | "VENUE" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!role) return;

    startTransition(async () => {
      const result = await signUp({ email, password, role });
      if (result && !result.success) {
        setErrors(result.error as Record<string, string[]>);
      }
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Create an account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>I am a...</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={role === "ARTIST" ? "default" : "outline"}
                className="w-full"
                onClick={() => setRole("ARTIST")}
              >
                I&apos;m an Artist
              </Button>
              <Button
                type="button"
                variant={role === "VENUE" ? "default" : "outline"}
                className="w-full"
                onClick={() => setRole("VENUE")}
              >
                I&apos;m a Venue
              </Button>
            </div>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password[0]}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!role || isPending}
          >
            {isPending ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
