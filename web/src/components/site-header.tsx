"use client";

import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/store/api";
import { useAppSelector } from "@/store/hooks";

export function SiteHeader() {
  const { user, status } = useAppSelector((state) => state.auth);
  const [logout, { isLoading }] = useLogoutMutation();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href={status === "authenticated" ? "/projects" : "/login"}
          className="text-sm font-semibold tracking-tight"
        >
          Mini Project Manager
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
              <LogOutIcon data-icon="inline-start" />
              {isLoading ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
