"use client";

import { AuthForm } from "@/components/auth-form";
import { RedirectIfAuthenticated } from "@/components/auth-guard";

export default function LoginPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthForm mode="login" />
    </RedirectIfAuthenticated>
  );
}
