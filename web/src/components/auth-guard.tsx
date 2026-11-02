"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoadingState } from "@/components/states";
import { useAppSelector } from "@/store/hooks";

/**
 * Page-level protection. The API is the real gate — every endpoint checks the
 * token and scopes queries to the caller — so this only keeps signed-out
 * visitors from seeing an empty shell of a page they cannot use.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAppSelector((state) => state.auth.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return <LoadingState label="Checking your session" className="py-16" />;
  }

  return <>{children}</>;
}

/** The mirror image, for /login and /signup. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const status = useAppSelector((state) => state.auth.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/projects");
    }
  }, [status, router]);

  if (status === "authenticated") {
    return <LoadingState label="Taking you to your projects" className="py-16" />;
  }

  return <>{children}</>;
}
