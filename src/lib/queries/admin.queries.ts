import { queryOptions } from "@tanstack/react-query";
import {
  getAdminAnalytics,
  listApplications,
  listCastingRequests,
  listUsersWithRoles,
  getAppSettings,
} from "@/lib/admin.functions";

export const adminAnalyticsQuery = () =>
  queryOptions({
    queryKey: ["admin-analytics"] as const,
    queryFn: () => getAdminAnalytics(),
    staleTime: 30_000,
  });

export const applicationsListQuery = (
  filters?: Parameters<typeof listApplications>[0] extends undefined
    ? Record<string, unknown> | undefined
    : Parameters<typeof listApplications>[0],
) =>
  queryOptions({
    queryKey: ["admin-apps", filters ?? {}] as const,
    queryFn: () => (filters ? (listApplications as any)(filters) : (listApplications as any)()),
    staleTime: 15_000,
  });

export const castingListQuery = () =>
  queryOptions({
    queryKey: ["admin-casting"] as const,
    queryFn: () => listCastingRequests(),
    staleTime: 15_000,
  });

export const usersWithRolesQuery = () =>
  queryOptions({
    queryKey: ["users-with-roles"] as const,
    queryFn: () => listUsersWithRoles(),
    staleTime: 30_000,
  });

export const appSettingsQuery = () =>
  queryOptions({
    queryKey: ["app-settings"] as const,
    queryFn: () => getAppSettings(),
    staleTime: 60_000,
  });