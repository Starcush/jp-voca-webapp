type LoadingOverlayProps = {
  message: string;
  show: boolean;
};

export function LoadingOverlay({ message, show }: LoadingOverlayProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-50/90 px-6 backdrop-blur-sm">
      <div
        aria-live="polite"
        className="grid justify-items-center gap-4 rounded-lg border border-slate-200 bg-white px-6 py-5 text-center shadow-lg"
        role="status"
      >
        <div
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950"
        />
        <p className="text-sm font-bold text-slate-700">{message}</p>
      </div>
    </div>
  );
}
