import React, { useEffect } from "react";

function reportError(error: unknown, source: string) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  const body = JSON.stringify({
    source,
    message: normalized.message,
    stack: normalized.stack,
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
  });

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/monitor", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/monitor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  });
}

export function ErrorMonitor() {
  useEffect(() => {
    const onError = (event: ErrorEvent) =>
      reportError(event.error || event.message, "window-error");
    const onRejection = (event: PromiseRejectionEvent) =>
      reportError(event.reason, "unhandled-rejection");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    reportError(error, "react-boundary");
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
          <div className="glass max-w-md rounded-3xl p-8 text-center">
            <h1 className="font-display text-2xl font-semibold">Algo saiu do esperado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              O erro foi registrado. Recarregue a pagina para continuar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-lime px-4 py-2 text-sm font-semibold text-lime-foreground"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
