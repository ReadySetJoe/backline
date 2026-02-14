import Link from "next/link";
import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <SignUpForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
          Sign in
        </Link>
      </p>
    </div>
  );
}
