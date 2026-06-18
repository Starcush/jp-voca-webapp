"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      duration={2500}
      offset={{ top: 16 }}
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-slate-800 bg-slate-950 text-white shadow-lg",
          title: "text-sm font-bold text-white",
        },
      }}
      visibleToasts={1}
    />
  );
}
