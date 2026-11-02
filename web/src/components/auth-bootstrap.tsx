"use client";

import { useMeQuery } from "@/store/api";

/**
 * Runs `GET /auth/me` once at the root so every page knows whether there is a
 * session before it decides what to render. Rendering nothing keeps it out of
 * the layout.
 */
export function AuthBootstrap() {
  useMeQuery();
  return null;
}
