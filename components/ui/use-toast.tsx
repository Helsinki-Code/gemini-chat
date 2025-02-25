"use client";

import { toast } from "sonner";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const showToast = (options: ToastOptions) => {
    const { title, description, variant } = options;
    if (variant === 'destructive') {
      toast.error(description || title);
    } else {
      toast.info(title, { description });
    }
  };

  return {
    toast: showToast
  };
}