import { toast } from "sonner";

// Paths that used to exist but were removed. Any attempt to fetch or
// navigate to these should be blocked safely instead of producing a
// confusing 404 / network error.
const REMOVED_PREFIXES = [
  "/api/",
  "/embed/",
];

const REMOVED_EXACT = new Set<string>([
  "/api",
  "/embed",
]);

function isRemovedPath(pathname: string): boolean {
  if (REMOVED_EXACT.has(pathname)) return true;
  return REMOVED_PREFIXES.some((p) => pathname.startsWith(p));
}

function resolveUrl(input: RequestInfo | URL): URL | null {
  try {
    if (typeof input === "string") return new URL(input, window.location.origin);
    if (input instanceof URL) return input;
    if (input instanceof Request) return new URL(input.url, window.location.origin);
  } catch {
    return null;
  }
  return null;
}

function blockedResponse(pathname: string): Response {
  const body = JSON.stringify({
    error: "endpoint_removed",
    message: `The endpoint ${pathname} is no longer available.`,
  });
  return new Response(body, {
    status: 410,
    statusText: "Gone",
    headers: { "Content-Type": "application/json" },
  });
}

let installed = false;

export function installRemovedRoutesGuard() {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  // 1. Guard fetch() — block same-origin calls to removed endpoints.
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveUrl(input);
    if (url && url.origin === window.location.origin && isRemovedPath(url.pathname)) {
      console.warn(`[guard] Blocked fetch to removed endpoint: ${url.pathname}`);
      return Promise.resolve(blockedResponse(url.pathname));
    }
    return originalFetch(input as any, init);
  };

  // 2. Guard XHR — same logic for legacy callers.
  const OriginalXHR = window.XMLHttpRequest;
  if (OriginalXHR) {
    const open = OriginalXHR.prototype.open;
    OriginalXHR.prototype.open = function (
      method: string,
      url: string | URL,
      ...rest: any[]
    ) {
      try {
        const u = typeof url === "string" ? new URL(url, window.location.origin) : url;
        if (u.origin === window.location.origin && isRemovedPath(u.pathname)) {
          console.warn(`[guard] Blocked XHR to removed endpoint: ${u.pathname}`);
          // Redirect the request to a harmless data URL so it resolves with 410-style payload.
          const data = `data:application/json,${encodeURIComponent(
            JSON.stringify({ error: "endpoint_removed", path: u.pathname }),
          )}`;
          return open.call(this, method, data, ...(rest as [boolean]));
        }
      } catch {
        // fall through
      }
      return open.call(this, method, url as any, ...(rest as [boolean]));
    } as typeof open;
  }

  // 3. Guard link clicks — intercept anchors pointing at removed paths.
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (!isRemovedPath(url.pathname)) return;
      e.preventDefault();
      e.stopPropagation();
      console.warn(`[guard] Blocked navigation to removed route: ${url.pathname}`);
      toast.error("That endpoint is no longer available.");
    },
    { capture: true },
  );

  // 4. Guard programmatic navigation via window.open.
  const originalOpen = window.open;
  window.open = function (
    url?: string | URL,
    target?: string,
    features?: string,
  ): Window | null {
    try {
      if (url) {
        const u = typeof url === "string" ? new URL(url, window.location.origin) : url;
        if (u.origin === window.location.origin && isRemovedPath(u.pathname)) {
          console.warn(`[guard] Blocked window.open to removed route: ${u.pathname}`);
          toast.error("That endpoint is no longer available.");
          return null;
        }
      }
    } catch {
      // fall through
    }
    return originalOpen.call(window, url as any, target, features);
  } as typeof window.open;
}