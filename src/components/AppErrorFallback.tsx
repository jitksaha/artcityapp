import { Link, useRouter } from "@tanstack/react-router";

type AppErrorFallbackProps = {
  error: Error;
  reset: () => void;
};

export function AppErrorFallback({ error, reset }: AppErrorFallbackProps) {
  const router = useRouter();
  const showDiagnostics = import.meta.env.DEV;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-2xl text-center">
        <p className="text-sm font-medium text-destructive">Page error</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Something went wrong while opening this page. Try again, or use the details below to identify the issue.
        </p>

        {showDiagnostics && (
          <details className="mt-6 rounded-md border border-border bg-muted/40 p-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Technical details
            </summary>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
              {`${error.name}: ${error.message}${error.stack ? `\n\n${error.stack}` : ""}`}
            </pre>
          </details>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}