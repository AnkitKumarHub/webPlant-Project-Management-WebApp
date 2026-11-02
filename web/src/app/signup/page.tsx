"use client";

import { AuthForm } from "@/components/auth-form";
import { RedirectIfAuthenticated } from "@/components/auth-guard";

export default function SignupPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthForm mode="signup" />
    </RedirectIfAuthenticated>
  );
}
