"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: "border border-border bg-background text-foreground",
        duration: 3000,
      }}
    />
  );
}

// Simple re-export of sonner's toast function for compatibility
export { toast } from "sonner";