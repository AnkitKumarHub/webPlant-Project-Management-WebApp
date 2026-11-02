"use client";

import { Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Two-step delete: the first click arms it, the second commits. Beats a
 * native confirm() dialog and gives the user a few seconds to change course.
 */
export function ConfirmButton({
  label,
  confirmLabel = "Sure?",
  pendingLabel = "Deleting…",
  onConfirm,
  disabled = false,
  size = "sm",
}: {
  label: string;
  confirmLabel?: string;
  pendingLabel?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  size?: "sm" | "default";
}) {
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  async function handleClick() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
      setArmed(false);
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size={size}
      onClick={handleClick}
      disabled={disabled || pending}
    >
      {pending ? <Spinner data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}
      {pending ? pendingLabel : armed ? confirmLabel : label}
    </Button>
  );
}
