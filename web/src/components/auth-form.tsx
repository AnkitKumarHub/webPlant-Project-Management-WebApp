"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { errorFields, errorMessage } from "@/lib/errors";
import { useLoginMutation, useSignupMutation } from "@/store/api";

const COPY = {
  login: {
    heading: "Welcome back",
    subheading: "Sign in to pick up where you left off.",
    submit: "Sign in",
    pending: "Signing in…",
    switchPrompt: "Need an account?",
    switchHref: "/signup",
    switchLabel: "Create one",
    passwordHint: undefined,
  },
  signup: {
    heading: "Create your account",
    subheading: "One account, all of your projects.",
    submit: "Create account",
    pending: "Creating account…",
    switchPrompt: "Already registered?",
    switchHref: "/login",
    switchLabel: "Sign in",
    passwordHint: "At least 8 characters.",
  },
} as const;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const copy = COPY[mode];
  const router = useRouter();

  const [login, loginState] = useLoginMutation();
  const [signup, signupState] = useSignupMutation();
  const { isLoading, error } = mode === "login" ? loginState : signupState;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fields = errorFields(error);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const action = mode === "login" ? login : signup;
    const result = await action({ email, password });
    if ("data" in result) {
      router.replace("/projects");
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-xl font-semibold tracking-tight">{copy.heading}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{copy.subheading}</p>

      <Card className="mt-6">
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              {error && Object.keys(fields).length === 0 ? (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage(error)}</AlertDescription>
                </Alert>
              ) : null}

              <Field data-invalid={Boolean(fields["email"])}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(fields["email"])}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <FieldError>{fields["email"]}</FieldError>
              </Field>

              <Field data-invalid={Boolean(fields["password"])}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    aria-invalid={Boolean(fields["password"])}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </div>
                {fields["password"] ? (
                  <FieldError>{fields["password"]}</FieldError>
                ) : copy.passwordHint ? (
                  <FieldDescription>{copy.passwordHint}</FieldDescription>
                ) : null}
              </Field>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner data-icon="inline-start" /> : null}
                {isLoading ? copy.pending : copy.submit}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {copy.switchPrompt}{" "}
        <Link href={copy.switchHref} className="font-medium text-foreground hover:underline">
          {copy.switchLabel}
        </Link>
      </p>
    </div>
  );
}
