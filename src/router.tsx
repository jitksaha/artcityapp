import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { AppErrorFallback } from "@/components/AppErrorFallback";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    defaultPreloadStaleTime: 0,
    defaultStaleTime: 30_000,
    defaultPendingMs: 300,
    defaultPendingMinMs: 200,
    defaultErrorComponent: AppErrorFallback,
  });

  return router;
};
