import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
