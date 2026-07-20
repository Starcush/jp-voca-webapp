"use client";

import { Check } from "lucide-react";
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
      icons={{
        success: (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-white">
            <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        ),
      }}
      visibleToasts={1}
    />
  );
}
