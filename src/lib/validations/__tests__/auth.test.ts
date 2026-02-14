// @vitest-environment node
import { describe, it, expect } from "vitest";
import { signUpSchema, loginSchema } from "../auth";

describe("signUpSchema", () => {
  it("accepts valid signup data", () => {
    const result = signUpSchema.safeParse({
      email: "band@example.com",
      password: "securepass123",
      role: "ARTIST",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "securepass123",
      role: "ARTIST",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signUpSchema.safeParse({
      email: "band@example.com",
      password: "short",
      role: "ARTIST",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = signUpSchema.safeParse({
      email: "band@example.com",
      password: "securepass123",
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "band@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "band@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
