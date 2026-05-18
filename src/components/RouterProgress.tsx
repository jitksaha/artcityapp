import { useEffect } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.12 });

export function RouterProgress() {
  const router = useRouter();
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });

  // Drive nprogress from router state changes
  useEffect(() => {
    if (isLoading) NProgress.start();
    else NProgress.done();
  }, [isLoading]);

  // Also hook into navigation events for snappier start
  useEffect(() => {
    const unsubBefore = router.subscribe("onBeforeNavigate", () => NProgress.start());
    const unsubResolved = router.subscribe("onResolved", () => NProgress.done());
    return () => {
      unsubBefore();
      unsubResolved();
    };
  }, [router]);

  return null;
}
